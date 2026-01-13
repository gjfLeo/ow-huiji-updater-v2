import path from "node:path";
import { convertPathToPattern, glob } from "tinyglobby";
import { wikiBatchUpload } from "../wiki/image";

export default async function uploadTalonArchivesImages() {
  const imageDir = path.resolve(__dirname, "../../output/talon-archives/images");
  const filepaths = await glob(convertPathToPattern(path.join(imageDir, "*.png")));
  const files = Object.fromEntries(filepaths.map(filepath => [path.basename(filepath), filepath]));

  await wikiBatchUpload(files, {
    summary: "上传黑爪档案图片（上传自ow-huiji-updater）",
    text: "[[分类:黑爪档案图片]]",
  });
}
