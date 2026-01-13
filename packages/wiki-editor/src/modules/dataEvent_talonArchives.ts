import { z } from "zod";

// https://ld5.res.netease.com/xt/manage/20260103/5d85f3ee52772c52e6c10022569f7dcd_1767420112672.json

export enum MediaType {
  Video = 1,
  Image = 2,
  Record = 3,
  Audio = 4,
  ShortStory = 5,
  Book = 6,
}

const zRawArchive = z.object({
  id: z.number(),
  order_id: z.number(),
  name: z.string(),
  type: z.number(),
  hero_id: z.number(),
  hero_name: z.number(),
  key_amount: z.number(),
  img_url: z.string(),
  bgm_url: z.string(),
});

const zRawGood = z.object({
  id: z.number(),
  name: z.string(),
  reward_type: z.number(),
  rarity: z.number(),
  hero_id: z.number(),
  hero_name: z.string(),
  bigpic_url: z.string(),
});

const zRawHero = z.object({
  "hero_id": z.number(),
  "name": z.string(),
  "en-name": z.string(),
  "hero_type": z.number(),
  "icon": z.string(),
  "img": z.string(),
});

const zRawMedia = z.object({
  id: z.number(),
  media_name: z.string(),
  media_type: z.enum(MediaType),
  key_amount: z.number(),
  tag_url: z.string(),
});
export type RawMedia = z.infer<typeof zRawMedia>;

const zRawMilestone = z.object({
  id: z.number(),
  milestone_name: z.string(),
  self_select: z.number(),
  reward_mark: z.string(),
  milestone_target: z.number(),
  reward_type: z.number(),
  reward_name: z.string(),
  reward_cnt: z.number(),
  reward_pic: z.string(),
});

const zRawRelation = z.object({
  archive_id: z.number(),
  table_name: z.enum(["档案正文", "档案简介"]),
  table_title: z.string(),
  doc_display: z.number(),
  medium_id: z.string(),
  medium_content: z.string(),
});

const zRawTask = z.object({
  id: z.number(),
  task_type: z.number(),
  task_name: z.enum(["快速训练", "结伴训练", "黑爪训练"]),
  task_mark: z.string(),
  task_income: z.number(),
  task_target: z.number(),
});

export const zTalonArchivesRaw = z.object({
  "version": z.number(),
  "ccc-goods": z.record(z.string(), zRawGood),
  "ccc-task": z.record(z.string(), zRawTask),
  "ccc-milestone": z.record(z.string(), zRawMilestone),
  "ccc-hero": z.record(z.string(), zRawHero),
  "ccc-archives": z.record(z.string(), zRawArchive),
  "ccc-medias": z.record(z.string(), zRawMedia),
}).and(z.looseRecord(z.string().startsWith("ccc-medias-"), zRawRelation.array()));

export const zTalonArchivesMediaDetail = z.object({
  media_id: z.number(),
  status: z.number(),
  media_name: z.string(),
  media_type: z.enum(MediaType), // 1-视频，2-图片，3-记录，4-音频，5-短篇故事，6-绘本
  key_amount: z.number(),
  media_content: z.string(),
  media_img: z.string(),
  tag_url: z.string(),
  media_url: z.string(),
  talk_phrase: z.string(),
});

export function getImageFilename(mediaName: string, mediaType: MediaType) {
  switch (mediaType) {
    case MediaType.Image:
      mediaName = mediaName.replace(/-图(\d+)$/g, "_$1");
      return `黑爪档案_${mediaName}.png`;
    case MediaType.Video:
      mediaName = mediaName.replace(/-视频(\d+)$/g, "_$1");
      return `黑爪档案_${mediaName}_封面.png`;
    case MediaType.Book:
    case MediaType.ShortStory:
      return `黑爪档案_${mediaName}_封面.png`;
    default:
      throw new Error("未支持的媒体类型");
  }
}
