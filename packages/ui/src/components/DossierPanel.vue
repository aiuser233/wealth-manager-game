<script setup lang="ts">
/**
 * 生涯档案页（P6+ 增强）：把 careerLog（当前周目 82 章抉择史）、四维终评、成就、结局
 * 汇成一页"成绩单"——培训场景的自然复盘工具，也支持导出。
 */
import { computed } from 'vue';
import { state, getGame, gameReady } from '../state';
import { achievementStates } from '../achievements';
import { VOLUME_META, careerEntryVolume } from '../volume-meta';
import Avatar from './Avatar.vue';
import EndingBadge from './EndingBadge.vue';

const g = computed(() => (gameReady.value ? getGame() : null));
const careerLog = computed(() => state.questEngine?.serialize().careerLog ?? []);

/** 按卷分组的时间线 */
const chapters = computed(() => {
  const byVol = new Map<number, Array<{ date: string; title: string; grade: string }>>();
  for (const c of careerLog.value) {
    const vol = careerEntryVolume(c);
    const arr = byVol.get(vol) ?? [];
    arr.push(c);
    byVol.set(vol, arr);
  }
  return [...byVol.entries()].sort((a, b) => a[0] - b[0]);
});

const gradeLabel: Record<string, string> = { best: '✦ 最佳', good: '✓ 良好', normal: '○ 平平', bad: '✗ 隐患' };
const gradeColor: Record<string, string> = { best: '#e0b64a', good: '#7da65a', normal: '#8b98b8', bad: '#c0665a' };

/** 最佳抉择率 */
const bestRate = computed(() => {
  if (careerLog.value.length === 0) return '--';
  const best = careerLog.value.filter((c) => c.grade === 'best').length;
  return `${Math.round((best / careerLog.value.length) * 100)}%`;
});

/** 四维快照（复用终评口径） */
const dims = computed(() => {
  if (!g.value) return [];
  const qe = state.questEngine;
  const prog = (n: number) => qe?.volumeProgress(n) ?? { done: 0, total: 12 };
  // 卷七（NG+）与卷八（一周目）互斥注册；当前周目总数为 82，全库为 90。
  const vols = [1, 2, 3, 4, 5, 6, 7, 8];
  const questsDone = vols.reduce((a, v) => a + prog(v).done, 0);
  const questsTotal = vols.reduce((a, v) => a + prog(v).total, 0);
  const avgTrust = g.value.clients.length ? g.value.clients.reduce((a, c) => a + c.trust, 0) / g.value.clients.length : 0;
  return [
    { name: '职级', value: ['见习', '普通', '贵宾', '私行', '主管'][Math.min(4, g.value.player.grade)] },
    { name: 'AUM', value: fmtAum(g.value.player.aum) },
    { name: '主线', value: `${questsDone}/${questsTotal} 章` },
    { name: '人生线', value: `${qe?.lifelinesDone() ?? 0} 节点` },
    { name: '信任均值', value: avgTrust.toFixed(0) },
    { name: '违规', value: `${g.value.violations} 次` },
    { name: '最佳抉择率', value: bestRate.value },
    { name: '证书', value: `${g.value.player.certs.length} 张` },
  ];
});

function fmtAum(n: number): string {
  if (n >= 100000000) return `${(n / 100000000).toFixed(2)} 亿`;
  return `${(n / 10000).toFixed(0)} 万`;
}

const ach = computed(() => achievementStates());
const achDone = computed(() => ach.value.filter((a) => a.achieved));

