import z from "zod";

export const MapInfoSchema = z.object({
  GUID: z.string(),
  Name: z.string(),
  VariantName: z.string(),
});
export type MapInfo = z.infer<typeof MapInfoSchema>;

export const zOWLibMapVariation = z.object({
  GUID: z.string(),
  Name: z.string().nullable(),
});
export type Variation = z.infer<typeof zOWLibMapVariation>;

export const zOWLibCelebrationVariant = z.object({
  GUID: z.string(),
  Name: z.string(),
  MapInfo: z.object({
    GUID: z.string(),
    Name: z.string(),
    VariantName: z.string(),
  }).nullable(),
});
export type CelebrationVariant = z.infer<typeof zOWLibCelebrationVariant>;

export const zOWLibMap = z.object({
  GUID: z.string(),
  Name: z.string().nullable(),
  Description: z.string().nullable(),
  Description2: z.string().nullable(),
  Subline: z.string().nullable(),
  StateA: z.string().nullable(),
  StateB: z.string().nullable(),
  VariantName: z.string().nullable(),
  MapGUID: z.string(),
  GameModes: z.null(),
  MapType: z.enum(["MirroredMap", "OffenseDefenseMap", "PVE"]),
  Thumbnail: z.string().nullable(),
  Image: z.string().nullable(),
  FlagImage: z.string().nullable(),
  CelebrationVariants: z.array(zOWLibCelebrationVariant).nullable(),
  Variations: z.array(zOWLibMapVariation),
});
export type MapValue = z.infer<typeof zOWLibMap>;
