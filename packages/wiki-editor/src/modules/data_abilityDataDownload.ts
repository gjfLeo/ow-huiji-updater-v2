import { ABILITY_DATA_PATH } from "../constants/paths";
import { zWikiAbility } from "../models/ability";
import { wikiDownloadData } from "../utils/data";

export default async function abilityDataDownload() {
  return wikiDownloadData({
    prefix: "Ability/",
    batchSize: 80,
    outputDir: ABILITY_DATA_PATH,
    schema: zWikiAbility,
  });
}
