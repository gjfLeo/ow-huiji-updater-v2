import path from "node:path";
import { copy, emptyDir, ensureDir, readdir } from "fs-extra";
import sharp from "sharp";
import { OUTPUT_IMAGE_BY_SIZE_DIR, OWLIB_UI_TEXTURE_DIR } from "../constants/paths";
import { spinnerProgress } from "../utils/logger";

const includeSizes = [
  "448x448",
];

export default async function owlib_groupImageBySize() {
  const files = await readdir(OWLIB_UI_TEXTURE_DIR);
  await emptyDir(OUTPUT_IMAGE_BY_SIZE_DIR);

  spinnerProgress.start("处理中", files.length);

  for (const filename of files) {
    const fileId = filename.replace(".png", "");
    try {
      const filepath = path.join(OWLIB_UI_TEXTURE_DIR, filename);
      const metadata = await sharp(filepath).metadata();
      const size = `${metadata.width}x${metadata.height}`;
      if (includeSizes.includes(size)) {
        await ensureDir(path.join(OUTPUT_IMAGE_BY_SIZE_DIR, size));
        await copy(filepath, path.join(OUTPUT_IMAGE_BY_SIZE_DIR, size, filename));
      }
      spinnerProgress.increment();
    }
    catch (error) {
      spinnerProgress.fail();
      console.error(`处理 ${fileId} 时出错：${error}`);
      process.exit(1);
    }
  }
}
