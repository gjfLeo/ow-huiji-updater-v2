import path from "node:path";
import { zOWLibMap } from "../models/owlib/maps";
import { logger } from "../utils/logger";

export default async function mapDataUpdate() {
  const owLibMapsFile = Bun.file(path.resolve(__dirname, "../../output/owlib/json/maps.json"));
  if (!await owLibMapsFile.exists()) {
    logger.error("未找到OWLib地图数据文件");
    process.exit(1);
  }

  const owLibMapsRaw = zOWLibMap.array().parse(Object.values(await owLibMapsFile.json()));

  const outputData = owLibMapsRaw
    .filter(map => Boolean(map.Name))
    .filter(map => !map.Name?.startsWith("英雄精通") && !map.Name?.startsWith("Menu/"))
    .filter(map => map.MapType !== "PVE")
    .filter(map => !map.VariantName)
    .map((map) => {
      if (map.GUID.split(".")[0] !== map.MapGUID.split(".")[0]) {
        logger.warn(`地图${map.Name}的GUID与MapGUID不匹配`);
      }
      return {
        id: map.GUID.split(".")[0],
        name: map.Name,
        variations: map.Variations
          ?.toSorted((a, b) => a.GUID.localeCompare(b.GUID))
          .filter(variation => Boolean(variation.Name))
          .map(variation => variation.Name),
        // GUID: map.GUID,
        // Name: map.Name,
        // MapGUID: map.MapGUID,
        MapType: map.MapType,
        Thumbnail: map.Thumbnail,
        Image: map.Image,
        FlagImage: map.FlagImage,
        CelebrationVariants: map.CelebrationVariants,
        Variations: map.Variations,
      };
    });
  await Bun.write(
    path.resolve(__dirname, "../../output/temp/maps.json"),
    JSON.stringify(outputData, null, 2),
  );
}
