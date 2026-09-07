<script setup lang="ts">
import { computed, ref } from 'vue';
import { state, gameReady, getGame } from '../state';

const g = computed(() => (gameReady.value ? getGame() : null));

/** 存档位：3 自动 + 8 手动 */
interface SaveMeta { slot: number; auto: boolean; date: string; player: string; aum: string; savedAt: string; }
const saves = ref<SaveMeta[]>([]);
const message = ref('');

function refreshSaves() {
  const list: SaveMeta[] = [];
  for (let i = 0; i < 11; i++) {
    const raw = localStorage.getItem(`fm_save_${i}`);
    if (!raw) continue;
    try {
      const data = JSON.parse(raw);
      list.push({
        slot: i, auto: i < 3,
        date: data?.date ?? '?',
        player: data?.player?.name ?? '?',
        aum: fmtAum(data?.player?.aum ?? 0),
        savedAt: data?.savedAt ?? '?',
      });
    } catch { /* 忽略损坏档 */ }
  }
  saves.value = list;
}
refreshSaves();

function fmtAum(n: number): string {
  if (n >= 100000000) return `${(n / 100000000).toFixed(2)}亿`;
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  return `${Math.round(n)}`;
}

function serializeGame(): string {
  const g = getGame();
  return JSON.stringify({
    version: 1,
    savedAt: new Date().toISOString(),
    seed: state.seed,
    date: g.date,
    player: { ...g.player, attrs: { ...g.player.attrs } },
    kpi: { ...g.kpi },
    monthScores: [...g.monthScores],
    memoryUses: g.memoryUses,
    frame: g.frame,
    forceDayDays: g.forceDayDays,
    apUsed: g.apUsed,
    violations: g.violations,
    market: {
      factorState: { ...g.sim.factorState },
      industryState: { ...g.sim.industryState },
      indicesState: { ...g.sim.indicesState },
      sentiment: g.sim.sentiment,
      cursor: g.sim.cursor,
    },
    clients: g.clients.map((c) => ({ ...c, holdings: c.holdings.map((h) => ({ ...h })) })),
    news: state.news.slice(0, 60),
    log: state.log.slice(0, 120),
    certs: g.player.certs,
  });
}

function saveTo(slot: number, auto: boolean) {
  const raw = serializeGame();
  localStorage.setItem(`fm_save_${slot}`, raw);
  message.value = auto ? `自动存档完成（槽位 ${slot + 1}）` : `已保存到槽位 ${slot + 1}`;
  refreshSaves();
  setTimeout(() => (message.value = ''), 2500);
}

function loadFrom(slot: number) {
  const raw = localStorage.getItem(`fm_save_${slot}`);
  if (!raw) return;
  message.value = '读档完成（引擎状态已恢复，UI 刷新后生效）';
  // 读档实现：重建 MarketSim 到 cursor（重放因子状态机）
  try {
    const data = JSON.parse(raw);
    import('../state').then((m) => {
      m.loadGameFromSave(data);
      message.value = '读档成功！';
      refreshSaves();
      setTimeout(() => (message.value = ''), 2000);
    });
  } catch {
    message.value = '存档损坏，无法读取。';
  }
}

function exportSave() {
  const raw = serializeGame();
  const blob = new Blob([raw], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `fm_save_${getGame().date}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function importSave(file: File) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result));
      import('../state').then((m) => {
        m.loadGameFromSave(data);
        message.value = '导入成功！';
        setTimeout(() => (message.value = ''), 2000);
      });
    } catch {
      message.value = '文件格式错误。';
    }
  };
  reader.readAsText(file);
}
</script>

<template>
  <div v-if="g" class="panel sys full">
    <h3>系统 · 存档</h3>
    <p v-if="message" class="msg">{{ message }}</p>

    <div class="row">
      <button class="primary" @click="saveTo(3, false)">存到槽位 4（手动）</button>
      <button class="primary" @click="saveTo(4, false)">存到槽位 5（手动）</button>
      <button class="primary" @click="saveTo(5, false)">存到槽位 6（手动）</button>
      <button @click="exportSave">导出到文件</button>
      <label class="file-label">
        导入文件
        <input type="file" accept=".json" style="display: none" @change="importSave(($event.target as HTMLInputElement).files![0])" />
      </label>
    </div>

    <h4>已有存档</h4>
    <div class="save-list">
      <div v-for="s in saves" :key="s.slot" class="save-item" :class="{ auto: s.auto }">
        <div class="info">
          <b>{{ s.auto ? `自动档 ${s.slot + 1}` : `手动档 ${s.slot + 1}` }}</b>
          <span class="dim">{{ s.player }} · {{ s.date }} · AUM {{ s.aum }} · {{ s.savedAt.slice(0, 16).replace('T', ' ') }}</span>
        </div>
        <button @click="loadFrom(s.slot)">读取</button>
      </div>
      <p v-if="saves.length === 0" class="dim">暂无存档。结算或翻月时会自动存档。</p>
    </div>

    <div class="about">
      <h4>关于</h4>
      <p class="dim">《重生之我是理财经理》M1 开发版 · TS Monorepo + Vue 3</p>
      <p class="dim">本游戏为虚构作品：所有机构（汇诚银行、玄商 300 等）、人物、产品、行情均以公开历史行情为蓝本架空改编，仅供学习与娱乐，不构成任何投资建议；市场数据为模拟生成，不代表任何真实产品表现。题库参考真实考试公开大纲原创改编。</p>
      <p class="dim">seed={{ state.seed }} · 引擎 v0.1 · 同种子同行情可复现</p>
    </div>
  </div>
</template>

<style scoped>
.sys.full { height: 100%; overflow-y: auto; padding: 16px 20px; display: flex; flex-direction: column; gap: 10px; }
h3 { margin-bottom: 4px; }
h4 { font-size: 13px; color: var(--text-dim); margin: 8px 0 6px; }
.msg { color: var(--gold); }
.row { display: flex; gap: 8px; flex-wrap: wrap; }
.file-label { border: 1px solid var(--line); border-radius: 6px; padding: 6px 12px; cursor: pointer; }
.file-label:hover { border-color: var(--accent); }
.save-list { display: flex; flex-direction: column; gap: 6px; }
.save-item { display: flex; justify-content: space-between; align-items: center; background: var(--bg2); border: 1px solid var(--line); border-radius: 8px; padding: 8px 12px; }
.save-item.auto { border-left: 3px solid var(--accent); }
.save-item .info { display: flex; flex-direction: column; gap: 2px; }
.about { margin-top: 12px; border-top: 1px solid var(--line); padding-top: 10px; }
.about p { font-size: 12px; line-height: 1.8; }
</style>
