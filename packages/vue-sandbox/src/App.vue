<template>
  <NConfigProvider
    :theme="darkTheme"
    :theme-overrides="themeOverrides"
    :locale="zhCN"
    :inline-theme-disabled="true"
  >
    <NMessageProvider>
      <Content />
    </NMessageProvider>
  </NConfigProvider>
</template>

<script setup lang="ts">
import { darkTheme, NConfigProvider, NMessageProvider, zhCN } from "naive-ui";
import themeOverrides from "../shared/theme-overrides";

import Content from "./Content.vue";
</script>

<style scoped>
</style>
