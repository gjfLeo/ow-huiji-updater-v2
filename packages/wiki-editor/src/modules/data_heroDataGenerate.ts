import type { BlizzardCnHero } from "../api/blizzard-cn";
import type { WikiHero, WikiHeroUnfinished } from "../models/hero";
import path from "node:path";
import { confirm } from "@inquirer/prompts";
import dayjs from "dayjs";
import destr from "destr";
import { copy, emptyDir, ensureDir } from "fs-extra";
import { fetchBlizzardHeroData } from "../api/blizzard-cn";
import { fetchOverfastHero } from "../api/overfast";
import { OUTPUT_HERO_IMAGE_DIR } from "../constants/paths";
import { zWikiHero, zWikiHeroUnfinished } from "../models/hero";
import { zOWLibHero } from "../models/owlib/heroes";
import { logger, spinnerProgress } from "../utils/logger";
import { wikiBatchGet } from "../wiki/batch";

const OWLIB_DIR = path.resolve(__dirname, "../../output/owlib");
const HERO_DATA_DIR = path.resolve(__dirname, "../../assets/data/heroes");

const ImageNameMap: Record<string, string> = {
  "0000000040C7.01C": "头像_3D",
  "0000000040C8.01C": "头像_游戏内",
  "0000000040C9.01C": "头像_2D",
};

export default async function heroDataUpdate() {
  const heroDataPages = await wikiBatchGet({
    namespace: 3500,
    prefix: "Hero/",
  });
  const heroCount = Object.values(heroDataPages).length;

  const wikiHeroDataList = zWikiHero.array().parse(
    Object.values(heroDataPages).map(content => destr(content)),
  );
  const wikiHeroMap = Object.fromEntries(wikiHeroDataList.map(h => [h.key, h]));

  const unfinishedHeroMap: Record<string, WikiHeroUnfinished> = {};

  // MARK: Blizzard CN

  spinnerProgress.start("根据国服数据更新", heroCount);
  const blizzardHeroMap = await fetchBlizzardHeroData();
  spinnerProgress.setTotal(Object.entries(blizzardHeroMap).length);
  const changedHeroes: string[] = [];
  for (const [key, blizzardHero] of Object.entries(blizzardHeroMap)) {
    if (wikiHeroMap[key]) {
      const wikiHero = wikiHeroMap[key];
      let changed = false;
      changed ||= updateStory(wikiHero, blizzardHero);
      changed ||= updateBirthday(wikiHero, blizzardHero);
      if (changed) {
        changedHeroes.push(key);
      }
    }
    else {
      const overfastHero = await fetchOverfastHero(key);
      const wikiHeroUnfinished: Partial<WikiHeroUnfinished> = {
        _dataType: "Hero",
        key,
        name: blizzardHero.name,
        nameEn: overfastHero.name,
        role: blizzardHero.typeName,
        subRole: "未知",
        revealDate: null,
        releaseDate: null,
        releaseDateDescription: null,
        hitPoints: {
          health: 0,
          armor: 0,
          shields: 0,
        },
        movementSpeed: 5.5,
        meleeDamage: 40,
        perkXp: {
          minor: 0,
          major: 0,
        },
        description: blizzardHero.desc,
      };
      updateBirthday(wikiHeroUnfinished, blizzardHero);
      updateStory(wikiHeroUnfinished, blizzardHero);
      unfinishedHeroMap[key] = zWikiHeroUnfinished.parse(wikiHeroUnfinished);
    }
    spinnerProgress.increment();
  }
  spinnerProgress.succeed();
  if (changedHeroes.length) {
    logger.info(`${changedHeroes.length}个英雄需要更新：${changedHeroes.join(", ")}`);
  }
  if (Object.keys(unfinishedHeroMap).length) {
    logger.info(`${Object.keys(unfinishedHeroMap).length}个英雄需要新增：${Object.keys(unfinishedHeroMap).join(", ")}`);
  }

  // MARK: OWLib
  await emptyDir(OUTPUT_HERO_IMAGE_DIR);
  const owLibHeroesFile = Bun.file(path.join(OWLIB_DIR, "json/heroes.json"));
  if (await owLibHeroesFile.exists()) {
    spinnerProgress.start("根据OWLib更新", heroCount);
    const owLibHeroesRaw = zOWLibHero.array().parse(
      Object.values(await owLibHeroesFile.json()),
    );
    const owLibHeroes = Object.values(owLibHeroesRaw).filter(h => h.IsHero);
    for (const [_, wikiHero] of Object.entries(wikiHeroMap)) {
      const owLibHeroesFiltered = owLibHeroes.filter(h => h.Name === wikiHero.name && h.IsHero);
      if (owLibHeroesFiltered.length > 1) {
        logger.error(`英雄${wikiHero.name}在OWLib中存在多个匹配项：${owLibHeroesFiltered.map(h => h.GUID).join(", ")}`);
        process.exit(1);
      }
      if (owLibHeroesFiltered.length === 0) {
        continue;
      }
      const owLibHero = owLibHeroesFiltered[0]!;
      wikiHero.color = owLibHero.Color.substring(0, 7);
      for (const img of owLibHero.Images) {
        if (!img.TextureGUID) {
          continue;
        }
        const imageName = ImageNameMap[img.Id] || img.Id;
        await ensureDir(path.join(OUTPUT_HERO_IMAGE_DIR, imageName));
        const [filename, typeGuid] = img.TextureGUID.split(".") as [string, string];
        switch (typeGuid) {
          case "004":
            await copy(
              path.join(OWLIB_DIR, "dump/UITextureDump", `${filename}.png`),
              path.join(OUTPUT_HERO_IMAGE_DIR, imageName, `${wikiHero.name}_${imageName}.png`),
            );
            break;
          case "129":
            await copy(
              path.join(OWLIB_DIR, "extract/VectorImages", `${filename}.svg`),
              path.join(OUTPUT_HERO_IMAGE_DIR, imageName, `${wikiHero.name}_${imageName}.svg`),
            );
            break;
          default:
            logger.error(`未知的图片类型${typeGuid}，请手动检查：${img.TextureGUID}`);
            process.exit(1);
        }
      }
      spinnerProgress.increment();
    }
    spinnerProgress.succeed();
  }

  // MARK: Overfast

  const confirmUpdateHitPoints = await confirm({ message: "从 OverFast 获取英雄生命值？" });
  if (confirmUpdateHitPoints) {
    spinnerProgress.start("根据OverFast更新生命值", heroCount);
    const changedHeroesHitPoints: string[] = [];
    for (const [key, wikiHero] of Object.entries(wikiHeroMap)) {
      const hitPointsUpdated = await updateHeroHitPoints(wikiHero);
      if (hitPointsUpdated) {
        changedHeroesHitPoints.push(key);
      }
      spinnerProgress.increment();
    }
    spinnerProgress.succeed();
    if (changedHeroesHitPoints.length) {
      logger.info(`${changedHeroesHitPoints.length}个英雄需要更新生命值，请手动检查：${changedHeroesHitPoints.join(", ")}`);
    }
  }

  // MARK: 保存文件

  spinnerProgress.start("保存文件", heroCount);
  await emptyDir(HERO_DATA_DIR);
  for (const [key, wikiHero] of Object.entries(wikiHeroMap)) {
    await Bun.write(
      path.resolve(HERO_DATA_DIR, `${key}.json`),
      `${JSON.stringify(zWikiHero.parse(wikiHero), null, 2)}\n`,
    );
    spinnerProgress.increment();
  }
  for (const [key, wikiHeroUnfinished] of Object.entries(unfinishedHeroMap)) {
    await Bun.write(
      path.resolve(HERO_DATA_DIR, `${key}.json`),
      `${JSON.stringify(wikiHeroUnfinished, null, 2)}\n`,
    );
    spinnerProgress.increment();
  }
  spinnerProgress.succeed();
}

