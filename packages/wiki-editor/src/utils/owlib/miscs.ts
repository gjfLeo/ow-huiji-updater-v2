import path from "node:path";
import z from "zod";
import { OWLIB_DIR } from "../../constants/paths";
import { GUIDSchema, GUIDType } from "./shared";

const OwlibArcadeModeSchema = z.object({
  GUID: GUIDSchema(GUIDType.ArcadeMode),
  Name: z.string().nullable(),
  Description: z.string().nullable(),
  Image: z.union([GUIDSchema(GUIDType.Texture), GUIDSchema(GUIDType.Texture2)]).nullable(),
  Brawl: GUIDSchema(GUIDType.Brawl).nullable(),
  Children: GUIDSchema(GUIDType.ArcadeMode).array().nullable(),
  About: z.string().array().nullable(),
});
export type OwlibArcadeMode = z.infer<typeof OwlibArcadeModeSchema>;

export async function readOwlibArcadeModeList(): Promise<OwlibArcadeMode[]> {
  const file = Bun.file(path.join(OWLIB_DIR, "json/arcade-modes.json"));
  if (!await file.exists()) {
    throw new Error("arcade-modes.json不存在");
  }
  const list = Object.values(await file.json());
  return list.map((item) => {
    const { success, data, error } = OwlibArcadeModeSchema.safeParse(item);
    if (!success) {
      console.error("ArcadeMode解析失败");
      console.error(error);
      console.info(item);
      process.exit(1);
    }
    return data;
  });
}

const OwlibLootBoxSchema = z.object({
  GUID: GUIDSchema(GUIDType.LootBox),
  NameFormat: z.string(),
  Type: z.string(),
  LootBoxType: z.string(),
  ShopCards: z.object({
    Text: z.string(),
    Texture: GUIDSchema(GUIDType.Texture),
  }).array().nullable(),
  HidePucks: z.boolean(),
});
export type OwlibLootBox = z.infer<typeof OwlibLootBoxSchema>;

export async function readOwlibLootBoxList(): Promise<OwlibLootBox[]> {
  const file = Bun.file(path.join(OWLIB_DIR, "json/lootbox.json"));
  if (!await file.exists()) {
    throw new Error("lootbox.json不存在");
  }
  const list = Object.values(await file.json());
  return list.map((item) => {
    const { success, data, error } = OwlibLootBoxSchema.safeParse(item);
    if (!success) {
      console.error("LootBox解析失败");
      console.error(error);
      console.info(item);
      process.exit(1);
    }
    return data;
  });
}

const OwlibEsportsTeamSchema = z.object({
  Id: GUIDSchema(GUIDType.EsportsTeam),
  FullName: z.string(),
  Name: z.string().nullable(),
  Location: z.string().nullable(),
  Abbreviation: z.string().nullable(),
  Division: z.string(),
  Logo: GUIDSchema(GUIDType.Texture).nullable(),
  LogoAlt: GUIDSchema(GUIDType.Texture).nullable(),
});
type OwlibEsportsTeam = z.infer<typeof OwlibEsportsTeamSchema>;

export async function readOwlibEsportsTeamList(): Promise<OwlibEsportsTeam[]> {
  const file = Bun.file(path.join(OWLIB_DIR, "json/esport-teams.json"));
  if (!await file.exists()) {
    throw new Error("esport-teams.json不存在");
  }
  const list = Object.values(await file.json());
  return list.map((item) => {
    const { success, data, error } = OwlibEsportsTeamSchema.safeParse(item);
    if (!success) {
      console.error("EsportsTeam解析失败");
      console.error(error);
      console.info(item);
      process.exit(1);
    }
    return data;
  });
}
