import path from "node:path";
import { copy, emptyDir, exists } from "fs-extra";
import { glob } from "tinyglobby";
import { OUTPUT_ABILITY_IMAGE_DIR, OWLIB_EXTRACT_HERO_ICONS_DIR, OWLIB_HERO_LIST, OWLIB_UI_TEXTURE_DIR } from "../constants/paths";
import { zOWLibHero } from "../models/owlib/heroes";
import { logger, spinnerProgress } from "../utils/logger";

export default async function data_abilityImageGenerate() {
  const owlibHeroList = zOWLibHero.array()
    .parse(Object.values(await Bun.file(OWLIB_HERO_LIST).json()))
    .filter(item => item.IsHero);

  await emptyDir(OUTPUT_ABILITY_IMAGE_DIR);

  spinnerProgress.start("生成技能图标", owlibHeroList.flatMap(hero => [
    ...hero.Loadouts,
    ...hero.Perks,
  ]).length);
  for (const owlibHero of owlibHeroList) {
    for (const ability of [...owlibHero.Loadouts, ...owlibHero.Perks]) {
      if (ability.Name.startsWith("职责：") || !ability.TextureGUID) {
        spinnerProgress.increment();
        continue;
      }
      const [filename, typeGuid] = ability.TextureGUID.split(".") as [string, string];
      if (typeGuid !== "004") {
        logger.error(`技能${ability.Name}的图标不是004类型，而是${typeGuid}`);
        process.exit(1);
      }

      const sourceFile = path.join(OWLIB_UI_TEXTURE_DIR, `${filename}.png`);
      if (!await exists(sourceFile)) {
        logger.error(`技能${ability.Name}的图标${filename}.png不存在`);
        process.exit(1);
      }
      await copy(
        sourceFile,
        path.join(OUTPUT_ABILITY_IMAGE_DIR, `${owlibHero.Name}_${ability.Name}_图标.png`),
      );
      spinnerProgress.increment();
    }
  }
  spinnerProgress.succeed();
}
