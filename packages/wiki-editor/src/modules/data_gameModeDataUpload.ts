import type { WikiGameMode } from "../models/game-mode";
import path from "node:path";
import chalk from "chalk";
import { gameModesRaw } from "../data/game-mode";
import { wikiLogin } from "../export";
import { zWikiGameMode } from "../models/game-mode";
import { logger } from "../utils/logger";
import { Tabx } from "../utils/tabx";

const outputFilePath = path.resolve(__dirname, "../../output/temp/GameModes.tabx");

export default async function uploadGameModeData() {
  const tabx = Tabx.fromHeaders<WikiGameMode>([
    { key: "_dataType", type: "string" },
    { key: "key", type: "string" },
    { key: "name", type: "string" },
    { key: "name_en", type: "string" },
    { key: "iconName", type: "string" },
    { key: "playMode", type: "string" },
  ]);

  const gameModes = zWikiGameMode.array().parse(gameModesRaw);
  tabx.addItems(gameModes);

  const wiki = await wikiLogin({ userType: "user" });
  await wiki.editPage("Data:GameModes.tabx", JSON.stringify(tabx.json, null, 2));

  await Bun.write(outputFilePath, JSON.stringify(tabx.json, null, 2));
  logger.success(`编辑完成 ${chalk.gray(path.relative(process.cwd(), outputFilePath))}`);
}
