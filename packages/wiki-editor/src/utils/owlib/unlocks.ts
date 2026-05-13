import path from "node:path";
import z from "zod";
import { OWLIB_DIR } from "../../constants/paths";

import { GUIDSchema, GUIDType } from "./shared";

const OwlibUnlockSchema = z.object({
  GUID: GUIDSchema(GUIDType.Unlock),
  Hero: GUIDSchema(GUIDType.String).optional(),
  Name: z.union([GUIDSchema(GUIDType.String), z.string(), z.null()]),
  Type: z.enum([
    "BattlePass",
    "BattlePassTierSkip",
    "BattlePassXP",
    "CompetitiveCurrency",
    "CompetitiveSignature",
    "Currency",
    "Emote",
    "Hero",
    "HighlightIntro",
    "Icon",
    "Lootbox",
    "NameCard",
    "OWLToken",
    "PlayerTitle",
    "PortraitFrame",
    "SeasonXPBoost",
    "Skin",
    "SkinComponent",
    "Souvenir",
    "Spray",
    "StoryMission",
    "Unknown",
    "VictoryPose",
    "VirtualCurrency",
    "VoiceLine",
    "WeaponCharm",
    "WeaponSkin",
    "WeaponVariant",
  ]),
  Rarity: z.enum([
    "Common",
    "Epic",
    "Exclusive",
    "Legendary",
    "Mythic",
    "None",
    "Rare",
  ]),
  Description: GUIDSchema(GUIDType.String).nullable(),
  AvailableIn: GUIDSchema(GUIDType.String).nullable().optional(),
  ProductId: z.number(),
  Categories: GUIDSchema(GUIDType.Category).array().nullable().optional(),
  LootBoxType: z.string().optional(),
  SkinThemeGUID: z.union([
    GUIDSchema(GUIDType.SkinTheme1),
    GUIDSchema(GUIDType.SkinTheme2),
  ]).nullable().optional(),
  IsEsportsUnlock: z.boolean().optional(),
  Amount: z.number().optional(),
  EsportsTeam: z.string().optional(), // StringGUID的组合
  HeroGUID: GUIDSchema(GUIDType.Hero).optional(),
  ParentUnlockGUID: GUIDSchema(GUIDType.Unlock).optional(),
});
type OwlibUnlock = z.infer<typeof OwlibUnlockSchema>;

export async function readOwlibUnlockList(): Promise<OwlibUnlock[]> {
  const file = Bun.file(path.join(OWLIB_DIR, "json/unlocks_guid.json"));
  if (!await file.exists()) {
    throw new Error("unlocks_guid.json不存在");
  }
  const list = Object.values(await file.json());
  return list.map((item) => {
    const { success, data, error } = OwlibUnlockSchema.safeParse(item);
    if (!success) {
      console.error("Unlock解析失败");
      console.error(error);
      console.info(item);
      process.exit(1);
    }
    return data;
  });
}
