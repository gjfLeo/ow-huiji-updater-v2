import { HERO_DATA_PATH } from "../constants/paths";
import { zWikiHero } from "../models/hero";
import { wikiDownloadData } from "../utils/data";

export default async function heroDataDownload() {
  return wikiDownloadData({
    prefix: "Hero/",
    outputDir: HERO_DATA_PATH,
    schema: zWikiHero,
  });
}
