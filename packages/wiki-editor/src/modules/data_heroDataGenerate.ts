import type { BlizzardCnHero } from "../api/blizzard-cn";
import type { WikiHero } from "../models/hero";
import path from "node:path";
import dayjs from "dayjs";
import destr from "destr";
import { emptyDir } from "fs-extra";
import { fetchBlizzardHero } from "../api/blizzard-cn";
import { fetchOverfastHero } from "../api/overfast";
import { zWikiHero } from "../models/hero";
import { zOWLibHero } from "../models/owlib/heroes";
import { logger, spinnerProgress } from "../utils/logger";
import { wikiBatchGet } from "../wiki/batch";

const heroDataDir = path.resolve(__dirname, "../../assets/data/heroes");

export default async function heroDataUpdate() {
  const heroDataPages = await wikiBatchGet({
    namespace: 3500,
    prefix: "Hero/",
  });
  const heroCount = Object.values(heroDataPages).length;

  const wikiHeroDataList = zWikiHero.array().parse(
    Object.values(heroDataPages).map(content => destr(content)),
  );

  // MARK: Blizzard CN

  spinnerProgress.start("根据国服数据更新", heroCount);
  const changedHeroes: string[] = [];
  for (const heroData of wikiHeroDataList) {
    const heroKey = heroData.key;
    const blizzardHero = await fetchBlizzardHero(heroKey);
    if (!blizzardHero) {
      spinnerProgress.fail();
      logger.error(`未找到 ${heroKey} 的Blizzard数据`);
      process.exit(1);
    }
    let changed = false;
    changed ||= updateStory(heroData, blizzardHero);
    changed ||= updateBirthday(heroData, blizzardHero);
    if (changed) {
      changedHeroes.push(heroKey);
    }
    spinnerProgress.increment();
  }
  spinnerProgress.succeed();
  if (changedHeroes.length) {
    logger.info(`${changedHeroes.length}个英雄需要更新：${changedHeroes.join(", ")}`);
  }

  // MARK: OWLib

  const owLibHeroesFile = Bun.file(path.resolve(__dirname, "../../output/owlib/json/heroes.json"));
  if (await owLibHeroesFile.exists()) {
    spinnerProgress.start("根据OWLib更新", heroCount);
    const owLibHeroesRaw = zOWLibHero.array().parse(
      Object.values(await owLibHeroesFile.json()),
    );
    const owLibHeroes = Object.values(owLibHeroesRaw).filter(h => h.IsHero);
    for (const heroData of wikiHeroDataList) {
      const heroKey = heroData.key;
      const owLibHeroesFiltered = owLibHeroes.filter(h => h.Name === heroData.name);
      if (owLibHeroesFiltered.length !== 1) {
        spinnerProgress.fail();
        logger.error(`未找到 ${heroKey} 的OWLib数据`);
        process.exit(1);
      }
      const owLibHero = owLibHeroesFiltered[0]!;
      heroData.color = owLibHero.Color.substring(0, 7);
      spinnerProgress.increment();
    }
    spinnerProgress.succeed();
  }

  // MARK: Overfast

  spinnerProgress.start("根据OverFast更新生命值", heroCount);
  const changedHeroesHitPoints: string[] = [];
  for (const heroData of wikiHeroDataList) {
    const heroKey = heroData.key;
    const hitPointsUpdated = await updateHeroHitPoints(heroData);
    if (hitPointsUpdated) {
      changedHeroesHitPoints.push(heroKey);
    }
    spinnerProgress.increment();
  }
  spinnerProgress.succeed();
  if (changedHeroesHitPoints.length) {
    logger.info(`${changedHeroesHitPoints.length}个英雄需要更新生命值，请手动检查：${changedHeroesHitPoints.join(", ")}`);
  }

  // MARK: 保存文件

  spinnerProgress.start("保存文件", heroCount);
  await emptyDir(heroDataDir);
  for (const heroData of wikiHeroDataList) {
    const heroKey = heroData.key;
    await Bun.write(
      path.resolve(heroDataDir, `${heroKey}.json`),
      JSON.stringify(zWikiHero.parse(heroData), null, 2),
    );
    spinnerProgress.increment();
  }
  spinnerProgress.succeed();
}

function updateStory(wikiHeroData: WikiHero, cnHeroData: BlizzardCnHero) {
  const newStory: WikiHero["story"] = {
    intro: cnHeroData.storyIntro,
    chapters: cnHeroData.stories.map((item) => {
      return {
        title: item.title,
        content: item.content
          .replaceAll(/<div class='sep'><\/div>|(?:<br ?\/?>)+/g, "\n\n"),
      };
    }),
    accessDate: wikiHeroData?.story?.accessDate,
  };
  if (Bun.deepEquals(newStory, wikiHeroData.story)) {
    // 无需更新
    return false;
  }

  newStory.accessDate = dayjs().format("YYYY-MM-DD");
  wikiHeroData.story = newStory;
  return true;
}

function updateBirthday(wikiHeroData: WikiHero, cnHeroData: BlizzardCnHero) {
  let changed = false;

  const rawBirthday = cnHeroData.birthday;
  const birthdayMatch = rawBirthday.match(/(?<m>\d+)月(?<d>\d+)日/);
  if (birthdayMatch) {
    const { m, d } = birthdayMatch.groups!;
    const birthday = `${m?.padStart(2, "0")}-${d?.padStart(2, "0")}`;
    if (birthday !== wikiHeroData.birthday) {
      wikiHeroData.birthday = birthday;
      changed = true;
    }
  }

  const ageMatch = rawBirthday.match(/年龄：(?<age>[^（）]+)/);
  if (ageMatch) {
    const { age } = ageMatch.groups!;
    if (age !== wikiHeroData.age) {
      wikiHeroData.age = age;
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
