import { z } from "zod";

export const zRole = z.enum(["tank", "damage", "support"]);
export type Role = z.infer<typeof zRole>;

export const zWikiHero = z.object({
  _hjschema: z.literal("Hero"),
  _dataType: z.literal("hero"),
  key: z.string(),
  name: z.string(),
  nameEn: z.string(),
  role: zRole,
  revealDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  releaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  releaseDateDescription: z.string().optional(),
  color: z.string().optional(),
  nationality: z.string().optional(),
  birthday: z.string().optional(),
  age: z.string().optional(),

  hitPoints: z.object({
    health: z.number(),
    armor: z.number(),
    shields: z.number(),
  }),
  movementSpeed: z.number(),
  meleeDamage: z.number(),
  perkXp: z.object({
    minor: z.number(),
    major: z.number(),
  }),

  description: z.string(),
  story: z.object({
    intro: z.string(),
    chapters: z.array(z.object({
      title: z.string(),
      content: z.string(),
    })),
    accessDate: z.string().optional(),
  }),
});
export type WikiHero = z.infer<typeof zWikiHero>;
