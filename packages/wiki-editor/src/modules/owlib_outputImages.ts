import path from "node:path";
import { copy, ensureDir, readdir } from "fs-extra";
import { glob } from "tinyglobby";
import { OUTPUT_CATEGORIZED_IMAGE_DIR, OWLIB_UI_TEXTURE_DIR } from "../constants/paths";
import { spinnerProgress } from "../utils/logger";

export default async function owlib_outputImages() {
  const files = await readdir(OWLIB_UI_TEXTURE_DIR);
  await ensureDir(path.join(OUTPUT_CATEGORIZED_IMAGE_DIR, "uncategorized"));

  const existedFiles = await glob(["**/*.png"], { cwd: OUTPUT_CATEGORIZED_IMAGE_DIR });
  const existedFilesSet = new Set(existedFiles.map(file => path.basename(file)));

  spinnerProgress.start("处理中", files.length);
  for (const filename of files) {
    const fileId = filename.replace(".png", "");
    try {
      const filepath = path.join(OWLIB_UI_TEXTURE_DIR, filename);
      const targetName = `${Number.parseInt(fileId, 16).toString(10).padStart(8, "0")}_${fileId}.png`;
      if (!existedFilesSet.has(targetName)) {
        await copy(filepath, path.join(OUTPUT_CATEGORIZED_IMAGE_DIR, "uncategorized", targetName));
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
