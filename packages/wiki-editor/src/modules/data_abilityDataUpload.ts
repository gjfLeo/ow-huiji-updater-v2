import type { ZodError } from "zod";
import type { WikiAbility } from "../models/ability";
import path from "node:path";
import destr from "destr";
import fse from "fs-extra";
import { abilityKeywords } from "../data/ability-keywords";
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

    for (const keywordItem of parsedData.keywords) {
      const keywordData = abilityKeywords.find(item => item.name === keywordItem.name);
      if (!keywordData) {
        logger.error(`未找到技能关键词 ${keywordItem.name}`);
        process.exit(1);
      }
      if (keywordItem.value === "" && !keywordData.description) {
        logger.error(`技能关键词 ${keywordItem.name} 缺少描述`);
        process.exit(1);
      }
      if (keywordItem.value) {
        if (keywordItem.value === keywordData.description) {
          keywordItem.value = "";
        }
        else {
          if (!keywordData.variations?.find(variation => variation === keywordItem.value)) {
            logger.error(`技能关键词 ${keywordItem.name} 的值 ${keywordItem.value} 不是描述或变体`);
            process.exit(1);
          }
        }
      }
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
    readBatchSize: 80,
    replaceBy: { namespace: 3500, prefix: "Ability/" },
  });
}
