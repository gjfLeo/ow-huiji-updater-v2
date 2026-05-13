import path from "node:path";
import z from "zod";
import { OWLIB_DIR } from "../../constants/paths";
import { GUIDSchema, GUIDType } from "./shared";

const OwlibTalentSchema = z.object({
  GUID: GUIDSchema(GUIDType.HeroTalent),
  Name: z.string(),
  TalentType: z.enum(["Talent", "Perk"]),
  Loadout: z.object({
    GUID: GUIDSchema(GUIDType.HeroLoadout),
    Name: z.string(),
    HeroGUID: GUIDSchema(GUIDType.Hero).nullable(),
    HeroName: z.string().nullable(),
  }).nullable(),
  MaxCount: z.number(),
  Cost: z.number(),
  Hero: z.object({
    GUID: GUIDSchema(GUIDType.Hero),
    Value: z.string(),
  }).nullable(),
  Rarity: z.object({
    GUID: GUIDSchema(GUIDType.Category),
    Value: z.string(),
  }).nullable(),
  Category: z.object({
    GUID: GUIDSchema(GUIDType.Category),
    Value: z.string(),
  }).nullable(),
  Level: z.number(),
  Major: z.boolean(),
  Description: z.string().nullable(),
  TextureGUID: GUIDSchema(GUIDType.Texture).nullable(),
});
export type OwlibTalent = z.infer<typeof OwlibTalentSchema>;

export async function readOwlibTalentList(): Promise<OwlibTalent[]> {
  const file = Bun.file(path.join(OWLIB_DIR, "json/talents.json"));
  if (!await file.exists()) {
    throw new Error("talents.json不存在");
  }
  const list = Object.entries(await file.json())
    .map(([GUID, value]) => ({ ...(value as object), GUID }));
  return list.map((item) => {
    const { success, data, error } = OwlibTalentSchema.safeParse(item);
    if (!success) {
      console.error("Talent解析失败");
      console.error(error);
      console.info(item);
      process.exit(1);
    }
    return data;
  });
}
