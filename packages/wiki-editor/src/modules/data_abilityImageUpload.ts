import path from "node:path";
import { readdir } from "fs-extra";
import { OUTPUT_ABILITY_IMAGE_DIR } from "../constants/paths";
import { wikiBatchUpload } from "../wiki/image";

export default async function data_abilityImageUpload() {
  const dirFiles = await readdir(OUTPUT_ABILITY_IMAGE_DIR);
  const files = Object.fromEntries(dirFiles.map(file => [file, path.join(OUTPUT_ABILITY_IMAGE_DIR, file)]));
  await wikiBatchUpload(files, {
    summary: "上传技能图标（ow-huiji-updater）",
    text: "提取自游戏文件\n\n[[分类:技能图标]]",
  });
}