function updateStory(wikiHero: WikiHero | Partial<WikiHeroUnfinished>, blizzardHero: BlizzardCnHero) {
  const newStory: WikiHero["story"] = {
    intro: blizzardHero.storyIntro,
    chapters: blizzardHero.stories.map((item) => {
      return {
        title: item.title,
        content: item.content
          .replaceAll(/\s*(?:<div class='sep'><\/div>|(?:<br ?\/?>)+)\s*/g, "\n\n"),
      };
    }),
    accessDate: wikiHero?.story?.accessDate,
  };
  if (Bun.deepEquals(newStory, wikiHero.story)) {
    // 无需更新
    return false;
  }

  newStory.accessDate = dayjs().format("YYYY-MM-DD");
  wikiHero.story = newStory;
  return true;
}

function updateBirthday(wikiHero: WikiHero | Partial<WikiHeroUnfinished>, blizzardHero: BlizzardCnHero) {
  let changed = false;

  const rawBirthday = blizzardHero.birthday;
  const birthdayMatch = rawBirthday.match(/(?<m>\d+)月(?<d>\d+)日/);
  if (birthdayMatch) {
    const { m, d } = birthdayMatch.groups!;
    const birthday = `${m?.padStart(2, "0")}-${d?.padStart(2, "0")}`;
    if (birthday !== wikiHero.birthday) {
      wikiHero.birthday = birthday;
      changed = true;
    }
  }

  const ageMatch = rawBirthday.match(/年龄：(?<age>[^（）]+)/);
  if (ageMatch) {
    const { age } = ageMatch.groups!;
    if (age !== wikiHero.age) {
      wikiHero.age = age;
      changed = true;
    }
  }

  return changed;
}

async function updateHeroHitPoints(wikiHeroData: WikiHero) {
  const overfastHero = await fetchOverfastHero(wikiHeroData.key);
  if (!overfastHero) {
    console.warn(`OverFast 数据中不存在 ${wikiHeroData.key}`);
    return;
  }
  const hitPoints: WikiHero["hitPoints"] = {
    health: overfastHero.hitpoints.health,
    armor: overfastHero.hitpoints.armor,
    shields: overfastHero.hitpoints.shields,
  };
  if (Bun.deepEquals(hitPoints, wikiHeroData.hitPoints)) {
    return;
  }
  wikiHeroData.hitPoints = hitPoints;
  return true;
}
