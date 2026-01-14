import { ofetch } from "ofetch";
import { z } from "zod";
import { zRole } from "../models/hero";

export const overfastApi = ofetch.create({
  baseURL: "https://overfast-api.tekrop.fr/",
});
const zOverfastHero = z.object({
  name: z.string(),
  description: z.string(),
  portrait: z.url(),
  role: zRole,
  location: z.string(),
  age: z.number(),
  birthday: z.string().nullable(),
  hitpoints: z.object({
    health: z.number(),
    armor: z.number(),
    shields: z.number(),
    total: z.number(),
  }),
  abilities: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      icon: z.url(),
      video: z.object({
        thumbnail: z.url(),
        link: z.object({
          mp4: z.url(),
          webm: z.url(),
        }),
      }),
    }),
  ),
  story: z.object({
    summary: z.string(),
    media: z.object({
      type: z.enum(["comic", "short-story", "video"]),
      link: z.url(),
    }).nullish(),
    chapters: z.array(
      z.object({
        title: z.string(),
        content: z.string(),
        picture: z.url(),
      }),
    ),
  }),
}).strict();
export type OverfastHero = z.infer<typeof zOverfastHero>;

export async function fetchOverfastHero(key: string) {
  const response = await overfastApi(`/heroes/${key}`);
  try {
    const hero = zOverfastHero.parse(response);
    return hero;
  }
  catch (error) {
    console.warn("Failed to fetch OverFast data", error);
    console.warn(response);
    return undefined;
  }
}
