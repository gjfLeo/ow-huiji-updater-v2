import z from "zod";

export const zWikiGameMode = z.object({
  _dataType: z.literal("gameMode"),
  key: z.string(),
  name: z.string(),
  name_en: z.string(),
  iconName: z.string(),
  playMode: z.enum(["standard", "arcade", "stadium", "other"]),
});
export type WikiGameMode = z.infer<typeof zWikiGameMode>;
