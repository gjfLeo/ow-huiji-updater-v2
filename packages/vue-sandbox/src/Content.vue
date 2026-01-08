<template>
  <h1>You did it!</h1>
  <p>
    Visit <a href="https://vuejs.org/" target="_blank" rel="noopener">vuejs.org</a> to read the
    documentation
  </p>

  <NForm inline :show-feedback="false">
    <NFormItem label="名称">
      <NInput v-model:value="name" placeholder="请输入" />
    </NFormItem>
    <NFormItem>
      <NButton type="primary" @click="handleConfirm">确认</NButton>
    </NFormItem>
  </NForm>
</template>

<script setup lang="ts">
import { NButton, NForm, NFormItem, NInput, useMessage } from "naive-ui";
import { ref } from "vue";

const name = ref("");

const message = useMessage();
function handleConfirm() {
  message.success(`你好，${name.value.trim() || "特工"}！`);
}
</script>

<style scoped>
a {
  color: greenyellow;
}
</style>
