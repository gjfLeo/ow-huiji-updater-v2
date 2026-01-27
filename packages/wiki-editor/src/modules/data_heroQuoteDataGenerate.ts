import type { WikiHero } from "../models/hero";
import type { QuoteCriteriaCondition, QuoteCriteriaSingleCondition, WikiHeroQuote } from "../models/hero-quote";
import path from "node:path";
import fse from "fs-extra";
import { convertPathToPattern, glob } from "tinyglobby";
import { HeroQuoteCelebrationName, HeroQuoteGenderName, HeroQuoteHeroNameMap, HeroQuoteHeroTagNames, HeroQuoteScriptDesc, HeroQuoteScriptDesc_Unknown } from "../data/hero-quote";
import { logger, spinner, spinnerProgress } from "../utils/logger";
import { Tabx } from "../utils/tabx";

const RAW_DATA_PATH = path.resolve(__dirname, "../../output/owlib");
const OUTPUT_PATH = path.resolve(__dirname, "../../assets/data/hero-quotes");
const heroKeyByName = await readHeroKeyByName();

let currentData: WikiHeroQuote = {} as WikiHeroQuote;

export default async function heroQuoteDataGenerate() {
  // MARK: 加载资源
  spinner.start("加载资源");
  const decoder = new TextDecoder("utf-16");
  const zhSubtitles = await readSubtitles(path.join(RAW_DATA_PATH, "logs", "list-subtitles-real-1.log"));
  const enSubtitles = await readSubtitles(path.join(RAW_DATA_PATH, "logs", "list-subtitles-real-2.log"));
  const voiceFiles = await glob(
    [
      "**/*.txt",
      "!**/*-criteria.txt",
      "!**/*-weight.txt",
    ],
    {
      cwd: path.join(RAW_DATA_PATH, "extract/HeroVoice"),
    },
  );
  spinner.succeed();

  const dataByHero: Record<string, WikiHeroQuote[]> = {};

  // MARK: 处理文件
  spinnerProgress.start("处理文件", voiceFiles.length);
  for (const voiceFile of voiceFiles) {
    const fileId = path.basename(voiceFile).match(/^([0-9A-F]{12}\.0B2)/)?.[0] as `${string}.0B2`;
    if (!fileId) {
      logger.error(`文件名格式错误：${voiceFile}`);
      process.exit(1);
    }
    const fileId_n = Number.parseInt(fileId.replace(".0B2", ""), 16);
    const pathSegments = path.dirname(voiceFile).split("/");
    const heroName = pathSegments.shift();
    const skin = pathSegments.shift();
    const category = pathSegments.join("/");
    if (!heroName || !skin || !category) {
      logger.error(`目录名格式错误：${voiceFile}`);
      process.exit(1);
    }
    const hero = heroKeyByName[heroName] ?? "npc";

    const zhSubtitle = zhSubtitles[fileId];
    const enSubtitle = enSubtitles[fileId];
    if (!zhSubtitle || !enSubtitle) {
      logger.error(`字幕不存在：${voiceFile}`);
      process.exit(1);
    }

    const heroQuoteData: WikiHeroQuote = {
      _dataType: "HeroQuote",
      fileId,
      fileId_n,
      hero,
      heroName,
      skin: skin === "Default" ? undefined : skin,
      category,
      subtitle: zhSubtitle,
      subtitle_en: enSubtitle,
    };
    currentData = heroQuoteData;
    const criteriaFile = Bun.file(path.join(RAW_DATA_PATH, "extract/HeroVoice", path.dirname(voiceFile), `${fileId}-criteria.txt`));
    if (await criteriaFile.exists()) {
      const criteriaString = decoder.decode(await criteriaFile.arrayBuffer());
      heroQuoteData.criteria = JSON.stringify(parseCriteria(criteriaString));
    }

    const weightFile = Bun.file(path.join(RAW_DATA_PATH, "extract/HeroVoice", path.dirname(voiceFile), `${fileId}-weight.txt`));
    if (await weightFile.exists()) {
      const weightString = decoder.decode(await weightFile.arrayBuffer());
      heroQuoteData.weight = Number.parseFloat(weightString);
    }

    dataByHero[hero] ??= [];
    dataByHero[hero]!.push(heroQuoteData);
    spinnerProgress.increment();
  }

  // MARK: 输出文件
  spinner.start("输出文件");
  await fse.emptyDir(OUTPUT_PATH);
  const invalidListForTabx: WikiHeroQuote[] = [];
  for (const [heroKey, heroQuotes] of Object.entries(dataByHero)) {
    heroQuotes.sort((a, b) => {
      if (a.skin !== b.skin) {
        if (!a.skin) return -1;
        if (!b.skin) return 1;
        return a.skin.localeCompare(b.skin);
      }
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      if (a.criteria !== b.criteria) {
        if (!a.criteria) return -1;
        if (!b.criteria) return 1;
        return a.criteria.localeCompare(b.criteria);
      }
      if ((a.weight ?? 1) !== (b.weight ?? 1)) {
        return (b.weight ?? 1) - (a.weight ?? 1);
      }
      return a.fileId_n - b.fileId_n;
    });
    const tabx = Tabx.fromHeaders([
      { key: "_dataType", type: "string" },
      { key: "fileId", type: "string" },
      { key: "fileId_n", type: "number" },
      { key: "hero", type: "string" },
      { key: "heroName", type: "string" },
      { key: "skin", type: "string" },
      { key: "category", type: "string" },
      { key: "subtitle", type: "string" },
      { key: "subtitle_en", type: "string" },
      { key: "criteria", type: "string" },
      { key: "weight", type: "number" },
    ]);
    for (const heroQuote of heroQuotes) {
      if (tabx.isValidItem(heroQuote)) {
        tabx.addItem(heroQuote);
      }
      else {
        invalidListForTabx.push(heroQuote);
      }
    }
    await Bun.write(
      path.join(OUTPUT_PATH, `${heroKey}.tabx`),
      JSON.stringify(tabx.toJson(), null, 2),
    );
  }
  for (const heroQuote of invalidListForTabx) {
    await Bun.write(
      path.join(OUTPUT_PATH, `${heroQuote.fileId}.json`),
      JSON.stringify(heroQuote, null, 2),
    );
  }
  spinner.succeed();
}

