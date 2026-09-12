<script setup lang="ts">
/**
 * B1 日志档案馆：工作台日志面板只保留最近 N 个月（可设置），
 * 完整历史按年月归档在此页，支持按文本关键词过滤与导出 HTML。
 */
import { computed, ref } from 'vue';
import { state, gameReady, getGame } from '../state';
import { storage } from '../storage';

const g = computed(() => (gameReady.value ? getGame() : null));

const kw = ref('');
/** 关键词过滤（空=全部） */
const filtered = computed(() => {
  const k = kw.value.trim();
  return k ? state.log.filter((l) => l.text.includes(k) || l.date.includes(k)) : state.log;
});

/** 按年月分组（log 是 unshift 前插，天然新→旧） */
const groups = computed(() => {
  const out: Array<{ ym: string; items: typeof filtered.value }> = [];
  for (const l of filtered.value) {
    const ym = l.date.slice(0, 7);
    const last = out[out.length - 1];
    if (last && last.ym === ym) last.items.push(l);
    else out.push({ ym, items: [l] });
  }
  return out;
});

const totalSeen = computed(() => state.log.length);

function exportLog() {
  if (!g.value) return;
  const rows = state.log
    .map((l) => `<tr><td>${l.date}</td><td>${l.text.replace(/</g, '&lt;')}</td></tr>`)
    .join('');
  const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>经营日志 · ${g.value.player.name}</title>
<style>body{font-family:system-ui;max-width:860px;margin:24px auto;color:#2b2b33}table{width:100%;border-collapse:collapse;font-size:13px}td{border:1px solid #ddd;padding:5px 9px;vertical-align:top}td:first-child{white-space:nowrap;color:#888}h1{font-size:20px}</style></head><body>
<h1>《重生之我是理财经理》经营日志 — ${g.value.player.name}</h1>
<p style="color:#999">导出于 ${new Date().toLocaleString()} · 游戏内 ${g.value.date} · 共 ${state.log.length} 条</p>
<table><tr><th>日期</th><th>事件</th></tr>${rows}</table>
<p style="color:#999;font-size:11px">本游戏为虚构作品，仅供学习与娱乐。</p></body></html>`;
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `经营日志_${g.value.player.name}_${g.value.date}.html`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 30000);
}

/** 清掉 200 条上限之外的担忧：日志本身在 state 里保留 200 条，此处如实说明 */
const logCap = 200;
const capNote = computed(() => `引擎日志环形上限 ${logCap} 条（当前 ${state.log.length}）。定期导出可永久留存。`);
</script>

<template>
  <div v-if="g" class="panel arch full">
    <div class="head">
      <h3>📜 日志档案馆</h3>
      <span class="dim">{{ capNote }}</span>
      <div class="tools">
        <input v-model="kw" placeholder="搜索：客户名 / 事件词 / 日期…" style="width: 240px" />
        <button @click="exportLog">⬇ 导出全部 HTML</button>
      </div>
    </div>
    <div class="list">
      <div v-for="grp in groups" :key="grp.ym" class="ym-group">
        <h4>{{ grp.ym.slice(0, 4) }} 年 {{ Number(grp.ym.slice(5, 7)) }} 月 <span class="dim">（{{ grp.items.length }} 条）</span></h4>
        <p v-for="(l, i) in grp.items" :key="i"><span class="dim">{{ l.date }}</span> {{ l.text }}</p>
      </div>
      <p v-if="filtered.length === 0" class="dim">{{ kw ? '没有匹配的日志。' : '暂无日志。' }}</p>
    </div>
  </div>
</template>

<style scoped>
.arch.full { height: 100%; padding: 14px 18px; display: flex; flex-direction: column; }
.head { display: flex; align-items: baseline; gap: 14px; margin-bottom: 10px; flex-wrap: wrap; }
h3 { font-size: 15px; }
.head .tools { margin-left: auto; display: flex; gap: 8px; }
.list { flex: 1; overflow-y: auto; line-height: 1.9; font-size: 13px; }
.ym-group { margin-bottom: 10px; }
h4 { font-size: 13px; color: var(--gold); border-bottom: 1px dashed var(--line); padding-bottom: 4px; margin: 6px 0; }
.dim { color: var(--text-dim); }
</style>
