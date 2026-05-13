import z from "zod";
import { OWLIB_HERO_LIST } from "../../constants/paths";
import { GUIDSchema, GUIDType } from "./shared";

const OwlibHeroLoadoutSchema = z.object({
  GUID: GUIDSchema(GUIDType.HeroLoadout),
  Name: z.string(),
  Description: z.string().nullable(),
  Category: z.enum([
    "Ability",
    "PassiveAbility",
    "Perk",
    "UltimateAbility",
    "Weapon",
    "Subrole",
    "HeroStats",
  ]),
  MovieGUID: z.null(),
  TextureGUID: GUIDSchema(GUIDType.Texture).nullable(),
});

const OwlibHeroSchema = z.object({
  GUID: GUIDSchema(GUIDType.Hero),
  Name: z.string().nullable(),
  Description: z.string().nullable(),
  Class: z.enum(["Damage", "Support", "Tank"]).nullable(),
  Gender: z.enum(["Female", "Generic", "Male"]),
  Size: z.enum(["Large", "Normal", "Small"]),
  Color: z.string().regex(/#[0-9A-F]{8}/),
  sRGBColor: z.string().regex(/#[0-9A-F]{8}/),
  GalleryColor: z.object({ R: z.number(), G: z.number(), B: z.number(), A: z.number() }),
  IsHero: z.boolean(),
  SupportsAi: z.boolean(),
  Loadouts: OwlibHeroLoadoutSchema.array(),
  Perks: OwlibHeroLoadoutSchema.array(),
  Images: z.array(z.object({
    Id: z.enum([
      "0000000040C7.01C",
      "0000000040C8.01C",
      "0000000040C9.01C",
      "0000000040CA.01C",
      "0000000040D2.01C",
      "000000010297.01C",
      "000000010298.01C",
      "0000000106EC.01C",
      "000000011323.01C",
    ]),
    TextureGUID: z.union([GUIDSchema(GUIDType.Texture), GUIDSchema(GUIDType.VectorImage)]).nullable(),
  })),
});
type OwlibHero = z.infer<typeof OwlibHeroSchema>;

export async function readOwlibHeroList(): Promise<OwlibHero[]> {
  const file = Bun.file(OWLIB_HERO_LIST);
  if (!await file.exists()) {
    throw new Error("heroes.json不存在");
  }
  const list = Object.values(await file.json());
  return OwlibHeroSchema.array().parse(list);
}
