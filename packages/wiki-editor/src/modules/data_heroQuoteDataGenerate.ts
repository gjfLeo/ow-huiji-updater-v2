import type { WikiHero } from "../models/hero";
import type { QuoteCriteriaCondition, QuoteCriteriaSingleCondition, WikiHeroConversation, WikiHeroQuote } from "../models/hero-quote";
import type { TabxInputHeader } from "../utils/tabx";
import path from "node:path";
import destr from "destr";
import fse from "fs-extra";
import { convertPathToPattern, glob } from "tinyglobby";
import z from "zod";
import { CategoryNameMap, HeroQuoteCelebrationName, HeroQuoteGenderName, HeroQuoteHeroNameMap, HeroQuoteHeroTagNames, HeroQuoteScriptDesc, HeroQuoteScriptDesc_Unknown, NonVoiceLineCategoryNameMap } from "../data/hero-quote";
import heroQuoteCategoriesToml from "../data/hero-quote-categories.toml";
import { zWikiHeroQuote } from "../models/hero-quote";
import { logger, spinner, spinnerProgress } from "../utils/logger";
import { Tabx } from "../utils/tabx";
import { wikiBatchGet } from "../wiki/batch";

const RAW_DATA_PATH = path.resolve(__dirname, "../../output/owlib");
const OUTPUT_PATH = path.resolve(__dirname, "../../assets/data/hero-quotes");
const CURRENT_VERSION = "2.21";
const heroKeyByName = await readHeroKeyByName();

const tabxHeaders: TabxInputHeader[] = [
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
  { key: "conversations", type: "string", isArray: true },
  { key: "added", type: "string" },
  { key: "removed", type: "string" },
];

let currentData: WikiHeroQuote = {} as WikiHeroQuote;

