import path from "node:path";
import { destr } from "destr";
import { ofetch } from "ofetch";
import { z } from "zod";
import { zRole } from "../models/hero";

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
        typeName: z.string(),
        type: z.preprocess(s => String(s).toLowerCase(), zRole),
        location: z.string(),
        birthday: z.string(),
        picList: z.url().array().length(3),
        skillIntros: z.array(
          z.object({
            video: z.url(),
            videoPoster: z.url(),
            name: z.string(),
            desc: z.string(),
            icon: z.url(),
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
      }).strict(),
    ),
  })
  .transform(v => v.heroConfigs);
type BlizzardHeroes = z.infer<typeof zHeroConfigData>;
export type BlizzardCnHero = BlizzardHeroes[0];

const cnHeroData: Record<string, BlizzardCnHero> = {};
export async function fetchBlizzardHeroData() {
  if (Object.keys(cnHeroData).length) {
    return cnHeroData;
  }
  try {
    const response = await blizzardCnArmoryApi("/index");
    const indexData = zIndex.parse(response);
    await Bun.write(
      path.resolve(__dirname, "../../output/temp/blizzardCnArmoryApiIndex.json"),
      JSON.stringify(response, null, 2),
    );

    const heroConfigResponse = await ofetch(indexData.hero_configs);
    const cnHeroList = zHeroConfigData.parse(heroConfigResponse);
    await Bun.write(
      path.resolve(__dirname, "../../output/temp/blizzardCnArmoryApiHeroConfig.json"),
      JSON.stringify(heroConfigResponse, null, 2),
    );

    cnHeroList.forEach((hero) => {
      cnHeroData[hero.id] = hero;
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
