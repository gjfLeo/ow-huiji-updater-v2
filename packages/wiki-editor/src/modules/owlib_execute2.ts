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
    logFilename: string;
  }, rawFlags: OwLibFlags = {}) {
    rawFlags.language = rawFlags.language ?? "zhCN";
    rawFlags.speechLanguage = rawFlags.speechLanguage ?? "zhCN";
    rawFlags.online ??= false;
    rawFlags.disableLanguageRegistry ??= true;

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

    const logFile = Bun.file(path.join(outputPath, "logs", options.logFilename));
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
    return proc.exitCode;
  }

  const commands: Record<string, () => Promise<void>> = {
    "dump-ui-textures": async () => {
      await executeOwLibCommand(
        "dump-ui-textures",
        { outputDirName: "dump", logFilename: "dump-ui-textures.log" },
      );
    },
    "dump-strings": async () => {
      await executeOwLibCommand(
        "dump-strings",
        { outputJsonFilename: "strings_zh.json", logFilename: "dump-strings-zh.log" },
      );
      await executeOwLibCommand(
        "dump-strings",
        { outputJsonFilename: "strings_en.json", logFilename: "dump-strings-en.log" },
        { language: "enUS", disableLanguageRegistry: false, online: true },
      );
    },
    "extract-hero-icons": async () => {
      await executeOwLibCommand(
        "extract-hero-icons",
        { outputDirName: "extract", logFilename: "extract-hero-icons.log" },
      );
    },

    "extract-general": async () => {
      await executeOwLibCommand(
        "extract-general",
        { outputDirName: "extract", logFilename: "extract-general.log" },
        { stringGuid: true, skipModels: true, skipAnimations: true },
      );
    },
    "extract-unlocks": async () => {
      await executeOwLibCommand(
        "extract-unlocks",
        { args: ["*|spray=*"], outputDirName: "extract", logFilename: "extract-unlocks.log" },
        { stringGuid: true },
      );
    },

    "list-maps": async () => {
      await executeOwLibCommand(
        "list-maps",
        { outputJsonFilename: "maps.json", logFilename: "list-maps.log" },
      );
    },
    "list-all-unlocks": async () => {
      await executeOwLibCommand(
        "list-all-unlocks",
        { outputJsonFilename: "unlocks.json", logFilename: "list-unlocks.log" },
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
