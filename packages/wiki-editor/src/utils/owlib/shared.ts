import z from "zod";

export enum GUIDType {
  Texture = "004",
  Texture2 = "0F1",
  VectorImage = "129",
  String = "07C",
  Category = "01C",

  Hero = "075",
  HeroLoadout = "09E",
  HeroTalent = "134",

  Conversation = "0D0",
  Voiceline = "06F",
  Stimulus = "078",

  Unlock = "0A5",
  UnlockTip = "0D5",
  SkinTheme1 = "0A6",
  SkinTheme2 = "103",
  Achievement = "068",
  Challenge = "157",
  LootBox = "0CF",

  ArcadeMode = "0EE",
  Brawl = "0C7",
  BrawlRuleset = "0C0",
  GameMode = "0C5",
  GameRulesetSchema = "0C6",
  BrawlName = "0D9",

  ProfanityFilter = "07F",
  ReportResponse = "0EB",

  EsportsTeam = "0EC",
}

export function GUIDSchema<T extends GUIDType>(id: T) {
  return z.string()
    .regex(new RegExp(`^[0-9A-Z]{12}\\.${id}$`))
    .brand(`GUID-${id}`);
}
