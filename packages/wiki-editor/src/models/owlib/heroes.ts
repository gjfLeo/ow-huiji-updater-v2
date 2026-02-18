import z from "zod";

export const zOWLibHeroLoadout = z.object({
  GUID: z.string(),
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
  TextureGUID: z.string().nullable(),
});
export type Loadout = z.infer<typeof zOWLibHeroLoadout>;

export const zOWLibHero = z.object({
  GUID: z.string(),
  Name: z.string().nullable(),
  Description: z.string().nullable(),
  Class: z.enum(["Damage", "Support", "Tank"]).nullable(),
  Gender: z.enum(["Female", "Generic", "Male"]),
  Size: z.enum(["Large", "Normal", "Small"]),
  Color: z.string(),
  sRGBColor: z.string(),
  GalleryColor: z.object({ R: z.number(), G: z.number(), B: z.number(), A: z.number() }),
  IsHero: z.boolean(),
  SupportsAi: z.boolean(),
  Loadouts: z.array(zOWLibHeroLoadout),
  Perks: z.array(zOWLibHeroLoadout),
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
    TextureGUID: z.string().nullable(),
  })),
});
export type WelcomeValue = z.infer<typeof zOWLibHero>;
