import z from "zod";

export const zHeroQuote = z.object({
  fileId: z.string(),
  hero: z.string(),
  heroName: z.string(),
  subtitle: z.string(),
  subtitle_en: z.string().optional(),
  category: z.string(),
  skin: z.string().optional(),
  criteria: z.string().optional(),
  weight: z.number().optional(),
  conversationId: z.string().optional(),
  conversationPosition: z.number().optional(),
});
export type HeroQuote = z.infer<typeof zHeroQuote>;

export const zHeroConversation = z.object({
  conversationId: z.string(),
  weight: z.number(),
  quotes: z.array(z.object({
    voiceLineId: z.string(),
    fileId: z.string().optional(),
    hero: z.string().optional(),
    position: z.number(),
  })),
});
export type HeroConversation = z.infer<typeof zHeroConversation>;
