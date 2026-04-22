import path from "node:path";
import { readAbilityData, readHeroData, readStrings } from "../utils/data";

export default async function stub_updateTranslationTerms() {
  const { heroData } = await readHeroData();
  const { abilityData } = await readAbilityData();
  const { zhStrings, enStrings } = await readStrings();

  const stringMapZhToEn: Record<string, string> = {};
  for (const stringKey of Object.keys(zhStrings)) {
    if (stringKey in enStrings) {
      stringMapZhToEn[zhStrings[stringKey]!] = enStrings[stringKey]!;
    }
  }

  const file = Bun.file(path.join(__dirname, "../../assets/data/terms.csv"));

  const lines = (await file.text()).split("\r\n");

  const heroLinesStart = lines.findIndex(line => line === "# 角色（英雄）");
  const heroLinesEnd = lines.findIndex(line => line === "# 角色（英雄） END");
  lines.splice(
    heroLinesStart + 1,
    heroLinesEnd - heroLinesStart - 1,
    ...Object.values(heroData)
      .toSorted((a, b) => a.nameEn.localeCompare(b.nameEn))
      .map(hero => `${hero.nameEn},${hero.name},${hero.role}英雄`),
  );

  const abilityCategoryOrder = [
    "PassiveAbility",
    "Weapon",
    "Ability",
    "UltimateAbility",
    "Perk",
  ];
  const abilityNames = {
    PassiveAbility: "被动技能",
    Weapon: "武器",
    Ability: "技能",
    UltimateAbility: "终极技能",
    Perk: "威能",
  };

  // const abilityLinesStart = lines.findIndex(line => line === "# 游戏术语（英雄技能）");
  // const abilityLinesEnd = lines.findIndex(line => line === "# 游戏术语（英雄技能） END");
  // lines.splice(
  //   abilityLinesStart + 1,
  //   abilityLinesEnd - abilityLinesStart - 1,
  //   ...Object.values(heroData)
  //     .toSorted((a, b) => a.nameEn.localeCompare(b.nameEn))
  //     .flatMap((hero) => {
  //       return Object.values(abilityData)
  //         .filter(ability => ability.hero === hero.name)
  //         .toSorted((a, b) => abilityCategoryOrder.indexOf(a.category) - abilityCategoryOrder.indexOf(b.category))
  //         .map(ability => `${stringMapZhToEn[ability.name] || ""},${ability.name},${ability.hero}的${abilityNames[ability.category as keyof typeof abilityNames]!}`);
  //     }),
  // );

  await file.write(lines.join("\r\n"));
}
