import path from "node:path";
import { emptyDir, link } from "fs-extra";
import PQueue from "p-queue";
import sharp from "sharp";
import { convertPathToPattern, glob } from "tinyglobby";
import { OUTPUT_DIR, OWLIB_DIR, OWLIB_EXTRACT_DIR, OWLIB_UI_TEXTURE_DIR } from "../constants/paths";
import { readStrings } from "../utils/data";
import { logger, spinnerProgress } from "../utils/logger";

interface TextureInfo {
  id: string;
  idN: number;
  hash: string;
  resolution: string;
  category?: string;
  filename: string;
  meta?: SprayTextureMeta;
}

interface SprayTextureMeta {
  hero?: string;
  unlockCategory: string;
  name: string;
}

export default async function owlib_analyzeImages() {
  const textureInfoById: Record<string, TextureInfo> = {};
  const textureInfoByHash: Record<string, TextureInfo> = {};
  const { zhStrings } = await readStrings();

  const hasher = new Bun.CryptoHasher("sha1");
  const getFileData = async (path: string) => {
    const file = Bun.file(path);
    const data = await file.arrayBuffer();
    const hash = hasher.update(data).digest("hex");
    return { data, hash };
  };

  // MARK: 读取所有图片文件
  {
    spinnerProgress.start("读取所有图片文件", 0);
    const textureFiles = await glob(convertPathToPattern(path.join(OWLIB_UI_TEXTURE_DIR, "*.png")));
    spinnerProgress.setTotal(textureFiles.length);

    const queue = new PQueue({ concurrency: 10 });
    const handleTexture = async (texturePath: string) => {
      const id = path.basename(texturePath, ".png");
      const idN = Number.parseInt(id, 16);
      const { data, hash } = await getFileData(texturePath);
      const { width, height } = await sharp(data).metadata();
      const textureInfo: TextureInfo = {
        id,
        idN,
        hash,
        resolution: `${width}x${height}`,
        filename: generateImageFileName(idN.toString(10).padStart(6, "0"), id, hash),
      };
      textureInfoById[id] = textureInfo;
      textureInfoByHash[hash] = textureInfo;
      spinnerProgress.increment();
    };
    textureFiles.forEach((texturePath) => {
      queue.add(() => handleTexture(texturePath));
    });
    await queue.onIdle();
    spinnerProgress.succeed();

    await Bun.file(path.join(OUTPUT_DIR, "texture-info.json")).write(`${JSON.stringify(textureInfoById, null, 2)}\n`);
  }

  const analyzedOutputDir = path.join(OWLIB_DIR, "analyzed-images");
  await emptyDir(analyzedOutputDir);

  // MARK: 读取英雄喷漆
  {
    spinnerProgress.start("读取英雄喷漆", 0);
    const sprayFiles = await glob(convertPathToPattern(path.join(OWLIB_EXTRACT_DIR, "Heroes/*/Spray/**/*.png")));
    spinnerProgress.setTotal(sprayFiles.length);
    const sprayOutputDir = path.join(analyzedOutputDir, "sprays-hero");
    await emptyDir(sprayOutputDir);

    const queue = new PQueue({ concurrency: 10 });
    const handleSpray = async (sprayPath: string) => {
      const dirParts = path.relative(OWLIB_EXTRACT_DIR, path.dirname(sprayPath)).split(path.sep);
      const hero = zhStrings[dirParts.at(-3)!]!;
      const unlockCategory = zhStrings[dirParts.at(-1)!]!;
      const name = zhStrings[path.basename(sprayPath, ".png")]!;

      const { hash } = await getFileData(sprayPath);
      const textureInfo = textureInfoByHash[hash];
      if (!textureInfo) {
        spinnerProgress.pause(() => {
          console.info();
          logger.error(`图片匹配失败 ${path.basename(sprayPath)}`);
          // console.error({ sprayPath, hash, hero, unlockCategory, name });
        });
        return;
      }
      textureInfo.category = "喷漆";
      textureInfo.meta = { hero, unlockCategory, name };
      textureInfo.filename = generateImageFileName(hero, unlockCategory, name, textureInfo.id);
      await link(sprayPath, path.join(sprayOutputDir, textureInfo.filename));
      spinnerProgress.increment();
    };
    sprayFiles.forEach((sprayPath) => {
      queue.add(() => handleSpray(sprayPath));
    });
    await queue.onIdle();
    spinnerProgress.succeed();
  }

  // MARK: 读取通用喷漆
  {
    spinnerProgress.start("读取通用喷漆", 0);
    const sprayFiles = await glob(
      convertPathToPattern(path.join(OWLIB_EXTRACT_DIR, "General/Spray/**/*.png")),
      { cwd: OWLIB_EXTRACT_DIR },
    );
    spinnerProgress.setTotal(sprayFiles.length);
    const sprayOutputDir = path.join(analyzedOutputDir, "sprays-general");
    await emptyDir(sprayOutputDir);

    const queue = new PQueue({ concurrency: 10 });
    const handleSpray = async (sprayPath: string) => {
      const match = sprayPath
        .match(/General\/Spray\/(?<unlockCategorySG>[0-9A-F]{12}\.07C)\/(?<nameSG>[0-9A-F]{12}\.07C).png/);
      if (!match) {
        spinnerProgress.pause(() => {
          logger.warn(`\n通用喷漆已跳过 ${sprayPath}`);
        });
        return;
      }
      const { unlockCategorySG, nameSG } = match.groups!;
      const unlockCategory = zhStrings[unlockCategorySG!]!;
      const name = zhStrings[nameSG!]!;

      const fullPath = path.join(OWLIB_EXTRACT_DIR, sprayPath);
      const { hash } = await getFileData(fullPath);
      const textureInfo = textureInfoByHash[hash];
      if (!textureInfo) {
        spinnerProgress.pause(() => {
          console.info();
          logger.error(`通用喷漆图片匹配失败 ${sprayPath}`);
          console.error({ sprayPath, hash, unlockCategory, name });
        });
        return;
      }
      textureInfo.category = "喷漆";
      textureInfo.meta = { unlockCategory, name };
      textureInfo.filename = generateImageFileName(unlockCategory, name, textureInfo.id);
      try {
        await link(fullPath, path.join(sprayOutputDir, textureInfo.filename));
      }
      catch (error) {
        spinnerProgress.fail();
        logger.error(error);
        console.error({ sprayPath, hash, unlockCategory, name });
        process.exit(1);
      }
      spinnerProgress.increment();
    };
    sprayFiles.forEach((sprayPath) => {
      queue.add(() => handleSpray(sprayPath));
    });
    await queue.onIdle();
    spinnerProgress.succeed();
  }
}

function generateImageFileName(...parts: string[]) {
  return `${parts.join("_").replaceAll(/[\\/<>?*"\n]/g, "~")}.png`;
}
