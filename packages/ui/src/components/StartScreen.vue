<script setup lang="ts">
import { computed, ref } from 'vue';

const props = defineProps<{
  seed: number;
  name: string;
  gender: 'm' | 'f';
}>();

const emit = defineEmits<{
  (e: 'update:seed', v: number): void;
  (e: 'update:name', v: string): void;
  (e: 'update:gender', v: 'm' | 'f'): void;
  (e: 'start'): void;
}>();

const seedText = ref(String(props.seed));
const seedNum = computed(() => {
  const n = Number(seedText.value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 42;
});

function onStart() {
  emit('update:seed', seedNum.value);
  emit('update:name', props.name);
  emit('update:gender', props.gender);
  emit('start');
}
</script>

<template>
  <div class="panel start">
    <h1>重生之我是理财经理</h1>
    <p class="sub">M0 核心原型 · 2006–2025 二十年职业生涯</p>

    <div class="form">
      <label>姓名 <input :value="name" maxlength="8" @input="emit('update:name', ($event.target as HTMLInputElement).value)" /></label>
      <label>性别
        <select :value="gender" @change="emit('update:gender', ($event.target as HTMLSelectElement).value as 'm' | 'f')">
          <option value="m">男</option>
          <option value="f">女</option>
        </select>
      </label>
      <label>随机种子 <input v-model="seedText" placeholder="同种子同行情" /></label>
    </div>

    <button class="primary big" @click="onStart">入职报到（2006-01-02）</button>

    <p class="dim note">本游戏为虚构作品，所有机构、人物、产品、行情均为架空创作，仅供学习与娱乐，不构成任何投资建议。</p>
  </div>
</template>

<style scoped>
.start { width: 520px; padding: 36px 40px; text-align: center; }
h1 { font-size: 26px; letter-spacing: 2px; }
.sub { color: var(--text-dim); margin: 8px 0 28px; }
.form { display: flex; flex-direction: column; gap: 12px; text-align: left; margin-bottom: 28px; }
label { display: flex; align-items: center; justify-content: space-between; gap: 12px; color: var(--text-dim); }
input, select { width: 280px; }
.big { width: 100%; padding: 10px; font-size: 15px; }
.note { margin-top: 22px; font-size: 12px; line-height: 1.8; }
</style>
