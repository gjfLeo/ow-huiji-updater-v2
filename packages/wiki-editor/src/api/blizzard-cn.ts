import path from "node:path";
import { destr } from "destr";
import { ofetch } from "ofetch";
import { z } from "zod";
import { zRole, zRoleKey } from "../models/hero";
import { logger } from "../utils/logger";

const zBlizzardCnArmoryApiResponse = z.object({
  code: z.number(),
  message: z.string(),
  data: z.any(),
});

const blizzardCnArmoryApi = ofetch.create({
  baseURL: "https://webapi.blizzard.cn/ow-armory-server",
  parseResponse(responseText) {
    const res = zBlizzardCnArmoryApiResponse.parse(destr(responseText));
    if (res.code !== 0) {
      console.error(res);
      throw new Error(res.message);
    }
    return res.data;
  },
});

const zIndex = z.object({
  hero_configs: z.url(),
  patch_desc: z.any(),
  seasons: z.array(
    z.object({
      name: z.string(),
      id: z.coerce.number(),
      desc: z.string().regex(/^\[\d{4}-\d{2}-\d{2},\d{4}-\d{2}-\d{2}\]$/),
    }),
  ),
});

const zHeroConfigData = z
  .object({
    heroConfigs: z.array(
      z.object({
        id: z.string(),
        headSrc: z.string(),
        name: z.preprocess((n) => {
          if (n === "D.VA") return "D.Va";
          return n;
        }, z.string()),
        desc: z.string(),
        typeName: zRole,
        type: z.preprocess(s => String(s).toLowerCase(), zRoleKey),
        mode: z.literal("Fighting").optional(),
        location: z.string(),
        birthday: z.string(),
        picList: z.string().array().length(3),
        skillIntros: z.array(
          z.object({
            video: z.string(),
            videoPoster: z.string(),
            name: z.string(),
            desc: z.string(),
            icon: z.string(),
          }),
        ),
        storyIntro: z.string(),
        stories: z.array(
          z.object({
            image: z.url(),
            title: z.string(),
            content: z.string(),
          }),
        ),
        storyVideo: z.object({
          cover: z.union([z.url(), z.literal("")]),
          src: z.union([z.url(), z.literal("")]),
        }),
        isNew: z.boolean().optional(),
        bgColor: z.string().optional(),
        talents: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            iconUrl: z.url(),
            description: z.string(),
          }),
        ).optional(),
      }).strict(),
    ),
  })
  .transform(v => v.heroConfigs);
type BlizzardHeroes = z.infer<typeof zHeroConfigData>;
export type BlizzardCnHero = BlizzardHeroes[0];

const heroKeyOverride: Record<string, string> = {
  jetpackcat: "jetpack-cat",
};

const cnHeroData: Record<string, BlizzardCnHero> = {};
export async function fetchBlizzardHeroData() {
  // if (Object.keys(cnHeroData).length) {
  //   return cnHeroData;
  // }
  try {
    const response = await blizzardCnArmoryApi("/index");
    await Bun.write(
      path.resolve(__dirname, "../../output/temp/blizzardCnArmoryApiIndex.json"),
      JSON.stringify(response, null, 2),
    );
    const indexData = zIndex.parse(response);

    const heroConfigResponse = await ofetch(indexData.hero_configs);
    await Bun.write(
      path.resolve(__dirname, "../../output/temp/blizzardCnArmoryApiHeroConfig.json"),
      JSON.stringify(heroConfigResponse, null, 2),
    );
    const { data: cnHeroList, success, error } = zHeroConfigData.safeParse(heroConfigResponse);
    if (!success) {
      logger.error("国服API英雄数据解析失败");
      console.error(error);
      process.exit(1);
    }

    cnHeroList.forEach((hero) => {
      cnHeroData[heroKeyOverride[hero.id] || hero.id] = hero;
    });
    return cnHeroData;
  }
  catch (error) {
    throw new Error("从国服API获取英雄数据失败", { cause: error });
  }
}

export async function fetchBlizzardHero(key: string) {
  const data = await fetchBlizzardHeroData();
  return data[key];
}
