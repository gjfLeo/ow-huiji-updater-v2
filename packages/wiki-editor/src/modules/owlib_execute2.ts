import path from "node:path";
import { checkbox } from "@inquirer/prompts";
import { kebabCase } from "change-case";
import { ensureDir, exists } from "fs-extra";
import { OWLIB_DIR } from "../constants/paths";
import { logger } from "../utils/logger";
import { getStorage } from "../utils/storage";

export default async function owlib_execute2() {
  const dataToolPath = await getStorage("dataToolPath");
  const gamePath = await getStorage("gamePath");
  const outputPath = OWLIB_DIR;
  await ensureDir(path.join(outputPath, "logs"));
  logger.info(`dataToolPath: ${dataToolPath}`);
  logger.info(`gamePath: ${gamePath}`);
  logger.info(`outputPath: ${outputPath}`);

  if (!await exists(dataToolPath)) {
    logger.error("工具路径不正确");
    process.exit(1);
  }

  async function executeOwLibCommand(command: string, options: {
    args?: string[];
    outputDirName?: string;
    outputJsonFilename?: string;
    logFileName?: string;
  } = {}, rawFlags: OwLibFlags = {}) {
    if (command.startsWith("list-")) {
      options.outputJsonFilename ??= `${command.substring(5)}.json`;
    }
    if (command.startsWith("extract-")) {
      options.outputDirName ??= "extract";
    }
    options.logFileName ??= `${command}.log`;

    rawFlags.language = rawFlags.language ?? "zhCN";
    rawFlags.speechLanguage = rawFlags.speechLanguage ?? "zhCN";
    rawFlags.online ??= false;
    rawFlags.disableLanguageRegistry ??= true;
    rawFlags.skipAnimationEffects ??= true;
    rawFlags.skipAnimations ??= true;
    rawFlags.skipModels ??= true;

    const finalArgs: string[] = [];

    if (options.outputDirName) {
      finalArgs.push(path.join(outputPath, options.outputDirName));
      // rawFlags.outPath = path.join(outputPath, options.outputDirName);
    }
    if (options.outputJsonFilename) {
      rawFlags.json = true;
      rawFlags.out = path.join(outputPath, "json", options.outputJsonFilename);
    }

    finalArgs.push(...(options.args ?? []));
    finalArgs.push(...Object.entries(rawFlags).map(([key, value]) => {
      return `--${kebabCase(key)}=${value}`;
    }));

    const logFile = Bun.file(path.join(outputPath, "logs", options.logFileName));
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

    logger.infoBlue("");
    logger.infoBlue([command, ...finalArgs].join(" "));
    const proc = Bun.spawn([dataToolPath, gamePath, command, ...finalArgs], {});
    proc.stdout!.pipeTo(writable);
    await proc.exited;
  }

  const commands: Record<string, () => Promise<void>> = {
    "dump-ui-textures": () => executeOwLibCommand("dump-ui-textures", { outputDirName: "dump" }),
    "dump-strings": async () => {
      await executeOwLibCommand(
        "dump-strings",
        { outputJsonFilename: "strings_zh.json", logFileName: "dump-strings_zh.log" },
      );
      await executeOwLibCommand(
        "dump-strings",
        { outputJsonFilename: "strings_en.json", logFileName: "dump-strings_en.log" },
        { language: "enUS", disableLanguageRegistry: false, online: true },
      );
    },
    "extract-hero-icons": () => executeOwLibCommand("extract-hero-icons"),
    "extract-abilities": () => executeOwLibCommand("extract-abilities"),

    // "extract-unlocks": async () => {
    //   await executeOwLibCommand(
    //     "extract-unlocks",
    //     { args: ["*|spray=*"], outputDirName: "extract", logFileName: "extract-unlocks.log" },
    //     { stringGuid: true },
    //   );
    // },
    "extract-sprays": () => executeOwLibCommand("extract-sprays", {}, { stringGuid: true }),
    "extract-player-icons": () => executeOwLibCommand("extract-player-icons", {}, { stringGuid: true }),
    "extract-name-cards": () => executeOwLibCommand("extract-name-cards", {}, { stringGuid: true }),

    "extract-intel-database": () => executeOwLibCommand("extract-intel-database"),

    "extract-hero-voice": () => executeOwLibCommand("extract-hero-voice", {}, { voiceGroupBySkin: true, subtitlesWithSounds: true }),
    "extract-npc-voice": () => executeOwLibCommand("extract-npc-voice", {}, { subtitlesWithSounds: true }),
    "extract-conversations": () => executeOwLibCommand("extract-conversations", {}, { subtitlesWithSounds: true }),

    "list-heroes": () => executeOwLibCommand("list-heroes"),
    "list-abilities": () => executeOwLibCommand("list-abilities"),
    "list-talents": () => executeOwLibCommand("list-talents"),
    "list-maps": () => executeOwLibCommand("list-maps"),
    "list-achievements": () => executeOwLibCommand("list-achievements"),
    "list-challenges": () => executeOwLibCommand("list-challenges"),
    "list-all-unlocks": async () => {
      await executeOwLibCommand(
        "list-all-unlocks",
        { outputJsonFilename: "unlocks.json", logFileName: "list-unlocks.log" },
      );
      await executeOwLibCommand(
        "list-all-unlocks",
        { outputJsonFilename: "unlocks_guid.json", logFileName: "list-unlocks_guid.log" },
        { stringGuid: true, noGuidNames: true },
      );
    },
    "list-conversations": () => executeOwLibCommand("list-conversations"),

    "list-arcade-modes": () => executeOwLibCommand("list-arcade-modes"),
    "list-brawls": () => executeOwLibCommand("list-brawls"),
    "list-brawl-name": () => executeOwLibCommand("list-brawl-name"),
    "list-gamemodes": () => executeOwLibCommand("list-gamemodes"),
    "list-game-rulesets": () => executeOwLibCommand("list-game-rulesets"),
    "list-game-ruleset-schemas": () => executeOwLibCommand("list-game-ruleset-schemas"),
    "list-heroes-rulesets": () => executeOwLibCommand("list-heroes-rulesets"),
    "list-workshop": () => executeOwLibCommand("list-workshop"),
    "list-debug-herosettings": () => executeOwLibCommand("list-debug-herosettings"),

    "list-chat-replacements": () => executeOwLibCommand("list-chat-replacements"),
    "list-chat-settings": () => executeOwLibCommand("list-chat-settings"),
    "list-profanity-filters": () => executeOwLibCommand("list-profanity-filters"),
    "list-report-responses": () => executeOwLibCommand("list-report-responses"),
    "list-tips": () => executeOwLibCommand("list-tips"),
    "list-esport-teams": () => executeOwLibCommand("list-esport-teams"),
    "list-lootbox": () => executeOwLibCommand("list-lootbox"),
    "list-subtitles-real": async () => {
      await executeOwLibCommand(
        "list-subtitles-real",
        { logFileName: "list-subtitles-real_zh.log" },
      );
      await executeOwLibCommand(
        "list-subtitles-real",
        { logFileName: "list-subtitles-real_en.log" },
        { language: "enUS", disableLanguageRegistry: false, online: true },
      );
    },
  };

  const operations: string[] = await checkbox({
    message: "请选择操作",
    choices: Object.keys(commands),
  });
  for (const operation of operations) {
    await commands[operation]!();
  }
}

