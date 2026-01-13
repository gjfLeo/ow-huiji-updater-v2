import path from "node:path";
import { pipeline } from "node:stream/promises";
import fse from "fs-extra";
import { ofetch } from "ofetch";
import z from "zod";
import mediaDataRaw from "../../assets/static/talon-archives-medias.json";
import rawData from "../../assets/static/talon-archives.json";
import { logger, spinnerProgress } from "../utils/logger";
import { getImageFilename, MediaType, zTalonArchivesMediaDetail, zTalonArchivesRaw } from "./dataEvent_talonArchives";

export default async function fetchTalonArchivesMediaImages() {
  const raw = zTalonArchivesRaw.parse(rawData);
  const mediaData = z.record(z.string(), zTalonArchivesMediaDetail).parse(mediaDataRaw);

  const outputDir = path.resolve(__dirname, "../../output/talon-archives");
  await fse.emptyDir(path.join(outputDir, "images"));
  await fse.ensureDir(path.join(outputDir, "images"));

  // MARK: 档案图片
  const archives = Object.values(raw["ccc-archives"])
    .filter(archive => Boolean(archive.img_url));
  spinnerProgress.start("保存档案图片", archives.length);
  for (const media of archives) {
    try {
      const url = media.img_url;
      const res = await ofetch(url, { responseType: "stream" });
      const targetFilename = `黑爪档案_档案_${media.name}.png`;
      const outputPath = path.join(outputDir, "images", targetFilename);
      await pipeline(res, fse.createWriteStream(outputPath));
      spinnerProgress.increment();
    }
    catch (error) {
      spinnerProgress.fail();
      console.error(error);
      console.info(media);
      process.exit(1);
    }
  }
  spinnerProgress.succeed();

  // MARK: 正文图片
  const imageMedias = Object.values(mediaData).filter(media => [MediaType.Image, MediaType.Video, MediaType.Book, MediaType.ShortStory].includes(media.media_type));
  spinnerProgress.start("保存正文图片", imageMedias.length);
  for (const media of imageMedias) {
    try {
      const url = media.media_img;
      const res = await ofetch(url, { responseType: "stream" });
      const targetFilename = getImageFilename(media.media_name, media.media_type);
      const outputPath = path.join(outputDir, "images", targetFilename);
      await pipeline(res, fse.createWriteStream(outputPath));
      spinnerProgress.increment();
    }
    catch (error) {
      spinnerProgress.fail();
      console.error(error);
      console.info(media);
      process.exit(1);
    }
  }
  spinnerProgress.succeed();

  logger.success(`完成 ${path.relative(process.cwd(), outputDir)}`);
}
