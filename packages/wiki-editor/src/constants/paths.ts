import path from "node:path";

export const OWLIB_DIR = path.join(__dirname, "../../output/owlib");
export const OWLIB_UI_TEXTURE_DIR = path.join(OWLIB_DIR, "dump/UITextureDump");
export const OWLIB_HERO_LIST = path.join(OWLIB_DIR, "json/heroes.json");
export const OWLIB_EXTRACT_HERO_ICONS_DIR = path.join(OWLIB_DIR, "extract/HeroIcons");

export const OUTPUT_DIR = path.join(__dirname, "../../output");
export const OUTPUT_IMAGE_DIR = path.join(OUTPUT_DIR, "images");
export const OUTPUT_HERO_IMAGE_DIR = path.join(OUTPUT_IMAGE_DIR, "heroes");
export const OUTPUT_ABILITY_IMAGE_DIR = path.join(OUTPUT_IMAGE_DIR, "abilities");
export const OUTPUT_IMAGE_BY_SIZE_DIR = path.join(OUTPUT_IMAGE_DIR, "bySize");
