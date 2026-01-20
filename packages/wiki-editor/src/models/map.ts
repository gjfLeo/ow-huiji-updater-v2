import z from "zod";

export const zWikiMap = z.object({
  _dataType: z.literal("map"),
  id: z.string(),
  idN: z.number(),
  name: z.string(),
  name_en: z.string(),
  mainGameMode: z.string(),
  region: z.string().optional(),
  flagName: z.string().optional(),
  variations: z.string().array().optional(),
  celebrationVariations: z.string().array().optional(),
});
export type WikiMap = z.infer<typeof zWikiMap>;
