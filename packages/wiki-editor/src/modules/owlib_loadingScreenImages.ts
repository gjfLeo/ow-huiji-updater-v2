import path from "node:path";
import fse from "fs-extra";
import sharp from "sharp";
import TOML from "smol-toml";
import z from "zod";
import imageInfo1920 from "../data/imageInfo-1920.toml";
import { spinnerProgress } from "../utils/logger";

const dumpImageDir = path.join(__dirname, "../../output/owlib/dump/UITextureDump");
const outputDir = path.join(__dirname, "../../output/images/1920/");

const zLoadingScreenInfo = z.object({
  map: z.string(),
  point: z.string().optional(),
  timeline: z.string().optional(),
  variation: z.string().optional(),
  festival: z.string().optional(),
  duplicate: z.boolean().optional(),
});

const zImageInfo = z.looseObject({
  "loadingScreens": z.record(z.string(), zLoadingScreenInfo),
  "loadingScreens/event": z.record(z.string(), zLoadingScreenInfo.extend({
    event: z.string(),
  })),
  "loadingScreens/special": z.record(z.string(), zLoadingScreenInfo),
  "loadingScreens/stadium": z.record(z.string(), zLoadingScreenInfo),
});

export default async function filterImages() {
  const files = await fse.readdir(dumpImageDir);

  const newUncategorized: string[] = [];
  // const imageInfoFile = Bun.file(path.join(__dirname, "../data/imageInfo-1920.toml"));
  const imageInfo = zImageInfo.parse(imageInfo1920);

  await fse.emptyDir(outputDir);

  spinnerProgress.start("处理中", files.length);

  for (const filename of files) {
    const fileId = filename.replace(".png", "");
    try {
      const filepath = path.join(dumpImageDir, filename);
      const metadata = await sharp(filepath).metadata();
      if (metadata.width === 1920 && metadata.height === 1080) {
        await handleImage1920x1080(fileId, filepath);
      }
      else if (metadata.width === 2560 && metadata.height === 1440) {
        await handleImage1920x1080(fileId, filepath);
      }
      else if (metadata.width === 3840 && metadata.height === 2160) {
        await handleImage1920x1080(fileId, filepath);
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

  async function handleImage1920x1080(fileId: string, filepath: string) {
    for (const category of Object.keys(imageInfo) as (keyof typeof imageInfo)[]) {
      if (fileId in (imageInfo[category] as object)) {
        let targetFilename: string;
        switch (category) {
          case "loadingScreens":
          case "loadingScreens/stadium":
          case "loadingScreens/special":
          case "loadingScreens/event": {
            const mapInfo = imageInfo[category][fileId]!;
            if (mapInfo.duplicate) {
              return;
            }
            targetFilename = [
              mapInfo.point ? mapInfo.map + mapInfo.point : mapInfo.map,
              mapInfo.timeline,
              mapInfo.variation,
              mapInfo.festival,
              "event" in mapInfo ? mapInfo.event : undefined,
            ].filter(Boolean).join("_");
            break;
          }
          default:
            targetFilename = `${Number.parseInt(fileId, 16).toString(10).padStart(6, "0")}_${fileId}`;
        }
        return await fse.copy(filepath, path.join(outputDir, category, `${targetFilename}.png`), {
          overwrite: false,
          errorOnExist: true,
        });
      }
    }
    newUncategorized.push(fileId);

    const targetFilename = `${Number.parseInt(fileId, 16).toString(10).padStart(6, "0")}_${fileId}`;
    return await fse.copy(filepath, path.join(outputDir, "uncategorized", `${targetFilename}.png`), {
      overwrite: false,
      errorOnExist: true,
    });
  }

  console.info(newUncategorized);

  // await imageInfoFile.write(TOML.stringify(imageInfo));
}
