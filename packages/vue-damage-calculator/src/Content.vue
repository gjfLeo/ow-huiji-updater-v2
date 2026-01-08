<template>
  <div style="font-size: 0.875rem;">
    <NForm
      label-placement="left"
      label-width="6rem"
      :show-feedback="false"
      style=""
    >
      <NFormItem label="基础伤害量">
        <NInputNumber v-model:value="baseDamage" :show-button="false" style="width: 6rem" />

        <NCheckbox
          v-model:checked="criticalHit"
          style="margin-left: 2rem;"
          @update:checked="criticalHitMultiplier = 2"
        >
          武器暴击
        </NCheckbox>
        <NSelect
          v-if="criticalHit"
          v-model:value="criticalHitMultiplier"
          size="small"
          :options="criticalHitMultiplierOptions"
          style="width: 6rem; margin-left: 0rem;"
        />
      </NFormItem>
      <NFormItem label="增伤效果">
        <NCheckboxGroup
          v-model:value="damageDealtAmplifications"
          style="display: flex; flex-wrap: wrap; gap: 0.5rem;"
        >
          <NCheckbox
            v-for="item in damageDealtAmplificationOptions"
            :key="item.ability"
            :value="item.ability"
          >
            <div style="display: flex; align-items: center;">
              <AbilityIcon :ability="item.ability" :hero="item.hero" />
              {{ item.displayName ?? item.ability }} +{{ item.value }}%
            </div>
          </NCheckbox>
        </NCheckboxGroup>
      </NFormItem>
      <NFormItem label="输出伤害">
        {{ damageOutput }}
      </NFormItem>
    </NForm>
    <NHr />
    <NForm
      label-placement="left"
      label-width="6rem"
      :show-feedback="false"
    >
      <NFormItem label="减伤效果">
        <NCheckboxGroup v-model:value="damageTakenReductions_General">
          <NCheckbox
            v-for="item in damageTakenReductionOptionsGeneral"
            :key="item.ability"
            :value="item.ability"
          >
            <div style="display: flex; align-items: center;">
              <AbilityIcon :ability="item.ability" :hero="item.hero" />
              {{ item.ability }} -{{ item.value }}%
            </div>
          </NCheckbox>
        </NCheckboxGroup>
        <NCheckbox
          v-model:checked="damageTakenReduction_PersonalEnable"
          @update:checked="damageTakenReduction_PersonalAbility ??= '强固防御'"
        >
          自身减伤
        </NCheckbox>
        <div v-if="damageTakenReduction_PersonalEnable">
          <NSelect
            v-model:value="damageTakenReduction_PersonalAbility"
            :options="damageTakenReductionOptionsPersonal"
            value-field="ability"
            label-field="ability"
            :render-label="renderAbilityLabel"
            size="small"
            style="width: 8rem; margin-right: 1rem;"
          />
        </div>
        <div
          v-if="damageTakenReduction_PersonalAbility === '自定义'"
          style="display: flex; align-items: center; gap: 0.125rem; margin-right: 1rem;"
        >
          <span>-</span>
          <NInputNumber
            v-model:value="damageTakenReduction_PersonalCustomValue"
            :disabled="!damageTakenReduction_PersonalEnable"
            placeholder=""
            size="small"
            :show-button="false"
            style="width: 4rem; margin-left: 0.5rem;"
          />
          <span>%</span>
        </div>
        <NCheckbox v-model:checked="damageTakenReduction_Tank" :class="{ noEffect: !criticalHit }">
          <div style="display: flex; align-items: center;">
            <AbilityIcon ability="职责：重装" />
            职责：重装{{ criticalHit ? " -25%" : "" }}
          </div>
        </NCheckbox>
      </NFormItem>
      <NFormItem label="易伤效果">
        <NCheckboxGroup v-model:value="damageTakenAmplifications">
          <NCheckbox
            v-for="item in damageTakenAmplificationOptions"
            :key="item.ability"
            :value="item.ability"
          >
            <div style="display: flex; align-items: center;">
              <AbilityIcon :ability="item.ability" :hero="item.hero" />
              {{ item.ability }} +{{ item.value }}%
            </div>
          </NCheckbox>
        </NCheckboxGroup>
      </NFormItem>
      <NFormItem label="合计">
        <span>{{ totalDamageModification > 0 ? "+" : "-" }}{{ Math.abs(totalDamageModification) }}%</span>
        <span style="margin-left: 2rem;">{{ totalDamageModification > 0 ? "易伤" : "减伤" }}后伤害</span>
        <span style="margin-left: 1rem;">{{ damageAfterReduction }}</span>
      </NFormItem>
    </NForm>
    <NHr />
    <NForm
      label-placement="left"
      label-width="6rem"
      :show-feedback="false"
    >
      <NFormItem label="护甲">
        <NCheckbox v-model:checked="hasArmor" />
      </NFormItem>
      <NFormItem label="攻击属性" :class="{ noEffect: !hasArmor }">
        <NCheckbox v-model:checked="armorPiercing">护甲穿透</NCheckbox>
        <NCheckbox v-model:checked="isBeam">光束</NCheckbox>
      </NFormItem>
      <NFormItem label="护甲减免" :class="{ noEffect: !hasArmor || armorPiercing }">
        {{ armorReduction }}
        <span style="margin-left: 2rem;">护甲减免后伤害</span>
        <span style="margin-left: 1rem;">{{ damageAfterArmorReduction }}</span>
      </NFormItem>
    </NForm>
    <NHr />
    <NForm
      label-placement="left"
      label-width="6rem"
      :show-feedback="false"
    >
      <NFormItem label="减伤上限">
        <span :class="{ noEffect: finalDamage === damageAfterArmorReduction }">-{{ finalDamageReductionCap }}%</span>
        <span style="margin-left: 2rem;">最终伤害</span>
        <span style="margin-left: 1rem;">{{ finalDamage }}</span>
      </NFormItem>
    </NForm>
  </div>
