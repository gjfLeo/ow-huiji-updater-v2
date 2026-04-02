import path from "node:path";
import { OUTPUT_DIR } from "../constants/paths";
import { abilityKeywords } from "../data/ability-keywords";
import { readAbilityData, readHeroData, readStrings } from "../utils/data";

const terms = [
  ["Ultimate Ability", "终极技能"],
  ["Ultimate Cost", "终极技能消耗"],
  ["Ultimate charge", "终极技能充能"],
  ["Perk", "威能"],
  ["reload", "装填"],
  ["role", "职责"],
  ["sub-role", "副职责"],
  ["reveal", "侦测"],
  ["revealed", "暴露"],
];

const loreTerms = [
  ["Talon", "黑爪"],
  ["Vishkar", "费斯卡"],
];

export default async function stub_generateTranslatorTerms() {
  const { heroData } = await readHeroData();
  const { abilityData } = await readAbilityData();
  const { zhStrings, enStrings } = await readStrings();

  const stringMapZhToEn: Record<string, string> = {};
  for (const stringKey of Object.keys(zhStrings)) {
    if (stringKey in enStrings) {
      stringMapZhToEn[zhStrings[stringKey]!] = enStrings[stringKey]!;
    }
  }

  let output = "以下是一些翻译术语，稍后根据术语进行翻译：\n";

  output += terms.map(item => `${item[0]}: ${item[1]}`).join("；");
  output += "\n";

  output += "剧情相关：\n";
  output += loreTerms.map(item => `${item[0]}: ${item[1]}`).join("；");
  output += "\n";

  output += "技能效果：\n";
  output += abilityKeywords.map(keyword => `${keyword.name_en} ${keyword.name}`).join("；");
  output += "\n";

  output += "职责：\n";
  output += Object.values(abilityData)
    .filter(ability => !ability.hero)
    .map(ability => ability.name)
    .join("、");
  output += "\n";

  output += "英雄和技能：\n";
  for (const hero of Object.values(heroData)) {
    output += `${hero.name} ${hero.nameEn}：`;
    output += Object.values(abilityData)
      .filter(ability => ability.hero === hero.name)
      .map(ability => `${ability.name} ${stringMapZhToEn[ability.name] || ""}`)
      .join("、");
    output += "\n";
  }

  await Bun.file(path.join(OUTPUT_DIR, "translator-terms.txt")).write(output);
}
