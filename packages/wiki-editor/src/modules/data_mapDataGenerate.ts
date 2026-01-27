import type { WikiMap } from "../models/map";
import path from "node:path";
import chalk from "chalk";
import { mapsRaw } from "../data/maps";
import { wikiLogin } from "../export";
import { zWikiMap } from "../models/map";
import { logger } from "../utils/logger";
import { Tabx } from "../utils/tabx";

const outputFilePath = path.resolve(__dirname, "../../output/temp/Maps.tabx");

export default async function uploadMapData() {
  const tabx = Tabx.fromHeaders<WikiMap>([
    { key: "_dataType", type: "string" },
    { key: "id", type: "string" },
    { key: "idN", type: "number" },
    { key: "name", type: "string" },
    { key: "name_en", type: "string" },
    { key: "mainGameMode", type: "string" },
    { key: "region", type: "string" },
    { key: "flagName", type: "string" },
    { key: "variations", type: "string", isArray: true },
    { key: "celebrationVariations", type: "string", isArray: true },
  ]);

  const maps = zWikiMap.array().parse(
    mapsRaw.map(item => ({
      _dataType: "map",
      ...item,
      idN: Number.parseInt(item.id, 16),
    })),
  );
  tabx.addItems(maps);

  const wiki = await wikiLogin({ userType: "user" });
  await wiki.editPage("Data:Maps.tabx", JSON.stringify(tabx.toJson(), null, 2));

  await Bun.write(outputFilePath, JSON.stringify(tabx.toJson(), null, 2));
  logger.success(`编辑完成 ${chalk.gray(path.relative(process.cwd(), outputFilePath))}`);
}
