import type { WikiHeroQuote } from "../models/hero-quote";
import path from "node:path";
import fse from "fs-extra";
import { STUB_DATA_PATH } from "../constants/paths";
import { spinnerProgress } from "../utils/logger";
import { wikiBatchEdit } from "../wiki/batch";

export default async function heroQuotesDataUpload() {
  const dataDir = path.join(__dirname, "../../assets/data/hero-quotes");
  const tabxData: Record<string, string> = {};
  const singleData: Record<string, WikiHeroQuote> = {};
  const dir = await fse.readdir(dataDir);
  spinnerProgress.start("读取文件", dir.length);
  for (const file of dir) {
    if (file.endsWith(".tabx")) {
      const heroKey = path.basename(file, ".tabx");
      const content = await Bun.file(path.join(dataDir, file)).text();
      tabxData[heroKey] = content;
    }
    else {
      const data = await Bun.file(path.join(dataDir, file)).json() as WikiHeroQuote;
      singleData[data.fileId] = data;
    }
    spinnerProgress.increment();
  }
  spinnerProgress.succeed();

  const pages = Object.fromEntries([
    ...Object.entries(tabxData).map(([heroKey, content]) => {
      const title = `Data:HeroQuotes/${heroKey}.tabx`;
      return [title, content];
    }),
    ...Object.values(singleData).map((data) => {
      const title = `Data:HeroQuotes/${data.fileId}.json`;
      return [title, JSON.stringify(data)];
    }),
    [
      "Data:Stub/HeroQuoteInfo.json",
      await Bun.file(path.join(STUB_DATA_PATH, "HeroQuoteInfo.json")).text(),
    ],
  ]);
  await wikiBatchEdit(pages, {
    summary: "更新英雄语音数据（ow-huiji-updater）",
    compareByJson: true,
    readBatchSize: 10,
    replaceBy: { namespace: 3500, prefix: "HeroQuotes/" },
  });
}
