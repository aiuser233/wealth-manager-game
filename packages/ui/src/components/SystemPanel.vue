<script setup lang="ts">
import { computed, ref } from 'vue';
import { state, gameReady, getGame, wrongBook, weakSpotRadar, serializeNow } from '../state';
import { buildReport, reportHtml, downloadReport } from '../report';
import { storage } from '../storage';
import DossierPanel from './DossierPanel.vue';

const sysTab = ref<'save' | 'dossier'>('save');

const g = computed(() => (gameReady.value ? getGame() : null));

/** 学习报告导出（P2）：生成 HTML → 浏览器打开 + 另存，打印即为 PDF */
function exportReport() {
  const game = getGame();
  const book = wrongBook();
  const rep = buildReport(game, {
    weakSpots: weakSpotRadar(),
    wrongTotal: book.length,
    wrongCorrected: 0,
    examAttempts: Number(storage.get('fm_exam_attempts') ?? 0),
    lifeLog: state.log.filter((l) => l.text.startsWith('【人生线】')).map((l) => ({ date: l.date, text: l.text.replace('【人生线】', '') })),
    questEngine: state.questEngine,
  });
  downloadReport(reportHtml(rep), `学习报告_${game.player.name}_${game.date}.html`);
  message.value = '学习报告已生成（新窗口打开 + 已下载 HTML，浏览器打印即为 PDF）';
  setTimeout(() => (message.value = ''), 3500);
}

/** 存档位：3 自动 + 8 手动 */
interface SaveMeta { slot: number; auto: boolean; date: string; player: string; aum: string; savedAt: string; }
const saves = ref<SaveMeta[]>([]);
const message = ref('');

function refreshSaves() {
  const list: SaveMeta[] = [];
  for (let i = 0; i < 11; i++) {
    const raw = storage.get(`fm_save_${i}`);
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
  // 复用 state 的 v2 序列化（含接待/考试/剧情 pending/K线历史），手动档与自动档格式一致
  return serializeNow();
}

function saveTo(slot: number, auto: boolean) {
  const raw = serializeGame();
  storage.set(`fm_save_${slot}`, raw);
  message.value = auto ? `自动存档完成（槽位 ${slot + 1}）` : `已保存到槽位 ${slot + 1}`;
  refreshSaves();
  setTimeout(() => (message.value = ''), 2500);
}

function loadFrom(slot: number) {
  const raw = storage.get(`fm_save_${slot}`);
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
    <div class="tabs">
      <button :class="{ active: sysTab === 'save' }" @click="sysTab = 'save'">存档与报告</button>
      <button :class="{ active: sysTab === 'dossier' }" @click="sysTab = 'dossier'">生涯档案</button>
    </div>
    <template v-if="sysTab === 'save'">
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

    <div class="row">
      <button class="gold-btn" @click="exportReport">📄 导出学习报告（考证/错题/生涯/合规）</button>
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
    </template>
    <DossierPanel v-else />
  </div>
</template>

<style scoped>
.tabs { display: flex; gap: 8px; margin-bottom: 6px; }
.tabs button.active { border-color: var(--gold); color: var(--gold); }
.sys.full { height: 100%; overflow-y: auto; padding: 16px 20px; display: flex; flex-direction: column; gap: 10px; }
h3 { margin-bottom: 4px; }
h4 { font-size: 13px; color: var(--text-dim); margin: 8px 0 6px; }
.msg { color: var(--gold); }
.row { display: flex; gap: 8px; flex-wrap: wrap; }
.gold-btn { border-color: var(--gold); color: var(--gold); }
.gold-btn:hover:not(:disabled) { background: rgba(240, 180, 41, 0.12); border-color: var(--gold); }
.file-label { border: 1px solid var(--line); border-radius: 6px; padding: 6px 12px; cursor: pointer; }
.file-label:hover { border-color: var(--accent); }
.save-list { display: flex; flex-direction: column; gap: 6px; }
.save-item { display: flex; justify-content: space-between; align-items: center; background: var(--bg2); border: 1px solid var(--line); border-radius: 8px; padding: 8px 12px; }
.save-item.auto { border-left: 3px solid var(--accent); }
.save-item .info { display: flex; flex-direction: column; gap: 2px; }
.about { margin-top: 12px; border-top: 1px solid var(--line); padding-top: 10px; }
.about p { font-size: 12px; line-height: 1.8; }
</style>
