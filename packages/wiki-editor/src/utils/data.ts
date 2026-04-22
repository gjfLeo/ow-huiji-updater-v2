import type { ZodError, ZodType } from "zod";
import type { WikiAbility } from "../models/ability";
import type { WikiHero } from "../models/hero";
import path from "node:path";
import { confirm } from "@inquirer/prompts";
import destr from "destr";
import { emptyDir, readdir } from "fs-extra";
import { ABILITY_DATA_PATH, HERO_DATA_PATH, OWLIB_STRINGS_EN, OWLIB_STRINGS_ZH } from "../constants/paths";
import { zWikiAbility } from "../models/ability";
import { zWikiHero } from "../models/hero";
import { wikiBatchGet } from "../wiki/batch";
import { logger, spinnerProgress } from "./logger";

export async function readHeroData() {
  const heroData: Record<string, WikiHero> = {};
  const dir = await readdir(HERO_DATA_PATH);
  const errors: ZodError[] = [];
  for (const filename of dir) {
    const file = Bun.file(path.join(HERO_DATA_PATH, filename));
    const { success, data: parsedData, error } = zWikiHero.safeParse(await file.json());
    if (!success) {
      errors.push(error);
      continue;
    }
    heroData[parsedData.key] = parsedData;
  }
  if (errors.length > 0) {
    logger.error("存在错误");
    errors.forEach(error => logger.info(error));
  }
  return {
    heroData,
    errors: errors.length > 0 ? errors : undefined,
  };
}

export async function readAbilityData() {
  const abilityData: Record<string, WikiAbility> = {};
  const dir = await readdir(ABILITY_DATA_PATH);
  const errors: ZodError[] = [];
  for (const filename of dir) {
    const file = Bun.file(path.join(ABILITY_DATA_PATH, filename));
    const { success, data: parsedData, error } = zWikiAbility.safeParse(await file.json());
    if (!success) {
      errors.push(error);
      continue;
    }

    abilityData[parsedData.key] = parsedData;
  }
  if (errors.length > 0) {
    logger.error("存在错误");
    errors.forEach(error => logger.info(error));
  }
  return {
    abilityData,
    errors: errors.length > 0 ? errors : undefined,
  };
}

export async function readStrings() {
  type StringsRaw = Record<string, { Value: string }>;
  const zhStrings: StringsRaw = await Bun.file(OWLIB_STRINGS_ZH).json();
  const enStrings: StringsRaw = await Bun.file(OWLIB_STRINGS_EN).json();
  const parseStrings = (strings: StringsRaw) =>
    Object.fromEntries(
      Object.entries(strings).map(([key, value]) => [key, value.Value]),
    );
  return {
    zhStrings: parseStrings(zhStrings),
    enStrings: parseStrings(enStrings),
  };
}

export async function wikiDownloadData(options: {
  prefix: string;
  batchSize?: number;
  outputDir: string;
  schema: ZodType;
  fileNameExtractor?: (data: any) => string;
}) {
  const {
    prefix,
    batchSize,
    outputDir,
    schema,
    fileNameExtractor = data => data.key.replaceAll("/", "_"),
  } = options;

  const confirmDownload = await confirm({
    message: "确认下载数据？本地文件将被覆盖。",
  });
  if (!confirmDownload) {
    return;
  }
  await emptyDir(outputDir);

  const dataPages = await wikiBatchGet({
    namespace: 3500,
    prefix,
    batchSize,
  });
  const count = Object.values(dataPages).length;
  spinnerProgress.start("保存文件", count);
  for (const content of Object.values(dataPages)) {
    const data = schema.parse(destr(content));
    const fileName = fileNameExtractor(data);
    await Bun.write(
      path.join(outputDir, `${fileName}.json`),
      `${JSON.stringify(data, null, 2)}\n`,
    );
    spinnerProgress.increment();
  }
  spinnerProgress.succeed();
}