/** 导出档案 HTML（打印即 PDF） */
function exportDossier() {
  if (!g.value) return;
  const rows = careerLog.value.map((c) => `<tr><td>${c.date}</td><td>${c.title}</td><td style="color:${gradeColor[c.grade]}">${gradeLabel[c.grade] ?? c.grade}</td></tr>`).join('');
  const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>生涯档案 · ${g.value.player.name}</title>
<style>body{font-family:system-ui;max-width:760px;margin:24px auto;color:#2b2b33}table{width:100%;border-collapse:collapse;font-size:13px}td{border:1px solid #ddd;padding:5px 9px}h1{font-size:20px}h2{font-size:15px;border-left:4px solid #b5893c;padding-left:8px}.dims{display:flex;gap:14px;flex-wrap:wrap}.dim-card{background:#f6f1e3;border-radius:8px;padding:8px 16px;text-align:center}.dim-card b{display:block;font-size:16px}.ach span{margin-right:6px}</style></head><body>
<h1>《重生之我是理财经理》生涯档案 — ${g.value.player.name}</h1>
<p class="dim">导出时间 ${new Date().toLocaleString()} · 游戏内 ${g.value.date}</p>
<div class="dims">${dims.value.map((d) => `<div class="dim-card"><span style="font-size:11px;color:#888">${d.name}</span><b>${d.value}</b></div>`).join('')}</div>
<h2>成就（${achDone.value.length}/${ach.value.length}）</h2>
<p class="ach">${achDone.value.map((a) => `<span>${a.def.icon} ${a.def.name}</span>`).join('') || '（暂无）'}</p>
<h2>主线抉择时间线（${careerLog.value.length} 章）</h2>
<table><tr><th>日期</th><th>章节</th><th>抉择</th></tr>${rows}</table>
<p style="color:#999;font-size:11px">本游戏为虚构作品，仅供学习与娱乐。</p></body></html>`;
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `生涯档案_${g.value.player.name}_${g.value.date}.html`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
</script>

<template>
  <div v-if="g" class="dossier">
    <div class="head">
      <Avatar seed="player_main" :size="52" />
      <div>
        <h3>{{ g.player.name }} · 生涯档案</h3>
        <p class="dim">{{ g.gradeName() }} · 第 {{ state.playthrough }} 周目 · {{ g.date }}</p>
      </div>
      <button class="export-btn" @click="exportDossier">⬇ 导出档案 HTML</button>
    </div>

    <!-- 四维快照 -->
    <div class="dims">
      <div v-for="d in dims" :key="d.name" class="dim-card">
        <span class="dim">{{ d.name }}</span>
        <b>{{ d.value }}</b>
      </div>
    </div>

    <!-- 成就 -->
    <div class="ach-strip">
      <h4>成就（{{ achDone.length }}/{{ ach.length }}）</h4>
      <p>
        <span v-for="a in achDone" :key="a.def.id" class="ach-chip">{{ a.def.icon }} {{ a.def.name }}</span>
        <span v-if="achDone.length === 0" class="dim">暂无成就。</span>
      </p>
    </div>

    <!-- 分卷时间线 -->
    <div v-for="[vol, items] in chapters" :key="vol" class="vol">
      <h4>{{ VOLUME_META[vol] ?? `卷${vol}` }}（{{ items.length }} 章）</h4>
      <div v-for="c in items" :key="c.date + c.title" class="chapter">
        <span class="dim date">{{ c.date }}</span>
        <span class="title">{{ c.title }}</span>
        <span class="grade" :style="{ color: gradeColor[c.grade] }">{{ gradeLabel[c.grade] ?? c.grade }}</span>
      </div>
    </div>

    <p v-if="careerLog.length === 0" class="dim">还没有完成任何主线章节。剧情任务会在日期到点后自动弹出。</p>
  </div>
</template>

<style scoped>
.dossier { padding: 4px; overflow-y: auto; height: 100%; }
.head { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
h3 { font-size: 16px; }
.export-btn { margin-left: auto; font-size: 12px; }
.dims { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 14px; }
.dim-card { background: var(--bg2); border: 1px solid var(--line); border-radius: 8px; padding: 6px 14px; text-align: center; min-width: 76px; }
.dim-card span { font-size: 11px; display: block; }
.dim-card b { font-size: 15px; }
.ach-strip { margin-bottom: 14px; }
h4 { font-size: 13px; margin: 8px 0 6px; }
.ach-chip { background: var(--bg2); border: 1px solid var(--line); border-radius: 12px; padding: 2px 10px; margin: 0 6px 6px 0; display: inline-block; font-size: 12px; }
.vol { margin-bottom: 12px; }
.chapter { display: flex; gap: 10px; align-items: baseline; padding: 3px 0; border-bottom: 1px dashed var(--line); font-size: 13px; }
.date { width: 76px; flex-shrink: 0; }
.title { flex: 1; }
.grade { width: 56px; text-align: right; font-weight: 700; flex-shrink: 0; }
</style>
