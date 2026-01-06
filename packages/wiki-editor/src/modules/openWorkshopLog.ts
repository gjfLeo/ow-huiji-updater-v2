import path from "node:path";
import { select } from "@inquirer/prompts";
import fse from "fs-extra";

export default async function openWorkshopLog() {
  const logs = await fse.readdir(path.join(process.env.USERPROFILE!, "Documents/Overwatch/Workshop"));
  const choiceLog = await select({
    message: "请选择：",
    choices: logs
      .toSorted((a, b) => b.localeCompare(a)),
  });
  const filepath = path.join(process.env.USERPROFILE!, "Documents/Overwatch/Workshop", choiceLog);
  console.info(filepath);
  Bun.openInEditor(filepath);
}
