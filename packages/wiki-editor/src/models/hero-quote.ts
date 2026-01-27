import z from "zod";

export const zWikiHeroQuote = z.object({
  _dataType: z.literal("HeroQuote"),
  fileId: z.string().regex(/^[0-9A-F]{12}\.0B2$/),
  fileId_n: z.number(),
  hero: z.string(),
  heroName: z.string(),
  subtitle: z.string(),
  subtitle_en: z.string(),
  category: z.string(),
  skin: z.string().optional(),
  criteria: z.string().optional(),
  weight: z.number().optional(),
  conversationId: z.string().optional(),
  conversationPosition: z.number().optional(),
});
export type WikiHeroQuote = z.infer<typeof zWikiHeroQuote>;

export const zWikiHeroConversation = z.object({
  conversationId: z.string(),
  weight: z.number(),
  quotes: z.array(z.object({
    voiceLineId: z.string(),
    fileId: z.string().optional(),
    hero: z.string().optional(),
    position: z.number(),
  })),
});
export type WikiHeroConversation = z.infer<typeof zWikiHeroConversation>;

export const zQuoteCriteriaSingleCondition = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("toHero"),
    hero: z.string().optional(),
    heroTag: z.string().optional(),
    negative: z.boolean().optional(),
  }),
  z.object({
    type: z.literal("withHero"),
    hero: z.string().optional(),
    heroTag: z.string().optional(),
    negative: z.boolean().optional(),
  }),
  z.object({
    type: z.literal("map"),
    map: z.string(),
    notEventVariants: z.boolean().optional(),
    negative: z.boolean().optional(),
  }),
  z.object({
    type: z.literal("team"),
    team: z.enum(["attack", "defense"]),
    unknownBool: z.boolean().optional(),
    negative: z.boolean().optional(),
  }),
  z.object({
    type: z.literal("toGender"),
    gender: z.enum(["male", "female", "neutral"]),
    negative: z.boolean().optional(),
  }),
  z.object({
    type: z.literal("scripted"),
    script: z.string(),
    scriptDesc: z.string(),
    negative: z.boolean().optional(),
  }),
  z.object({
    type: z.literal("celebration"),
    celebration: z.string(),
    negative: z.boolean().optional(),
  }),
  z.object({
    type: z.literal("gameMode"),
    gameMode: z.string(),
    negative: z.boolean().optional(),
  }),
  z.object({
    type: z.literal("mission"),
    mission: z.string().optional(),
    objective: z.string().optional(),
    negative: z.boolean().optional(),
  }),
  z.object({
    type: z.literal("talent"),
    talent: z.string(),
    negative: z.boolean().optional(),
  }),
  z.object({
    type: z.literal("unknown"),
    raw: z.string(),
    negative: z.boolean().optional(),
  }),
]);
export type QuoteCriteriaSingleCondition = z.infer<typeof zQuoteCriteriaSingleCondition>;
export type QuoteCriteriaCondition = QuoteCriteriaSingleCondition | {
  type: "nested";
  total: number;
  needed: number;
  conditions: QuoteCriteriaCondition[];
};
export const zQuoteCriteriaCondition: z.ZodType<QuoteCriteriaCondition> = z.lazy(
  () => z.discriminatedUnion("type", [
    z.object({
      type: z.literal("nested"),
      total: z.number(),
      needed: z.number(),
      conditions: zQuoteCriteriaCondition.array(),
    }),
    zQuoteCriteriaSingleCondition,
  ]),
);