async function readHeroKeyByName() {
  const heroDataGlob = path.resolve(__dirname, "../../assets/data/heroes/*.json");
  const map: Record<string, string> = {};
  for (const filePath of await glob(convertPathToPattern(heroDataGlob))) {
    const heroData = await Bun.file(filePath).json() as WikiHero;
    map[heroData.name] = heroData.key;
  }
  return map;
}

async function readSubtitles(filePath: string) {
  const file = Bun.file(filePath);
  if (!await file.exists()) {
    logger.error(`文件不存在：${filePath}`);
    process.exit(1);
  }
  const subtitles: Record<string, string> = {};
  let lastId = "";
  for (const line of (await file.text()).split(/\r?\n/)) {
    if (line.startsWith("[")) {
      continue;
    }
    const match = line.match(/^[0-9A-F]{12}\.05F: (?<id>[0-9A-F]{12}\.0B2) - (?<subtitle>.*)$/);
    if (match) {
      const id = match.groups!.id!;
      const subtitle = match.groups!.subtitle!;
      subtitles[id] = subtitle;
      lastId = id;
    }
    else if (lastId) {
      subtitles[lastId] += `\n${line}`;
    }
  }
  for (const id in subtitles) {
    subtitles[id] = subtitles[id]!.trim();
  }
  return subtitles as Record<`${string}.0B2`, string>;
}

// MARK: 解析条件

