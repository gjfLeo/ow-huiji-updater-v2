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
  color: z.string().optional(),
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