</template>

<script setup lang="ts">
import { NCheckbox, NCheckboxGroup, NForm, NFormItem, NHr, NInputNumber, NSelect } from "naive-ui";
import { computed, h, ref } from "vue";
import AbilityIcon from "./components/AbilityIcon.vue";
import { formatNumber } from "./utils";

const criticalHitMultiplierOptions = [
  { label: "×1.5", value: 1.5 },
  { label: "×2", value: 2 },
  { label: "×2.5", value: 2.5 },
];
const damageDealtAmplificationOptions = [
  { hero: "天使", ability: "天使之杖辅助模式", displayName: "天使之杖", value: 30 },
  { hero: "安娜", ability: "纳米激素", value: 50 },
  { hero: "巴蒂斯特", ability: "增幅矩阵", value: 100 },
  { hero: "朱诺", ability: "轨道射线", value: 30 },
];
const damageTakenReductionOptionsGeneral = [
  { hero: "安娜", ability: "纳米激素", value: 50 },
];
const damageTakenReductionOptionsPersonal = [
  { hero: "路霸", ability: "呼吸器", value: 40 },
  { hero: "末日铁拳", ability: "悍猛格挡", value: 75 },
  { hero: "奥丽莎", ability: "强固防御", value: 45 },
  { hero: "拉玛刹", ability: "铁臂（天罚形态）", displayName: "铁臂", value: 75 },
  { hero: "毛加", ability: "蛮力冲撞", value: 50 },
  { hero: "毛加", ability: "心脏过载", value: 40 },
  { hero: "骇灾", ability: "尖刺护体", value: 60 },
  { hero: "堡垒", ability: "抗击装甲", value: 20 },
  { hero: "卡西迪", ability: "战术翻滚", value: 50 },
  { ability: "自定义", value: 0 },
];
const damageTakenAmplificationOptions = [
  { hero: "禅雅塔", ability: "乱", value: 25 },
];

const baseDamage = ref(70);
const criticalHit = ref(false);
const criticalHitMultiplier = ref(2);
const damageDealtAmplifications = ref<string[]>([]);
const damageOutput = computed(() => {
  const amplifications = damageDealtAmplifications.value
    .map(ability => damageDealtAmplificationOptions
      .find(item => item.ability === ability)!)
    .map(item => item.value);
  const totalAmplification = amplifications.reduce((acc, item) => acc + item, 0);
  return formatNumber(baseDamage.value
    * (criticalHit.value ? criticalHitMultiplier.value : 1)
    * (1 + totalAmplification / 100));
});

