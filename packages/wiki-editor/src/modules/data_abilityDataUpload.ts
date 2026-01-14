import type { ZodError } from "zod";
import type { WikiAbility } from "../models/ability";
import path from "node:path";
import destr from "destr";
import fse from "fs-extra";
import { zWikiAbility } from "../models/ability";
import { logger, spinnerProgress } from "../utils/logger";
import { wikiBatchEdit } from "../wiki/batch";

export default async function abilityDataUpload() {
  const dataDir = path.join(__dirname, "../../assets/data/abilities");
  const abilityData: Record<string, WikiAbility> = {};
  const dir = await fse.readdir(dataDir);
  spinnerProgress.start("读取文件", dir.length);
  const fileErrors: ZodError[] = [];
  for (const file of dir) {
    const data = await fse.readJson(path.join(dataDir, file));
    const { success, data: parsedData, error } = zWikiAbility.safeParse(data);
    if (!success) {
      fileErrors.push(error);
      continue;
    }
    abilityData[data.key] = parsedData;
    spinnerProgress.increment();
  }
  spinnerProgress.succeed();
  if (fileErrors.length > 0) {
    logger.error("存在错误，停止上传");
    fileErrors.forEach(error => logger.info(error));
    return;
  }

  const pages = Object.fromEntries(
    Object.values(abilityData).map((ability) => {
      const title = `Data:Ability/${ability.key}.json`;
      return [title, JSON.stringify(ability)];
    }),
  );
  await wikiBatchEdit(pages, {
    formatter: content => JSON.stringify(zWikiAbility.parse(destr(content))),
    summary: "更新技能数据（ow-huiji-updater）",
  });
}
