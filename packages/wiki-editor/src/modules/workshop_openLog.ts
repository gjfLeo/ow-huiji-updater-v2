import path from "node:path";
import { select } from "@inquirer/prompts";
import fse from "fs-extra";

export default async function openWorkshopLog() {
  const logPath = path.join(process.env.USERPROFILE!, "Documents/Overwatch/Workshop");
  if (!await fse.pathExists(logPath)) {
    console.error("  地图工坊日志目录不存在");
    process.exit(1);
  }
  const logs = await fse.readdir(logPath);
  const choiceLog = await select({
    message: "请选择：",
    choices: logs
      .toSorted((a, b) => b.localeCompare(a)),
  });
  const filepath = path.join(process.env.USERPROFILE!, "Documents/Overwatch/Workshop", choiceLog);
  console.info(`  ${filepath}`);
  Bun.openInEditor(filepath);
}