const damageTakenReductions_General = ref<string[]>([]);
const damageTakenReduction_Tank = ref(false);
const damageTakenReduction_PersonalEnable = ref(false);
const damageTakenReduction_PersonalAbility = ref<string>();
const damageTakenReduction_PersonalCustomValue = ref(0);
const damageTakenAmplifications = ref<string[]>([]);
const damageTakenReductionsValue = computed(() => {
  const reductions = damageTakenReductions_General.value
    .map(ability => damageTakenReductionOptionsGeneral
      .find(item => item.ability === ability)!)
    .map(item => item.value);
  if (damageTakenReduction_Tank.value && criticalHit.value) {
    reductions.push(25);
  }
  if (damageTakenReduction_PersonalEnable.value) {
    if (damageTakenReduction_PersonalAbility.value === "自定义") {
      reductions.push(damageTakenReduction_PersonalCustomValue.value);
    }
    else {
      reductions.push(
        damageTakenReductionOptionsPersonal
          .find(item => item.ability === damageTakenReduction_PersonalAbility.value)!
          .value,
      );
    }
  }
  return reductions.sort((a, b) => b - a);
});
const totalDamageModification = computed(() => {
  const totalReduction = damageTakenReductionsValue.value.some(item => item > 50)
    ? damageTakenReductionsValue.value[0]!
    : Math.min(50, damageTakenReductionsValue.value.reduce((acc, item) => acc + item, 0));
  const amplifications = damageTakenAmplifications.value
    .map(ability => damageTakenAmplificationOptions
      .find(item => item.ability === ability)!)
    .map(item => item.value);
  const totalAmplification = amplifications.reduce((acc, item) => acc + item, 0);
  return totalAmplification - totalReduction;
});
const damageAfterReduction = computed(() => {
  return formatNumber(damageOutput.value * (1 + totalDamageModification.value / 100));
});

const hasArmor = ref(false);
const armorPiercing = ref(false);
const isBeam = ref(false);
const armorReduction = computed(() => {
  if (!hasArmor.value || armorPiercing.value) {
    return 0;
  }
  if (isBeam.value) {
    return damageOutput.value * 0.3;
  }
  return Math.min(damageOutput.value * 0.5, 7);
});
const damageAfterArmorReduction = computed(() => {
  return damageAfterReduction.value - armorReduction.value;
});

const finalDamageReductionCap = computed(() => {
  return Math.max(50, damageTakenReductionsValue.value[0] ?? 0);
});
const finalDamage = computed(() => {
  return Math.max(damageAfterArmorReduction.value, baseDamage.value * (1 - finalDamageReductionCap.value / 100));
});

function renderAbilityLabel(item: {
  hero?: string;
  ability: string;
  displayName?: string;
}) {
  if (item.ability === "自定义") {
    return [
      h("span", {}, item.ability),
    ];
  }
  return [
    h(AbilityIcon, {
      hero: item.hero,
      ability: item.ability,
      style: "margin-right: 0.25rem;",
    }),
    item.displayName ?? item.ability,
  ];
}

defineExpose({
  baseDamage,
  criticalHit,
  criticalHitMultiplier,
  damageDealtAmplifications,
  damageOutput,

  damageTakenReductions_general: damageTakenReductions_General,
  damageTakenReduction_Tank,
  damageTakenReduction_PersonalEnable,
  damageTakenReduction_PersonalAbility,
  damageTakenReduction_PersonalCustomValue,
  damageTakenAmplifications,
  damageTakenReductionsValue,
  totalDamageModification,
  damageAfterReduction,
  armorReduction,
  damageAfterArmorReduction,

  hasArmor,
  armorPiercing,
  isBeam,

  finalDamageReductionCap,
  finalDamage,
});
</script>

<style scoped>
.form-row {
  display: flex;
  align-items: center;
  gap: 2rem;
}
.noEffect {
  opacity: 0.5;
}
</style>