function parseCriteria(criteriaString: string): QuoteCriteriaCondition {
  const lines = criteriaString.trim().split(/[\r\n]+/).map(line => line.trimEnd());
  const condition = parseCriteriaNode(lines, 0).condition;
  return condition;
}
function parseCriteriaNode(
  lines: string[],
  lineIndex: number,
): { condition: QuoteCriteriaCondition; nextLineIndex: number } {
  const line = lines[lineIndex]!;

  // 检查是否为嵌套节点
  if (line.trimStart().startsWith("Nested - ")) {
    const match = line.match(/Nested - (\d+)\/(\d+) Required:/);
    if (!match) {
      throw new Error(`Invalid nested node format: ${line}`);
    }
    const nestedIndentation = getIndentation(line);

    const node: QuoteCriteriaCondition = {
      type: "nested",
      total: Number(match[2]!),
      needed: Number(match[1]!),
      conditions: [],
    };

    let currentIndex = lineIndex + 1;

    // 解析所有子节点
    while (currentIndex < lines.length) {
      const currentLineIndent = getIndentation(lines[currentIndex]!);

      // 如果缩进级别小于等于当前节点的缩进，说明子节点解析完毕
      if (currentLineIndent <= nestedIndentation) {
        break;
      }

      // 解析子节点
      const { condition: childCondition, nextLineIndex: endIndex } = parseCriteriaNode(lines, currentIndex);
      node.conditions.push(childCondition);
      currentIndex = endIndex;
    }

    return { condition: node, nextLineIndex: currentIndex };
  }

  let criteriaString = line.trim();
  let negative: boolean | undefined;
  if (criteriaString.startsWith("NOT (")) {
    negative = true;
    criteriaString = criteriaString.match(/^NOT \((.+)\)$/)![1]!.trim()!;
  }
  const condition = parseCriteriaSingleNode(criteriaString, negative);
  if (condition) {
    return { condition, nextLineIndex: lineIndex + 1 };
  }
  logger.error("条件解析失败");
  logger.error(`  ${line.trim()}`);
  logger.error(`  ${JSON.stringify(currentData)}`);
  return { condition: { type: "unknown", raw: criteriaString, negative }, nextLineIndex: lineIndex + 1 };
}

/**
 * @param criteriaString 非NOT、非NESTED 单条件字符串
 * @param negative 是否为NOT条件
 */
