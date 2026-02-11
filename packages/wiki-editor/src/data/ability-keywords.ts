import z from "zod";

export const zAbilityKeyword = z.object({
  name: z.string(),
  name_en: z.string().optional(),
  description: z.string(),
  variations: z.string().array().optional(),
});
type AbilityKeyword = z.infer<typeof zAbilityKeyword>;

export const abilityKeywords: AbilityKeyword[] = [
  // MARK: 技能形式
  {
    name: "即时命中",
    description: "射弹攻击和治疗没有飞行时间，立即命中目标",
    variations: [
      "<mark>此可部署物</mark>的射弹攻击和治疗没有飞行时间，立即命中目标",
    ],
  },
  {
    name: "延时飞行",
    description: "射弹攻击和治疗具有飞行时间。可被拦截",
    variations: [
      "<mark>此可部署物</mark>的射弹攻击和治疗具有飞行时间。可被拦截",
    ],
  },
  {
    name: "强射弹",
    description: "一种无法被拦截的射弹",
  },
  {
    name: "光束",
    description: "无视拦截射弹技能且无法造成暴击伤害。对护甲造成的伤害降低30%",
    variations: [
      "无视拦截射弹技能且无法暴击",
      "<mark>此延时飞行射弹发射的光束</mark>无视拦截射弹技能且无法造成暴击伤害。对护甲造成的伤害降低30%",
    ],
  },
  {
    name: "冲击波",
    description: "沿地面行进，可随地形升降。可被屏障阻挡",
  },
  {
    name: "范围效果",
    description: "影响范围内的目标",
    variations: [
      "影响<mark>球形</mark>范围内的目标",
      "影响<mark>圆柱</mark>范围内的目标",
    ],
  },
  {
    name: "附着",
    description: "能附着在敌方英雄和屏障上的延时弹道攻击。可被相移移除",
  },
  {
    name: "近身攻击",
    description: "一种能命中多名敌人的近距离物理攻击。可贯穿屏障和拦截射弹技能。会被无视近身攻击技能阻挡",
  },
  {
    name: "广义近身攻击",
    description: "具有飞行时间的近身攻击，可被屏障和无视近身攻击技能阻挡",
  },
  {
    name: "可部署",
    description: "一种具有独立生命池的非玩家实体",
    variations: [
      "此可部署物<mark>不会受到伤害</mark>",
      "一种具有独立生命池的非玩家实体，<mark>由强射弹部署</mark>",
    ],
  },
  {
    name: "屏障",
    description: "一种具有生命值的实体构造，能吸收大部分远程攻击和技能但不会阻挡英雄位移。可被近身攻击贯穿",
  },
  {
    name: "泡泡盾",
    description: "一种在破裂前能吸收所有伤害并阻挡大部分控制效果的屏障",
  },

  // MARK: 攻击属性
  {
    name: "暴击",
    description: "命中暴击部位时造成2倍伤害",
    variations: [
      "命中暴击部位时<mark>沿用被反弹攻击的暴击伤害倍率</mark>",
      "<mark>在射弹失效前</mark>，命中暴击部位时造成2倍伤害",
    ],
  },
  {
    name: "弱效暴击",
    description: "命中暴击部位时造成<mark>1.5倍</mark>伤害。无视斗士的暴击受伤减免",
  },
  {
    name: "强效暴击",
    description: "命中暴击部位时造成<mark>2.5倍</mark>伤害",
  },
  {
    name: "技能暴击",
    description: "可在特定范围内或特定条件下造成额外伤害。无视暴击免疫",
  },
  {
    name: "护甲贯穿",
    description: "对护甲造成伤害时将其视同生命值",
    variations: [
      "此攻击<mark>施加的效果</mark>对护甲造成伤害时将其视同生命值",
      "<mark>此可部署物的效果</mark>对护甲造成伤害时将其视同生命值",
    ],
  },
  {
    name: "贯穿",
    description: "可贯穿英雄的远程攻击和治疗",
  },
  {
    name: "屏障贯穿",
    description: "可贯穿屏障和英雄",
    variations: [
      "<mark>此可部署物</mark>可贯穿屏障和英雄",
      "贯穿屏障",
    ],
  },
  {
    name: "自我伤害",
    description: "此爆炸可对攻击者自身造成伤害",
  },
  {
    name: "固定数值",
    description: "此技能的伤害不受增伤影响",
    variations: [
      "<mark>给此可部署物的拥有者施加</mark>增伤时，此可部署物的伤害不受影响",
      "此技能的<mark>百分比</mark>伤害不受增伤影响",
    ],
  },
  {
    name: "无视屏障",
    description: "此技能的所有效果均不会与屏障或英雄碰撞",
    variations: [
      "<mark>此可部署物部署期间</mark>不会与屏障<mark>或英雄</mark>碰撞",
      "<mark>对盟友施放此技能时</mark>不会被屏障或英雄阻挡",
      "此技能的<mark>拦截射弹效果</mark>不会被屏障阻挡",
      "此技能的<mark>拴锁效果</mark>不会被屏障阻挡",
    ],
  },
  {
    name: "屏障碰撞",
    description: "会与屏障碰撞，但此攻击施加的伤害和效果可贯穿屏障和英雄",
  },
  {
    name: "摧毁屏障",
    description: "推毁屏障和泡泡盾。可贯穿英雄",
  },
  {
    name: "可净化",
    description: "施加能被净化移除的负面状态效果",
    variations: [
      "<mark>此可部署物</mark>会施加能被净化移除的负面状态效果",
    ],
  },
  {
    name: "燃烧",
    description: "施加一种可净化的负面状态效果，无视护甲并造成持续伤害",
  },

  // MARK: 消耗
  {
    name: "能量",
    description: "使用专属资源。不受冷却时间缩减影响",
  },
  {
    name: "热量",
    description: "热量计量条充满时无法使用，停止射击后自动冷却",
  },
  {
    name: "灵气",
    description: "一种能量式技能，造成伤害或治疗时能获得资源",
  },

  // MARK: 技能状态
  {
    name: "引导",
    description: "一种持续行动，被挪移、侵入、沉睡或击晕效果打断时会提前结束",
  },
  {
    name: "变身",
    description: "一种具有独特功能的变化状态，受到挪移、侵入、沉睡或击晕时不会提前结束",
  },
  {
    name: "位移",
    description: "受限制时会被沉默。为英雄提供强化位移，被挪移、侵入、限制、沉睡和击晕打断时会提前结束",
    variations: [
      "<mark>此可部署物</mark>具有被<mark>挪移、限制、击晕</mark>效果打断时会提前结束的强化位移",
      "<mark>此可部署物</mark>具有被挪移、侵入、限制、沉睡和击晕打断时会提前结束的强化位移",
    ],
  },
  {
    name: "强位移",
    description: "受限制时会被沉默",
    variations: [
      "<mark>使用加速音效时</mark>，受限制会被沉默",
      "受限制时<mark>自身击退</mark>会被沉默",
    ],
  },
  {
    name: "闪避",
    description: "可穿过敌方英雄且不会阻挡位移",
    variations: [
      "可穿过<mark>非不可阻挡状态的</mark>敌方英雄且不会阻挡位移", // 游戏中：<mark>可穿过</mark>非不可阻挡状态的<mark>敌方英雄</mark>且不会阻挡位移
      "<mark>受此技能影响的目标</mark>可穿过敌方英雄且不会阻挡位移",
    ],
  },
  {
    name: "飞行",
    description: "获得自由移动能力，被挪移、侵入、限制、沉睡和击晕时会临时禁用自由移动",
  },

  // MARK: 防御效果
  {
    name: "无敌",
    description: "不会受到伤害。可使目标机制进入争夺状态但无法占领",
    variations: [
      "不会受到伤害。<mark>无法争夺或占领目标机制</mark>",
      "<mark>受此技能影响的目标</mark>不会受到伤害，可使目标机制进入争夺状态但无法占领",
    ],
  },
  {
    name: "相移",
    description: "一种能让所有攻击穿过英雄的闪避技能。可移除附着技能",
  },
  {
    name: "拦截射弹",
    description: "拦截大部分射弹攻击与范围治疗。可被近身攻击、光束、冲击波贯穿",
    variations: [
      "<mark>反弹</mark>大部分射弹攻击和范围治疗。可被光束和冲击波贯穿",
    ],
  },
  {
    name: "不可阻挡",
    description: "无视挪移、侵入、限制、击退、沉睡、击晕、拴锁",
  },
  {
    name: "暴击免疫",
    description: "无视命中暴击部位的攻击造成的额外伤害。对技能暴击无效",
  },
  {
    name: "无视近身攻击",
    description: "无视近身攻击和广义近身攻击",
    variations: [
      "无视近身攻击<mark>但无法无视</mark>广义近身攻击",
    ],
  },
  {
    name: "护甲",
    description: "此类生命值会使大于等于14点的伤害降低7点，使小于14点的伤害降低50%，使光束伤害降低30%",
  },
  {
    name: "护盾",
    description: "此类生命值会在3秒未受伤害后以30点/秒的速度恢复",
  },
  {
    name: "过量生命值",
    description: "此技能会提供不可治疗的额外生命值，且敌人对此类额外生命值造成伤害时获得的终极技能充能降低50%",
  },

  // MARK: 控制效果
  {
    name: "击晕",
    description: "使英雄无法行动，可打断引导技能，会被强效净化移除",
    variations: [
      "<mark>此可部署物</mark>会使英雄无法行动，可打断引导技能，会被强效净化移除",
    ],
  },
  {
    name: "击倒",
    description: "一种无法被净化的击晕。被击倒的目标不会阻挡位移",
  },
  {
    name: "沉睡",
    description: "一种受到伤害时会被打断的击倒效果，可被净化",
  },
  {
    name: "侵入",
    description: "各项技能均被沉默。可看出敌方终极技能是否就绪",
  },
  {
    name: "限制",
    description: "沉默位移技能",
  },
  {
    name: "定身",
    description: "移除英雄对自身移动的控制能力",
    variations: [
      "<mark>此可部署物的冲锋攻击</mark>会移除英雄对自身移动的控制能力",
    ],
  },
  {
    name: "拴锁",
    description: "将英雄拴锁特定位置或范围，直至拴锁结束",
  },
  {
    name: "挪移",
    description: "使英雄无法行动并使其强制移动，可打断引导技能，无法被净化",
  },
  {
    name: "碰撞",
    description: "具有此属性的两个技能撞在一起时，双方英雄均被击倒",
    variations: [
      "具有此属性的<mark>不可阻挡</mark>技能撞在一起时，双方英雄均被击倒",
      "具有此属性的两个技能撞在一起时，英雄<mark>和可部署物</mark>均被击倒",
    ],
  },

  // MARK: 特殊效果
  {
    name: "弱效净化",
    description: "移除可净化的状态效果。对击晕、击倒、挪移无效",
    variations: [
      "移除可净化的状态效果。对击晕、击倒、挪移、侵入<mark>无效</mark>",
    ],
  },
  {
    name: "强效净化",
    description: "移除可净化的状态效果和击晕。对击倒和挪移无效",
    variations: [
      "移除可净化的状态效果<mark>以及击晕、击倒、挪移</mark>",
    ],
  },
  {
    name: "装填",
    description: "完全装填英雄的武器",
  },
  {
    name: "断锁",
    description: "移除拴锁效果",
  },
  {
    name: "显示生命值",
    description: "不对敌方英雄造成伤害即可显示其生命值",
  },
  {
    name: "无形",
    description: "在隐身状态下无法争夺或占领目标机制",
  },
  {
    name: "跳跃取消",
    description: "此技能可通过跳跃提前结束并获得移动速度加成",
  },
  {
    name: "斩破",
    description: "无视受伤减免，造成伤害前先摧毁过量生命值，如果摧毁了泡泡盾，则对受泡泡盾保护的英雄造成全额伤害",
  },
  {
    name: "增伤",
    description: "提高伤害",
  },
];