export default async function heroQuoteDataGenerate() {
  {
    const categoryNameSet = new Set<string>();
    [
      ...Object.values(NonVoiceLineCategoryNameMap),
      ...Object.values(CategoryNameMap),
    ].forEach((categoryName) => {
      if (categoryNameSet.has(categoryName)) {
        logger.error(`重复分类：${categoryName}`);
        process.exit(1);
      }
      categoryNameSet.add(categoryName);
    });
  }

  // MARK: 读取旧数据
  const oldPages = await wikiBatchGet({ namespace: 3500, prefix: "HeroQuotes/" });
  const dataByHero: Record<string, Record<string, WikiHeroQuote>> = {};
  for (const [pageTitle, pageContent] of Object.entries(oldPages)) {
    if (pageTitle.endsWith(".json")) {
      const wikiQuote = zWikiHeroQuote.parse(destr(pageContent));
      wikiQuote.removed ??= CURRENT_VERSION;
      dataByHero[wikiQuote.hero] ??= {};
      dataByHero[wikiQuote.hero]![wikiQuote.fileId] = wikiQuote;
    }
    else {
      const wikiQuoteTabx = Tabx.fromJson<WikiHeroQuote>(destr(pageContent));
      const heroKey = wikiQuoteTabx.toJson().data[0]![3] as string;
      dataByHero[heroKey] ??= {};

      wikiQuoteTabx.toJson().data.forEach((item) => {
        const fileId = item[1] as string;
        dataByHero[heroKey]![fileId] = zWikiHeroQuote.parse({
          _dataType: item[0],
          fileId: item[1],
          fileId_n: item[2],
          hero: item[3],
          heroName: item[4],
          skin: item[5] ?? undefined,
          category: item[6],
          subtitle: item[7],
          subtitle_en: item[8],
          criteria: item[9] ?? undefined,
          weight: item[10] ?? undefined,
          conversations: item[11] ? (item[11] as string).split(";") : undefined,
          added: item[12] ?? undefined,
          removed: item[13] ?? CURRENT_VERSION,
        });
      });
    }
  }
  logger.success(`成功加载 ${Object.values(dataByHero).flatMap(Object.values).length} 条旧数据`);

  // MARK: 加载资源
  spinner.start("加载资源");
  const decoder = new TextDecoder("utf-16");
  const zhSubtitles = await readSubtitles(path.join(RAW_DATA_PATH, "logs", "list-subtitles-real-1.log"));
  const enSubtitles = await readSubtitles(path.join(RAW_DATA_PATH, "logs", "list-subtitles-real-2.log"));
  const heroVoiceFiles = await glob(
    ["**/*.txt", "!**/*-criteria.txt", "!**/*-weight.txt"],
    { cwd: path.join(RAW_DATA_PATH, "extract/HeroVoice") },
  );
  const npcVoiceFiles = await glob(
    ["**/*.txt", "!**/*-criteria.txt", "!**/*-weight.txt"],
    { cwd: path.join(RAW_DATA_PATH, "extract/NPCVoice") },
  );

  const heroQuoteCategories = z.record(z.string(), z.record(z.string().regex(/^[0-9A-F]{4}$/), z.string())).parse(heroQuoteCategoriesToml);
  for (const [group, categoryMap] of Object.entries(heroQuoteCategories)) {
    for (const [categoryGuid, categoryName] of Object.entries(categoryMap)) {
      CategoryNameMap[categoryGuid] = [...group.split("/"), ...categoryName.split("/")].join("/");
    }
  }

  spinner.succeed();

  // MARK: 处理语音文件
  spinnerProgress.start("处理语音文件", heroVoiceFiles.length + npcVoiceFiles.length);
  for (const voiceFile of heroVoiceFiles) {
    const fileId = path.basename(voiceFile).match(/^([0-9A-F]{12}\.0B2)/)?.[0] as `${string}.0B2`;
    if (!fileId) {
      logger.error(`文件名格式错误：${voiceFile}`);
      process.exit(1);
    }
    const fileId_n = Number.parseInt(fileId.replace(".0B2", ""), 16);
    const pathSegments = path.dirname(voiceFile).split("/");
    const heroName = pathSegments.shift();
    const skin = pathSegments.shift();
    let category = pathSegments.join("/");
    if (!heroName || !skin || !category) {
      logger.error(`目录名格式错误：${voiceFile}`);
      console.info(heroName, skin, category);
      process.exit(1);
    }
    const hero = heroKeyByName[heroName] ?? "npc";

    const zhSubtitle = zhSubtitles[fileId] ?? "";
    const enSubtitle = enSubtitles[fileId] ?? "";
    if (!category.startsWith("Unknown/")) {
      logger.error(`未清除分类：${category}`);
      process.exit(1);
    }
    const categoryGuid = category.substring(8, category.length - 4).padStart(4, "0");
    category = CategoryNameMap[categoryGuid] ?? NonVoiceLineCategoryNameMap[categoryGuid] ?? `Unknown/${categoryGuid}`;

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

    dataByHero[hero] ??= {};
    if (dataByHero[hero]![fileId]) {
      heroQuoteData.added = dataByHero[hero]![fileId]!.added;
      dataByHero[hero]![fileId] = heroQuoteData;
    }
    else {
      heroQuoteData.added = CURRENT_VERSION;
      dataByHero[hero]![fileId] = heroQuoteData;
    }
    spinnerProgress.increment();
  }
  for (const voiceFile of npcVoiceFiles) {
    const fileId = path.basename(voiceFile).match(/^([0-9A-F]{12}\.0B2)/)?.[0] as `${string}.0B2`;

    if (!fileId) {
      logger.error(`文件名格式错误：${voiceFile}`);
      process.exit(1);
    }
    const fileId_n = Number.parseInt(fileId.replace(".0B2", ""), 16);
    const pathSegments = path.dirname(voiceFile).split("/");
    const heroName = pathSegments.shift();
    let category = pathSegments.join("/");
    if (!heroName || !category) {
      logger.error(`目录名格式错误：${voiceFile}`);
      console.info(heroName, category);
      process.exit(1);
    }
    const hero = heroKeyByName[heroName] ?? "npc";

    const zhSubtitle = zhSubtitles[fileId] ?? "";
    const enSubtitle = enSubtitles[fileId] ?? "";
    if (!category.startsWith("Unknown/")) {
      logger.error(`未清除分类：${category}`);
      process.exit(1);
    }
    const categoryGuid = category.substring(8, category.length - 4).padStart(4, "0");
    category = CategoryNameMap[categoryGuid] ?? NonVoiceLineCategoryNameMap[categoryGuid] ?? `Unknown/${categoryGuid}`;
    // category = `NPC/${category}`;

    const heroQuoteData: WikiHeroQuote = {
      _dataType: "HeroQuote",
      fileId,
      fileId_n,
      hero,
      heroName,
      category,
      subtitle: zhSubtitle,
      subtitle_en: enSubtitle,
    };
    currentData = heroQuoteData;
    const criteriaFile = Bun.file(path.join(RAW_DATA_PATH, "extract/NPCVoice", path.dirname(voiceFile), `${fileId}-criteria.txt`));
    if (await criteriaFile.exists()) {
      const criteriaString = decoder.decode(await criteriaFile.arrayBuffer());
      heroQuoteData.criteria = JSON.stringify(parseCriteria(criteriaString));
    }

    const weightFile = Bun.file(path.join(RAW_DATA_PATH, "extract/NPCVoice", path.dirname(voiceFile), `${fileId}-weight.txt`));
    if (await weightFile.exists()) {
      const weightString = decoder.decode(await weightFile.arrayBuffer());
      heroQuoteData.weight = Number.parseFloat(weightString);
    }

    dataByHero[hero] ??= {};
    if (dataByHero[hero]![fileId]) {
      heroQuoteData.added = dataByHero[hero]![fileId]!.added;
      dataByHero[hero]![fileId] = heroQuoteData;
    }
    else {
      heroQuoteData.added = CURRENT_VERSION;
      dataByHero[hero]![fileId] = heroQuoteData;
    }
    spinnerProgress.increment();
  }
  spinnerProgress.succeed();

  // MARK: 处理对话列表
  spinner.start("处理对话列表");
  const conversationData: Record<string, WikiHeroConversation> = {};
  const conversationFolders = await glob(convertPathToPattern(path.join(RAW_DATA_PATH, "extract/HeroConvo/*/*.0D0")), {
    onlyDirectories: true,
    onlyFiles: false,
  });
  const conversationListFile = await Bun.file(path.join(RAW_DATA_PATH, "json/conversations.json")).json();
  const conversationListFileMap = Object.fromEntries(
    conversationListFile.map((item: any) => [item.GUID, item]),
  );
  for (const conversationFolder of conversationFolders) {
    const conversationId = path.basename(conversationFolder);
    const conversationListData = conversationListFileMap[conversationId];
    if (!conversationListData) {
      throw new Error(`Conversation not found in list: ${conversationId}`);
    }
    const conversation: WikiHeroConversation = {
      conversationId,
      weight: conversationListData.Weight as number,
      quotes: [],
    };
    const quoteFiles = await fse.readdir(conversationFolder);
    const quoteFilesByFileNumber: Record<number, string> = {};
    for (const quoteFile of quoteFiles) {
      const match = quoteFile.match(/^(?<fileNumber>\d+)-/);
      if (!match) {
        throw new Error(`Invalid quote file format: ${quoteFile}`);
      }
      const fileNumber = Number(match.groups!.fileNumber!);
      quoteFilesByFileNumber[fileNumber] = quoteFile;
    }

    for (let i = 0; i < conversationListData.Voicelines.length; i++) {
      const quoteFile = quoteFilesByFileNumber[i + 1];
      const quoteListItem = conversationListData.Voicelines[i]!;

      const conversationQuotes: WikiHeroConversation["quotes"][0] = {
        voiceLineId: quoteListItem.VoicelineGUID,
        position: quoteListItem.Position as number,
      };
      if (quoteFile) {
        const match = quoteFile.match(/^(?<fileIndex>\d+)-(?<hero>\S+)-(?<fileId>\w{12}\.0B2)/);
        if (!match) {
          throw new Error(`Invalid quote file format: ${quoteFile}`);
        }
        const heroName = match.groups!.hero!;
        const fileId = match.groups!.fileId!;
        conversationQuotes.fileId = fileId;
        conversationQuotes.hero = heroName;
        // 在HeroQuote数据中关联对话信息
        const heroKey = heroKeyByName[heroName] ?? "npc";
        const heroQuoteData = dataByHero[heroKey]![fileId];
        if (heroQuoteData) {
          heroQuoteData.conversations ??= [];
          heroQuoteData.conversations.push(`${conversationId}#${conversationQuotes.position}`);
          heroQuoteData.conversations.sort();
        }
      }
      conversation.quotes.push(conversationQuotes);
    }
    conversationData[conversationId] = conversation;
  }
  spinner.succeed();

  // MARK: 输出文件
  spinner.start("输出文件");
  await fse.emptyDir(OUTPUT_PATH);
  const invalidListForTabx: WikiHeroQuote[] = [];
  for (const [heroKey, heroQuotes] of Object.entries(dataByHero)) {
    const heroQuoteList = Object.values(heroQuotes);
    heroQuoteList.sort((a, b) => {
      // if (a.skin !== b.skin) {
      //   if (!a.skin) return -1;
      //   if (!b.skin) return 1;
      //   return a.skin.localeCompare(b.skin);
      // }
      // if (a.category !== b.category) {
      //   return a.category.localeCompare(b.category);
      // }
      // if (a.criteria !== b.criteria) {
      //   if (!a.criteria) return -1;
      //   if (!b.criteria) return 1;
      //   return a.criteria.localeCompare(b.criteria);
      // }
      // if ((a.weight ?? 1) !== (b.weight ?? 1)) {
      //   return (b.weight ?? 1) - (a.weight ?? 1);
      // }
      return a.fileId_n - b.fileId_n;
    });
    const tabx = Tabx.fromHeaders(tabxHeaders);
    for (const heroQuote of heroQuoteList) {
      if (tabx.isValidItem(heroQuote)) {
        tabx.addItem(heroQuote);
      }
      else {
        invalidListForTabx.push(heroQuote);
      }
    }
    await Bun.write(
      path.join(OUTPUT_PATH, `${heroKey}.tabx`),
      `${JSON.stringify(tabx.toJson(), null, 2)}\n`,
    );
  }
  for (const heroQuote of invalidListForTabx) {
    await Bun.write(
      path.join(OUTPUT_PATH, `${heroQuote.fileId}.json`),
      `${JSON.stringify(zWikiHeroQuote.parse(heroQuote), null, 2)}\n`,
    );
  }

  // const conversationTabx = Tabx.fromHeaders([
  //   { key: "_dataType", type: "string" },
  //   { key: "conversationId", type: "string" },
  //   { key: "weight", type: "number" },
  //   { key: "quotes", type: "string", isArray: true },
  // ]);
  // for (const conversation of Object.values(conversationData)) {
  //   conversationTabx.addItem(conversation);
  // }
  // await Bun.write(
  //   path.join(OUTPUT_PATH, "conversations.tabx"),
  //   JSON.stringify(conversationTabx.toJson(), null, 2),
  // );

  spinner.succeed();

  logger.success(`已生成 ${Object.values(dataByHero).flatMap(Object.values).flat().length} 条数据`);
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
  if (condition.type === "nested" && condition.total === 1) {
    return condition.conditions[0]!;
  }
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
  if (currentData.hero === "npc") {
    return { condition: { type: "unknown", raw: criteriaString, negative }, nextLineIndex: lineIndex + 1 };
  }
  spinnerProgress.fail();
  logger.error("条件解析失败");
  logger.error(`  ${line.trim()}`);
  logger.error(`  ${JSON.stringify(currentData)}`);
  process.exit(1);
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
    || criteriaString === "Hero Interaction: Unknown664" // 安娜用
    || criteriaString === "Hero Interaction: Unknown81B"
    || criteriaString === "Hero Interaction: UnknownE41"
    || criteriaString === "Hero Interaction: Unknown1071"
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
      script: scriptId,
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
      if (currentData.hero !== "npc") {
        logger.error(`未知的英雄 ${heroName}`);
      }
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
