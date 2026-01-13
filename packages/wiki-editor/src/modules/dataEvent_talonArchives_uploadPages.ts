import path from "node:path";
import fse from "fs-extra";
import { convertPathToPattern, glob } from "tinyglobby";
import { wikiBatchEdit } from "../wiki/batch";

export default async function uploadTalonArchivesPages() {
  const pageDir = path.resolve(__dirname, "../../output/talon-archives/pages");
  const filepaths = await glob(convertPathToPattern(path.join(pageDir, "*.wikitext")));
  const files = Object.fromEntries(filepaths.map(filepath => [
    `黑爪档案/${path.basename(filepath).replace(".wikitext", "")}`,
    fse.readFileSync(filepath, "utf-8"),
  ]));
  await wikiBatchEdit(files, {
    summary: "黑爪档案页面（编辑自ow-huiji-updater）",
  });
}
