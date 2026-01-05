import z from "zod";
import { zRole } from "./hero";

export const zAbilityCategory = z.enum([
  "PassiveAbility",
  "Weapon",
  "Ability",
  "UltimateAbility",
  "Perk",
  "xEB644997",
]);

export const zAbilityButton = z.enum([
  "主要攻击模式",
  "辅助攻击模式",
  "技能 1",
  "技能 2",
  "技能 3",
  "跳跃",
  "下蹲",
  "快速近身攻击",
  "装填弹药",
  "互动",
  "装备武器 1",
  "下一武器",
  "蹲姿切换",
]);

export const zWikiAbilityData = z.object({
  _hjschema: z.literal("Ability"),
  _dataType: z.literal("ability"),
  key: z.string(),
  name: z.string(),
  hero: z.string().optional(),
  role: zRole.optional(),
  category: zAbilityCategory,
  button: zAbilityButton.nullable(),
  description: z.string(),
  aliases: z.array(z.string()).optional(),
  removed: z.literal(true).optional(),
  basicStats: z.object({
    ammo: z.number(),
    reloadTime: z.number(),
    isSecondWeapon: z.boolean(),
    cooldown: z.number(),
    charges: z.number(),
    ultimateCharge: z.number(),
    perkIndex: z.string(),
  }).partial(),
  keywords: z.array(z.object({ name: z.string(), value: z.string() })),
  detailStats: z.array(z.object({ name: z.string(), value: z.string() })),
}).strict();
export type WikiAbilityData = z.infer<typeof zWikiAbilityData>;