function parseCriteriaSingleNode(criteriaString: string, negative?: boolean): QuoteCriteriaSingleCondition | undefined {
  if (false
    || criteriaString.startsWith("STU_9665B416")
    || criteriaString.startsWith("STU_A9B89EC9") // PVE相关
    || criteriaString.startsWith("STU_E6EBD07B") // 类似英雄标签 机械/黑爪
    || criteriaString === "Unknown: STU_B1A2B57D"
    || criteriaString === "Hero Interaction: Unknown664"
    || criteriaString === "Hero Interaction: Unknown81B"
    || criteriaString === "Hero Interaction: UnknownE41"
  ) {
    return { type: "unknown", raw: criteriaString, negative };
  }

  // scripted
  if (criteriaString.startsWith("Scripted Event:")) {
    const match = criteriaString.match(/^Scripted Event:\s*(?<script>\S.*)$/);
    const scriptName = match?.groups?.script?.trim();
    if (!scriptName) return undefined;
    const scriptId = (scriptName.startsWith("Unknown")
      ? scriptName.substring(7)
      : scriptName.match(/\((.*)\)/)![1]!).padStart(6, "0");
    const scriptDesc = HeroQuoteScriptDesc[scriptId] ?? HeroQuoteScriptDesc_Unknown[scriptId];
    if (scriptDesc === undefined) return undefined;
    return {
      type: "scripted",
      script: scriptName,
      scriptDesc: scriptDesc || "未知",
      negative,
    };
  }

  // toHero
  if (criteriaString.startsWith("Is Hero:")) {
    criteriaString = criteriaString.replace("Is Hero:", "Hero Interaction:");
  }
  if (criteriaString.startsWith("Hero Interaction:")) {
    const match = criteriaString.match(/^Hero Interaction:\s*(?<hero>\S.*)$/);
    const heroName = match?.groups?.hero?.trim();
    if (!heroName) return undefined;
    if (HeroQuoteHeroNameMap[heroName]) {
      return { type: "toHero", hero: HeroQuoteHeroNameMap[heroName], negative };
    }
    if (HeroQuoteHeroTagNames[heroName]) {
      return { type: "toHero", heroTag: HeroQuoteHeroTagNames[heroName], negative };
    }
    if (!heroKeyByName[heroName]) {
      logger.error(`未知的英雄 ${heroName}`);
      return undefined;
    }
    return { type: "toHero", hero: heroName, negative };
  }
  // withHero
  if (criteriaString.startsWith("Hero On Team:")) {
    const match = criteriaString.match(/^Hero On Team:\s*(?<hero>\S.*)$/);
    const heroName = match?.groups?.hero?.trim();
    if (!heroName) return undefined;
    if (!heroKeyByName[heroName]) {
      logger.error(`未知的英雄 ${heroName}`);
      return undefined;
    }
    return { type: "withHero", hero: heroName, negative };
  }
  if (criteriaString.startsWith("Tag On Teammate:")) {
    const match = criteriaString.match(/^Tag On Teammate:\s*(?<tag>\S.*)$/);
    const tag = match?.groups?.tag?.trim();
    if (!tag) return undefined;
    const tagName = HeroQuoteHeroTagNames[tag];
    if (!tagName) return undefined;
    return { type: "withHero", heroTag: tagName, negative };
  }

  // toGender
  if (criteriaString.startsWith("Required Gender:")) {
    const gender = criteriaString.substring(16).trim();
    const genderKey = HeroQuoteGenderName[gender as keyof typeof HeroQuoteGenderName];
    if (!genderKey) return undefined;
    return { type: "toGender", gender: genderKey, negative };
  }

  // team
  if (criteriaString.startsWith("On Team Number:")) {
    if (criteriaString === "On Team Number: TeamRed. UnkBool: True") {
      return { type: "team", team: "attack", negative };
    }
    if (criteriaString === "On Team Number: TeamBlue. UnkBool: True") {
      return { type: "team", team: "defense", negative };
    }
    return undefined;
  }

  // map
  if (criteriaString.startsWith("On Map:")) {
    const match = criteriaString.match(/^On Map:\s*(?<map>\S.*)\. Allow Event Variants: (?<allowEventVariants>true|false)$/);
    const map = match?.groups?.map?.trim();
    if (!map) return undefined;
    const notEventVariants = match?.groups?.allowEventVariants === "false" ? true : undefined;
    return { type: "map", map, notEventVariants, negative };
  }

  // celebration
  if (criteriaString.startsWith("Active Celebration:")) {
    const match = criteriaString.match(/^Active Celebration:\s*(?<celebration>\S.*)$/);
    const celebration = match?.groups?.celebration?.trim();
    if (!celebration) return undefined;
    const celebrationId = celebration.startsWith("Unknown")
      ? celebration.substring(7)
      : celebration.match(/\((.*)\)/)![1]!;
    let celebrationName = HeroQuoteCelebrationName[celebrationId];
    if (!celebrationName) {
      celebrationName = `未知节日（${celebrationId}）`;
    };
    return { type: "celebration", celebration: celebrationName, negative };
  }

  // gameMode
  if (criteriaString.startsWith("On Game Mode:")) {
    const match = criteriaString.match(/^On Game Mode:\s*(?<gameMode>\S.*)$/);
    const gameMode = match?.groups?.gameMode?.trim();
    if (!gameMode) return undefined;
    return { type: "gameMode", gameMode, negative };
  }

  // mission
  if (criteriaString.startsWith("On Mission:")) {
    const match = criteriaString.match(/^On Mission:\s*(?<mission>\S.*)$/);
    const mission = match?.groups?.mission?.trim();
    if (!mission) return undefined;
    return { type: "mission", mission, negative };
  }
  if (criteriaString.startsWith("On Mission Objective:")) {
    const match = criteriaString.match(/^On Mission Objective:\s*(?<missionObjective>\S.*)$/);
    const objective = match?.groups?.missionObjective?.trim();
    if (!objective) return undefined;
    return { type: "mission", objective, negative };
  }

  // talent
  if (criteriaString.startsWith("Has Talent:")) {
    const match = criteriaString.match(/^Has Talent:\s*(?<talent>\S.*)$/);
    const talent = match?.groups?.talent?.trim();
    if (!talent) return undefined;
    return { type: "talent", talent, negative };
  }

  return undefined;
}

function getIndentation(line: string): number {
  const leadingSpaces = line.match(/^\s*/)?.[0] || "";
  return Math.floor(leadingSpaces.length / 4);
}
