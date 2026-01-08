<template>
  <img
    :key="ability" alt="" :src="imageUrl"
    style="width: 1.2em; height: 1.2em; object-fit: contain; margin-right: 0.2em;"
  />
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  hero?: string;
  ability: string;
}>();

const domain = import.meta.env.DEV ? "https://overwatch.huijiwiki.com" : "";

const imageUrl = computed(() => {
  const filename = props.hero ? `${props.hero}_${props.ability}_图标.png` : `${props.ability}_图标.png`;
  return `${domain}/wiki/Special:Redirect/file/${filename}`;
});
</script>
