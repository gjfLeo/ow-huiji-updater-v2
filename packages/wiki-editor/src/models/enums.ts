import z from "zod";

export const zWikiDataType = z.enum([
  "hero", // https://overwatch.huijiwiki.com/wiki/Data:Hero/tracer.json
  "ability", // https://overwatch.huijiwiki.com/wiki/Data:Ability/猎空/脉冲双枪.json
]);
export type WikiDataType = z.infer<typeof zWikiDataType>;
