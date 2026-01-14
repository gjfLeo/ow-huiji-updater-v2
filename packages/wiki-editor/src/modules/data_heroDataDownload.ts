import path from "node:path";
import destr from "destr";
import fse from "fs-extra";
import { zWikiHero } from "../models/hero";
import { spinnerProgress } from "../utils/logger";
import { wikiBatchGet } from "../wiki/batch";

export default async function heroDataDownload() {
  const heroDataPages = await wikiBatchGet({
    namespace: 3500,
    prefix: "Hero/",
  });

  const heroCount = Object.values(heroDataPages).length;

  const outputDir = path.resolve(__dirname, "../../assets/data/heroes");
  await fse.emptyDir(outputDir);
  spinnerProgress.start("保存文件", heroCount);
  for (const content of Object.values(heroDataPages)) {
    const heroData = zWikiHero.parse(destr(content));
    const file = Bun.file(path.join(outputDir, `${heroData.key}.json`));
    await file.write(JSON.stringify(heroData, null, 2));
    await Bun.write(
      path.join(outputDir, `${heroData.key}.json`),
      JSON.stringify(heroData, null, 2),
    );
    spinnerProgress.increment();
  }
  spinnerProgress.succeed();
}
