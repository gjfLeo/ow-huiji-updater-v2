import path from "node:path";
import { checkbox } from "@inquirer/prompts";
import chalk from "chalk";
import fse, { exists } from "fs-extra";
import { logger, spinner } from "../utils/logger";
import { getStorage } from "../utils/storage";

const OPERATIONS = [
  "dump-file-lists",
  "dump-lootbox-pools",
  "dump-strings",
  "dump-ui-textures",
  "list-abilities",
  "list-achievements",
  "list-all-unlocks",
  "list-general-unlocks",
  "list-unlocks",
  "list-heroes",
  "list-maps",
  "list-keys",
  "list-subtitles",
  "list-subtitles-real",
  "list-talents",
  "list-arcade-modes",
  "list-brawl-name",
  "list-brawls",
  "list-challenges",
  "list-chat-replacements",
  "list-chat-settings",
  "list-conversations",
  "list-esport-teams",
  "list-gamemodes",
  "list-game-ruleset-schemas",
  "list-game-rulesets",
  "list-heroes-rulesets",
  "list-highlights",
  "list-lootbox",
  "list-profanity-filters",
  "list-report-responses",
  "list-tips",
  "list-workshop",
  "extract-abilities",
  "extract-gamemode-images",
  "extract-hero-icons",
  "extract-hero-voice",
  "extract-lore-codex",
  "extract-npc-voice",
  "extract-conversations",
  "extract-vector-images",
] as const;

