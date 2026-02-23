import type { ZodError } from "zod";
import type { WikiHero } from "../models/hero";
import { readdir } from "node:fs/promises";
import path from "node:path";
import destr from "destr";
import { zWikiHero } from "../models/hero";
import { logger, spinnerProgress } from "../utils/logger";
import { wikiBatchEdit, wikiBatchGet } from "../wiki/batch";

const dataDir = path.resolve(__dirname, "../../assets/data/heroes");

export default async function heroDataUpload() {
  const heroData: Record<string, WikiHero> = {};
  const dir = await readdir(dataDir);
  spinnerProgress.start("读取文件", dir.length);
  const fileErrors: ZodError[] = [];
  for (const filename of dir) {
    const file = Bun.file(path.join(dataDir, filename));
    const { success, data: parsedData, error } = zWikiHero.safeParse(await file.json());
    if (!success) {
      fileErrors.push(error);
      continue;
    }
    heroData[parsedData.key] = parsedData;
    spinnerProgress.increment();
  }
  spinnerProgress.succeed();
  if (fileErrors.length > 0) {
    logger.error("存在错误，停止上传");
    fileErrors.forEach(error => logger.info(error));
    return;
  }

  const pages = Object.fromEntries(
    Object.values(heroData).map((hero) => {
      const title = `Data:Hero/${hero.key}.json`;
      return [title, JSON.stringify(hero)];
    }),
  );
  await wikiBatchEdit(pages, {
    formatter: content => JSON.stringify(zWikiHero.parse(destr(content))),
    summary: "更新英雄数据（ow-huiji-updater）",
  });

  logger.info("更新英雄故事页面");
  const storyPages = Object.fromEntries(
    Object.values(heroData).map((hero) => {
      const title = `${hero.name}/英雄故事`;
      return [title, `{{英雄故事|${hero.name}}}`];
    }),
  );
  await wikiBatchEdit(storyPages, {
    formatter: content => content,
    summary: "更新英雄故事（ow-huiji-updater）",
  });

  logger.info("初始化英雄台词和语音页面");
  const heroQuotePageTitles = Object.values(heroData).map(hero => `${hero.name}/台词和语音`);
  const heroQuotePages = await wikiBatchGet({
    titles: heroQuotePageTitles,
    batchSize: 20,
  });
  const heroQuotePageToUpdate: Record<string, string> = {};
  for (const title of heroQuotePageTitles) {
    if (!heroQuotePages[title] || !heroQuotePages[title].startsWith("{{HeroQuotePage")) {
      heroQuotePageToUpdate[title] = "{{HeroQuotePage\n|hero={{ROOTPAGENAME}}\n}}";
    }
  }
  if (Object.keys(heroQuotePageToUpdate).length > 0) {
    await wikiBatchEdit(heroQuotePageToUpdate, {
      summary: "初始化英雄台词和语音页面（ow-huiji-updater）",
    });
  }
}
