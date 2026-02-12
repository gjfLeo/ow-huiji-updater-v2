import path from "node:path";
import destr from "destr";
import fse from "fs-extra";
import { zWikiAbility } from "../models/ability";
import { spinnerProgress } from "../utils/logger";
import { wikiBatchGet } from "../wiki/batch";

export default async function abilityDataDownload() {
  const abilityDataPages = await wikiBatchGet({
    namespace: 3500,
    prefix: "Ability/",
    batchSize: 80,
  });

  const abilityCount = Object.values(abilityDataPages).length;

  const outputDir = path.join(__dirname, "../../assets/data/abilities");
  await fse.emptyDir(outputDir);
  spinnerProgress.start("保存文件", abilityCount);
  for (const content of Object.values(abilityDataPages)) {
    const abilityData = zWikiAbility.parse(destr(content));
    await fse.writeJSON(
      path.join(outputDir, `${abilityData.key.replaceAll("/", "_")}.json`),
      abilityData,
      { spaces: 2 },
    );
    spinnerProgress.increment();
  }
  spinnerProgress.succeed();
}
