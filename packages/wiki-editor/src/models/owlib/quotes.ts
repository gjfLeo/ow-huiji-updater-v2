import z from "zod";

export const OwLibConversationListSchema = z.object({
  GUID: z.string().regex(/^[0-9A-F]{12}.0D0$/),
  StimulusGUID: z.string().regex(/^[0-9A-F]{12}.078$/),
  Weight: z.number(),
  Voicelines: z.object({
    GUID: z.null(),
    VoicelineGUID: z.string().regex(/^[0-9A-F]{12}.06F$/),
    Position: z.number(),
  }).array(),
}).array();
export type OwLibConversationList = z.infer<typeof OwLibConversationListSchema>;
