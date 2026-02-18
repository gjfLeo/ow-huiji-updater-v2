import path from "node:path";
import { readdir } from "fs-extra";
import { OUTPUT_HERO_IMAGE_DIR } from "../constants/paths";
import { wikiBatchUpload } from "../wiki/image";

export default async function data_heroImageUpload() {
  const portrait2D = await readdir(path.join(OUTPUT_HERO_IMAGE_DIR, "头像_2D"));
  const portrait3D = await readdir(path.join(OUTPUT_HERO_IMAGE_DIR, "头像_3D"));
  const files = Object.fromEntries([
    ...portrait2D.map(filename => [
      filename,
      path.join(OUTPUT_HERO_IMAGE_DIR, "头像_2D", filename),
    ]),
    ...portrait3D.map(filename => [
      filename,
      path.join(OUTPUT_HERO_IMAGE_DIR, "头像_3D", filename),
    ]),
  ]);
  await wikiBatchUpload(files, {
    summary: "上传英雄头像（ow-huiji-updater）",
    text: "提取自游戏文件\n\n[[分类:英雄头像]]",
  });
}