export default async function executeDataToolOnce() {
  const dataToolPath = await getStorage("dataToolPath");
  const gamePath = await getStorage("gamePath");
  const outputPath = path.resolve(__dirname, "../../output/owlib");
  await fse.ensureDir(path.join(outputPath, "logs"));

  if (!await exists(dataToolPath)) {
    logger.error("工具路径不正确");
    process.exit(1);
  }

  const operationArgs: Record<(typeof OPERATIONS)[number], string[][]> = {
    "dump-file-lists": [
      // [path.join(outputPath, "dump"), ],
    ],
    "dump-lootbox-pools": [
      [path.join(outputPath, "dump")],
      [path.join(outputPath, "dump_guid"), "--string-guid"],
    ],
    "dump-strings": [
      [`--out=${path.join(outputPath, "json/strings_zh.json")}`, "--json"],
      [`--out=${path.join(outputPath, "json/strings_en.json")}`, "--json", "--language=enUS"],
    ],
    "dump-ui-textures": [
      [path.join(outputPath, "dump")],
    ],
    "list-abilities": [
      [`--out=${path.join(outputPath, "json/abilities.json")}`, "--json"],
    ],
    "list-achievements": [
      [`--out=${path.join(outputPath, "json/achievements.json")}`, "--json"],
    ],
    "list-all-unlocks": [
      [`--out=${path.join(outputPath, "json/unlocks-all_zh.json")}`, "--json"],
      [`--out=${path.join(outputPath, "json/unlocks-all_en.json")}`, "--json", "--language=enUS"],
      [`--out=${path.join(outputPath, "json/unlocks-all_guid.json")}`, "--json", "--string-guid"],
    ],
    "list-general-unlocks": [
      [`--out=${path.join(outputPath, "json/unlocks-general.json")}`, "--json"],
    ],
    "list-unlocks": [
      [`--out=${path.join(outputPath, "json/unlocks-hero_zh.json")}`, "--json"],
    ],
    "list-heroes": [
      [`--out=${path.join(outputPath, "json/heroes.json")}`, "--json"],
    ],
    "list-maps": [
      [`--out=${path.join(outputPath, "json/maps.json")}`, "--json"],
    ],
    "list-keys": [
      [`--out=${path.join(outputPath, "json/keys.json")}`, "--json"],
    ],
    "list-subtitles": [
      [`--out=${path.join(outputPath, "json/subtitles.json")}`, "--json"],
    ],
    "list-subtitles-real": [
      [],
      ["--language=enUS"],
    ],
    "list-talents": [
      [`--out=${path.join(outputPath, "json/talents.json")}`, "--json"],
    ],
    "list-arcade-modes": [
      [`--out=${path.join(outputPath, "json/arcade-modes.json")}`, "--json"],
    ],
    "list-brawl-name": [
      [`--out=${path.join(outputPath, "json/brawl-name.json")}`, "--json"],
    ],
    "list-brawls": [
      [`--out=${path.join(outputPath, "json/brawls.json")}`, "--json"],
    ],
    "list-challenges": [
      [`--out=${path.join(outputPath, "json/challenges.json")}`, "--json"],
    ],
    "list-chat-replacements": [
      [`--out=${path.join(outputPath, "json/chat-replacements.json")}`, "--json"],
    ],
    "list-chat-settings": [
      [`--out=${path.join(outputPath, "json/chat-settings.json")}`, "--json"],
    ],
    "list-conversations": [
      [`--out=${path.join(outputPath, "json/conversations.json")}`, "--json"],
    ],
    "list-esport-teams": [
      [`--out=${path.join(outputPath, "json/esport-teams.json")}`, "--json"],
    ],
    "list-gamemodes": [
      [`--out=${path.join(outputPath, "json/game-modes.json")}`, "--json"],
    ],
    "list-game-ruleset-schemas": [
      // [`--out=${path.join(outputPath, "json/game-ruleset-schemas.json")}`, "--json", ],
    ],
    "list-game-rulesets": [
      // [`--out=${path.join(outputPath, "json/game-rulesets.json")}`, "--json", ],
    ],
    "list-heroes-rulesets": [
      [`--out=${path.join(outputPath, "json/heroes-rulesets.json")}`, "--json"],
    ],
    "list-highlights": [
      [`--out=${path.join(outputPath, "json/highlights.json")}`, "--json"],
    ],
    "list-lootbox": [
      [`--out=${path.join(outputPath, "json/lootbox.json")}`, "--json"],
    ],
    "list-profanity-filters": [
      [`--out=${path.join(outputPath, "json/profanity-filters.json")}`, "--json"],
    ],
    "list-report-responses": [
      [`--out=${path.join(outputPath, "json/report-responses.json")}`, "--json"],
    ],
    "list-tips": [
      [`--out=${path.join(outputPath, "json/tips.json")}`, "--json"],
    ],
    "list-workshop": [
      [`--out=${path.join(outputPath, "json/workshop.json")}`, "--json"],
    ],
    "extract-abilities": [
      [path.join(outputPath, "extract"), "--no-names", "--string-guid"],
    ],
    "extract-gamemode-images": [
      [path.join(outputPath, "extract")],
    ],
    "extract-hero-icons": [
      [path.join(outputPath, "extract"), "--no-names", "--string-guid"],
    ],
    "extract-lore-codex": [
      [path.join(outputPath, "extract"), "--subtitles-with-sounds", "--skip-sound"],
    ],
    "extract-hero-voice": [
      [path.join(outputPath, "extract"), "--voice-group-by-skin", "--subtitles-with-sounds"],
    ],
    "extract-npc-voice": [
      [path.join(outputPath, "extract"), "--subtitles-with-sounds"],
    ],
    "extract-conversations": [
      [path.join(outputPath, "extract"), "--subtitles-with-sounds"],
    ],
    "extract-vector-images": [
      [path.join(outputPath, "extract")],
    ],
  };

  const operations: (typeof OPERATIONS)[number][] = await checkbox({
    message: "请选择操作",
    choices: OPERATIONS.filter(operation => operationArgs[operation].length > 0),
  });

  if (operations.includes("extract-hero-voice")
    || operations.includes("extract-npc-voice")
    || operations.includes("extract-conversations")) {
    await checkVoiceCategoryGuidNames(dataToolPath);
  }

  for (const operation of operations) {
    let index = 1;
    for (const singleCommandArgs of operationArgs[operation]) {
      const logFile = Bun.file(path.join(outputPath, `logs/${operation}-${index++}.log`));
      await handleExecute(logFile, operation, ...singleCommandArgs);
    }
  }

  async function handleExecute(logFile: Bun.BunFile, ...args: string[]) {
    console.info(chalk.blue.bold(`\n\n${args.filter((arg, i) => i !== 1).join(" ")}\n`));
    if (await logFile.exists()) {
      await logFile.delete();
    }
    const writer = logFile.writer();
    const writable = new WritableStream({
      write(chunk) {
        process.stdout.write(chunk);
        writer.write(chunk);
      },
    });

    const proc = Bun.spawn([
      dataToolPath,
      gamePath,
      ...args,
      ...args.some(arg => arg.startsWith("--language=")) ? [] : ["--language=zhCN"],
    ], {
    });
    proc.stdout!.pipeTo(writable);

    await proc.exited;
    return proc.exitCode;
  }
}

async function checkVoiceCategoryGuidNames(dataToolPath: string) {
  spinner.start("检查语音分类 GUIDNames.csv");
  const toolDirectory = path.dirname(dataToolPath);
  const guidCsvContent = await Bun.file(path.resolve(toolDirectory, "./Static/GUIDNames.csv")).text();
  const guidCsvLines = guidCsvContent.split("\n");
  if (guidCsvLines.some(line => line.includes(",078,") || line.includes(",079,"))) {
    spinner.fail("GUIDNames.csv 中包含 078 或 079，请修改");
    process.exit(-1);
  }
  spinner.succeed();
}