interface OwLibFlags {

  /** Language to load */
  language?: "enUS" | "zhCN";

  /** Speech Language to load */
  speechLanguage?: "enUS" | "zhCN";

  /** Allow downloading of corrupted files */
  online?: boolean;

  // /** Re-use textures from other models */
  // deduplicateTextures?: boolean;

  /** Returns all strings as their GUID instead of their value */
  stringGuid?: boolean;

  // /** use (R)CN? CMF */
  // rcn?: boolean;

  // /** Directory for persistent database storage for deduplication info */
  // scratchdb?: string;

  /** Don't use names for textures */
  noNames?: boolean;

  /** Only use canonical names */
  canonicalNames?: boolean;

  /** Completely disables using GUIDNames */
  noGuidNames?: boolean;

  // /** Extract shader files */
  // extractShaders?: boolean;

  /** Disable fetching language from registry */
  disableLanguageRegistry?: boolean;

  // List flags

  /** Output JSON to stderr */
  json?: boolean;

  /** Output JSON file */
  out?: string;

  // /** Flatten output */
  // flatten?: boolean;

  // /** Reduces the amount of information output by -list commands */
  // simplify?: boolean;

  // Extract flags

  /** Output path to save data */
  outPath?: string;

  /** Texture output type */
  convertTexturesType?: "png" | "dds" | "tif";
  /** Animation output type */
  convertAnimationsType?: "owanimclip" | "seanim";
  /** Extract skeleton refposes */
  extractRefpose?: boolean;
  /** Do not convert textures */
  rawTextures?: boolean;
  /** Do not convert sounds */
  rawSound?: boolean;
  /** Do not convert models */
  rawModels?: boolean;
  /** Do not convert animations */
  rawAnimations?: boolean;
  /** Skip all conversion */
  raw?: boolean;
  /** Skip texture extraction */
  skipTextures?: boolean;
  /** Skip sound extraction */
  skipSound?: boolean;
  /** Skip model extraction */
  skipModels?: boolean;
  /** Skip animation extraction */
  skipAnimations?: boolean;
  /** Skip animation effect extraction */
  skipAnimationEffects?: boolean;
  /** set to true for Blender 2.79, false for Maya and when Blender SEAnim tools are updated for 2.8 */
  scaleAnims?: boolean;
  /** Flatten directory structure */
  flatten?: boolean;
  /** Save multisurface textures as DDS */
  forceDdsMultisurface?: boolean;
  /** Save multisurface textures as one large image, tiled across in the Y (vertical) direction */
  sheetMultisurface?: boolean;
  /** Combine all surfaces into one image (only supported on TIF and DDS) */
  combineMultisurface?: boolean;
  /** Convert single channel textures to grayscale RGB */
  grayscale?: boolean;
  /** Extract subtitles alongside voicelines */
  subtitlesWithSounds?: boolean;
  /** Saves the sound files as the subtitle */
  subtitlesAsSounds?: boolean;
  /** Group voice files by hero */
  voiceGroupByHero?: boolean;
  /** Group voice files by type */
  voiceGroupByType?: boolean;
  /** Group voice files by skin */
  voiceGroupBySkin?: boolean;
  /** Group voice files by locale */
  voiceGroupByLocale?: boolean;
  /** Group voice files by 03F */
  voiceFlat03F?: boolean;
  /** Convert STUs to xml when extracted with ExtractDebugType */
  xml?: boolean;
  /** Keep all audio channels when converting Ogg Opus */
  keepChannels?: boolean;
  /** Use TextureDecoder for decoding textures, slower but more accurate (enforced on Linux) */
  useTextureDecoder?: boolean;
  /** Extract all model LODs */
  allLods?: boolean;
}
