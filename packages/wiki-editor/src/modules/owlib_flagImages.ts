import path from "node:path";
import fse from "fs-extra";
import sharp from "sharp";
import z from "zod";
import { logger, spinnerProgress } from "../utils/logger";

const dumpImageDir = path.join(__dirname, "../../output/owlib/dump/UITextureDump");
const outputDir = path.join(__dirname, "../../output/images/flags");

export default async function filterImages() {
  const imageInfoFile = Bun.file(path.join(__dirname, "../data/imageInfo-flags.toml"));
  const imageInfo = z.record(z.string(), z.string()).parse(Bun.TOML.parse(await imageInfoFile.text()));

  const files = await fse.readdir(dumpImageDir);
  await fse.emptyDir(outputDir);

  spinnerProgress.start("处理中", files.length);
  const unknown: string[] = [];

  for (const filename of files) {
    const fileId = filename.replace(".png", "");
    try {
      const filepath = path.join(dumpImageDir, filename);
      const metadata = await sharp(filepath).metadata();
      if ((metadata.width === 252 && metadata.height === 152) || (metadata.width === 268 && metadata.height === 200)) {
        let targetFilename;
        if (imageInfo[fileId]) {
          targetFilename = `旗帜_${imageInfo[fileId]}.png`;
        }
        else {
          const decId = Number.parseInt(fileId, 16).toString(10).padStart(6, "0");
          targetFilename = `unknown/${decId}-${fileId}.png`;
          unknown.push(fileId);
        }
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
}
