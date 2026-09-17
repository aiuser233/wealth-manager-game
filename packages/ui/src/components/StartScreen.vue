<script setup lang="ts">
import { computed, ref } from 'vue';
import { PUBLIC_BETA_VERSION } from '../state';

const props = defineProps<{ seed: number; name: string; gender: 'm' | 'f'; hasSave: boolean; saveLabel?: string; loading?: boolean; error?: string }>();
const emit = defineEmits<{ (e: 'update:seed', v: number): void; (e: 'update:name', v: string): void; (e: 'update:gender', v: 'm' | 'f'): void; (e: 'start'): void; (e: 'continue'): void; (e: 'export-save'): void }>();
const seedText = ref(String(props.seed));
const advanced = ref(false);
const seedNum = computed(() => { const n = Number(seedText.value); return Number.isFinite(n) && n > 0 ? Math.floor(n) : 42; });
function onStart() { emit('update:seed', seedNum.value); emit('update:name', props.name); emit('update:gender', props.gender); emit('start'); }
</script>

<template>
  <main class="start-shell">
    <section class="hero">
      <div class="beta">朋友公测版 · {{ PUBLIC_BETA_VERSION }}</div>
      <h1>重生之我是理财经理</h1>
      <p class="tagline">回到 2006，从城东支行的见习经理开始，穿越二十年财富管理周期。</p>
      <div class="features"><span>20 年职业生涯</span><span>客户与行情联动</span><span>选择塑造结局</span></div>
      <p class="quote">“知道未来只是起点，守住客户与自己，才是第二次人生。”</p>
    </section>

    <section class="panel start-card" aria-labelledby="start-title">
      <h2 id="start-title">开始生涯</h2>
      <p class="dim intro">建议使用桌面版 Chrome 或 Edge。存档默认保存在当前浏览器。</p>
      <button v-if="hasSave" class="primary continue" :disabled="loading" @click="emit('continue')">
        <b>继续上次进度</b><span>{{ saveLabel }}</span>
      </button>
      <button v-if="hasSave" class="export-old" :disabled="loading" @click="emit('export-save')">先导出旧进度备份</button>
      <div v-if="hasSave" class="divider"><span>或者开始新生涯</span></div>
      <div class="form">
        <label><span>姓名</span><input :value="name" maxlength="8" :disabled="loading" @input="emit('update:name', ($event.target as HTMLInputElement).value)" /></label>
        <label><span>性别</span><select :value="gender" :disabled="loading" @change="emit('update:gender', ($event.target as HTMLSelectElement).value as 'm' | 'f')"><option value="m">男</option><option value="f">女</option></select></label>
      </div>
      <button class="advanced-toggle" :disabled="loading" @click="advanced = !advanced">{{ advanced ? '收起' : '展开' }}高级设置</button>
      <label v-if="advanced" class="seed"><span>行情随机种子</span><input v-model="seedText" :disabled="loading" placeholder="同种子同行情" /></label>
      <button class="new-game" :class="{ primary: !hasSave }" :disabled="loading" @click="onStart">{{ loading ? '正在生成 2000—2006 历史行情…' : '入职报到 · 2006-01-02' }}</button>
      <p v-if="error" class="error">{{ error }}</p>
      <p class="notice">虚构作品，仅供学习与娱乐，不构成投资建议。题库处于公测审校阶段，并非任何机构官方题库。</p>
    </section>
  </main>
</template>

<style scoped>
.start-shell{width:min(1040px,94vw);display:grid;grid-template-columns:1.15fr .85fr;gap:56px;align-items:center}.hero{padding:20px}.beta{display:inline-block;padding:4px 10px;border:1px solid rgba(79,140,255,.45);border-radius:14px;color:#91b8ff;background:rgba(79,140,255,.1);font-size:11px;letter-spacing:.08em}.hero h1{margin:18px 0 12px;font-size:42px;letter-spacing:.08em;line-height:1.22;background:linear-gradient(100deg,#fff,#a9c8ff 70%,#d9c8ff);-webkit-background-clip:text;color:transparent}.tagline{max-width:560px;color:#aab7d2;font-size:16px;line-height:1.9}.features{display:flex;gap:10px;flex-wrap:wrap;margin-top:24px}.features span{padding:6px 10px;border-radius:6px;background:rgba(26,39,64,.8);color:#93a5c7;font-size:12px}.quote{margin-top:42px;color:#6f82a5;font-size:13px}.start-card{padding:28px 30px;background:linear-gradient(145deg,rgba(27,38,62,.98),rgba(15,23,40,.98));box-shadow:0 28px 80px rgba(0,0,0,.24)}h2{font-size:20px}.intro{margin:5px 0 20px;font-size:12px;line-height:1.6}.continue{width:100%;display:flex;align-items:center;justify-content:space-between;padding:11px 14px}.continue span{font-size:11px;opacity:.8}.divider{display:flex;align-items:center;gap:10px;margin:17px 0;color:#647390;font-size:10px}.divider:before,.divider:after{content:'';height:1px;flex:1;background:var(--line)}.form{display:grid;gap:10px}.form label,.seed{display:grid;grid-template-columns:64px 1fr;align-items:center;gap:10px;color:var(--text-dim);font-size:12px}.form input,.form select,.seed input{width:100%}.advanced-toggle{margin:10px 0 5px;padding:2px 0;border:0;background:transparent;color:#7187ab;font-size:11px}.seed{margin:5px 0 10px}.new-game{width:100%;margin-top:14px;padding:10px}.notice{margin-top:18px;color:#657590;font-size:10px;line-height:1.65}.error{margin-top:10px;color:var(--up);font-size:12px;line-height:1.5}
.export-old{width:100%;margin-top:6px;padding:4px;border-color:transparent;background:transparent;color:#7890b8;font-size:10px}
@media(max-width:767px){.start-shell{display:block;padding:20px 0}.hero{padding:8px 10px 24px}.hero h1{font-size:29px}.tagline{font-size:13px}.quote{display:none}.start-card{padding:22px 18px}.features{margin-top:14px}}
</style>
