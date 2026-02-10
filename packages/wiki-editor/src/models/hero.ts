import { z } from "zod";

export const zRoleKey = z.enum(["tank", "damage", "support"]);
export const zRole = z.enum([
  "重装",
  "输出",
  "支援",
]);
export const zSubRole = z.enum([
  /* eslint-disable antfu/consistent-list-newline */
  "斗士", "先锋", "铁壁",
  "神准", "奇袭", "专业", "侦查",
  "战术", "医疗", "生存",
  /* eslint-enable antfu/consistent-list-newline */
]);

export const zWikiHero = z.object({
  _dataType: z.literal("Hero"),
  key: z.string(),
  name: z.string(),
  nameEn: z.string(),
  role: zRole,
  subRole: zSubRole,
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
