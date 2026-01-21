import path from "node:path";
import fse from "fs-extra";
import sharp from "sharp";
import z from "zod";
import { logger, spinnerProgress } from "../utils/logger";

const dumpImageDir = path.join(__dirname, "../../output/owlib/dump/UITextureDump");
const outputDir = path.join(__dirname, "../../output/images/flags");

const zImageInfoConfig = z.object({
  "252x152": z.record(z.string(), z.string()),
  "252x152_unused": z.record(z.string(), z.union([z.string(), z.boolean()])),
  "268x200": z.record(z.string(), z.string()),
  "268x200_unused": z.record(z.string(), z.union([z.string(), z.boolean()])),
});

export default async function filterImages() {
  const imageInfoFile = Bun.file(path.join(__dirname, "../data/imageInfo-flags.toml"));
  const imageInfo = zImageInfoConfig.parse(Bun.TOML.parse(await imageInfoFile.text()));

  const files = await fse.readdir(dumpImageDir);
  await fse.emptyDir(outputDir);

  spinnerProgress.start("处理中", files.length);
  const unknown: string[] = [];

  for (const filename of files) {
    const fileId = filename.replace(".png", "");
    try {
      const filepath = path.join(dumpImageDir, filename);
      const metadata = await sharp(filepath).metadata();
      let targetFilename: string | undefined;
      if (metadata.width === 252 && metadata.height === 152) {
        targetFilename = await getFilename252x152(fileId);
      }
      if (metadata.width === 268 && metadata.height === 200) {
        targetFilename = await getFilename268x200(fileId);
      }
      if (targetFilename) {
        await fse.copy(filepath, path.join(outputDir, targetFilename), {
          overwrite: false,
          errorOnExist: true,
        });
      }
      spinnerProgress.increment();
    }
    catch (error) {
      spinnerProgress.fail();
      console.error(`处理 ${fileId} 时出错：${error}`);
      process.exit(1);
    }
  }
  spinnerProgress.succeed();
  if (unknown.length) {
    logger.info(`${unknown.length}个旗帜未找到对应名称：`);
    logger.info(unknown.join("\n"));
  }

  async function getFilename252x152(fileId: string) {
    if (imageInfo["252x152"][fileId]) {
      return `旗帜_${imageInfo["252x152"][fileId]}.png`;
    }
    const decId = Number.parseInt(fileId, 16).toString(10).padStart(6, "0");
    if (imageInfo["252x152_unused"][fileId]) {
      return `unused252x152/${decId}-${fileId}.png`;
    }
    unknown.push(fileId);
    return `unknown252x152/${decId}-${fileId}.png`;
  }
  async function getFilename268x200(fileId: string) {
    if (imageInfo["268x200"][fileId]) {
      return `旗帜_${imageInfo["268x200"][fileId]}.png`;
    }
    const decId = Number.parseInt(fileId, 16).toString(10).padStart(6, "0");
    if (imageInfo["268x200_unused"][fileId]) {
      return `unused268x200/${decId}-${fileId}.png`;
    }
    unknown.push(fileId);
    return `unknown268x200/${decId}-${fileId}.png`;
  }
}
