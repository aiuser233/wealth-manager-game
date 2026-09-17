<script setup lang="ts">
import { computed, ref } from 'vue';
import { state, gameReady, getGame, wrongBook, weakSpotRadar, serializeNow, saveToSlot, autoSave as autoSaveNow, saveSettings, loadGameFromSave, validateSaveData, PUBLIC_BETA_VERSION } from '../state';
import { buildReport, reportHtml, downloadReport } from '../report';
import { storage, storageBackend } from '../storage';
import DossierPanel from './DossierPanel.vue';

const sysTab = computed({ get: () => state.systemView, set: (value: typeof state.systemView) => { state.systemView = value; } });

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

/** 存档位：1 自动（每 10 分钟轮转）+ 3 手动 */
interface SaveMeta { slot: number; auto: boolean; date: string; player: string; aum: string; savedAt: string; }
const saves = ref<SaveMeta[]>([]);
const message = ref('');
/** 手动存档目标槽位（1-3） */
const manualSlot = ref(1);
const hasBackup = ref(false);

function refreshSaves() {
  const list: SaveMeta[] = [];
  for (let i = 0; i < 4; i++) {
    const raw = storage.get(`fm_save_${i}`);
    if (!raw) continue;
    try {
      const data = JSON.parse(raw);
      list.push({
        slot: i, auto: i === 0,
        date: data?.date ?? '?',
        player: data?.player?.name ?? '?',
        aum: fmtAum(data?.player?.aum ?? 0),
        savedAt: data?.savedAt ?? '?',
      });
    } catch { /* 忽略损坏档 */ }
  }
  saves.value = list;
  hasBackup.value = !!storage.get('fm_save_backup');
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
  if (auto) {
    autoSaveNow();
    message.value = '自动存档完成';
  } else if (saveToSlot(slot)) {
    message.value = `已保存到手动档 ${slot}`;
  }
  refreshSaves();
  setTimeout(() => (message.value = ''), 2500);
}

function loadFrom(slot: number) {
  const raw = storage.get(`fm_save_${slot}`);
  if (!raw) return;
  if (!confirm('读取存档会替换当前进度。系统会先创建一份恢复备份，继续吗？')) return;
  try {
    const data = JSON.parse(raw);
    const check = validateSaveData(data);
    if (!check.ok) throw new Error(check.error);
    loadGameFromSave(data);
    message.value = '读档成功，读档前进度已保存为恢复备份。';
    refreshSaves();
  } catch (error) {
    message.value = error instanceof Error ? error.message : '存档损坏，无法读取。';
  }
}

function loadBackup() {
  const raw = storage.get('fm_save_backup');
  if (!raw || !confirm('恢复到上一次读档前的进度吗？当前进度仍会先被备份。')) return;
  try {
    const data = JSON.parse(raw);
    const check = validateSaveData(data);
    if (!check.ok) throw new Error(check.error);
    loadGameFromSave(data);
    message.value = '恢复备份成功。';
    refreshSaves();
  } catch (error) {
    message.value = error instanceof Error ? error.message : '恢复备份损坏。';
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
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    message.value = '存档文件超过 5 MB，已拒绝导入。';
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result));
      const check = validateSaveData(data);
      if (!check.ok) throw new Error(check.error);
      if (!confirm('导入会替换当前进度。系统会先创建恢复备份，继续吗？')) return;
      loadGameFromSave(data);
      message.value = '导入成功，导入前进度已保存为恢复备份。';
      refreshSaves();
    } catch (error) {
      message.value = error instanceof Error ? error.message : '文件格式错误。';
    }
  };
  reader.readAsText(file);
}

async function copyDiagnostics() {
  const diagnostics = {
    gameVersion: PUBLIC_BETA_VERSION,
    date: getGame().date,
    seed: state.seed,
    screen: state.screen,
    storage: storageBackend(),
    browser: navigator.userAgent,
    recentLogs: state.log.slice(0, 20),
  };
  try {
    await navigator.clipboard.writeText(JSON.stringify(diagnostics, null, 2));
    message.value = '诊断信息已复制；发送前可自行检查内容，不含完整存档。';
  } catch {
    message.value = '浏览器未允许复制，请使用导出存档并注明当前版本。';
  }
}
</script>

<template>
  <div v-if="g" class="panel sys full">
    <div class="tabs">
      <button :class="{ active: sysTab === 'save' }" @click="sysTab = 'save'">存档与报告</button>
      <button :class="{ active: sysTab === 'settings' }" @click="sysTab = 'settings'">设置</button>
      <button :class="{ active: sysTab === 'dossier' }" @click="sysTab = 'dossier'">生涯档案</button>
    </div>
    <template v-if="sysTab === 'settings'">
      <h3>设置</h3>
      <div class="setting-row">
        <label class="switch-label">
          <input type="checkbox" :checked="state.settings.autoSaveEnabled" @change="saveSettings({ autoSaveEnabled: ($event.target as HTMLInputElement).checked })" />
          自动存档（游戏运行中按下方间隔自动保存到自动档）
        </label>
      </div>
      <div class="setting-row">
        <span>自动存档间隔：</span>
        <button v-for="m in [5, 10, 15, 20]" :key="m" :class="{ primary: state.settings.autoSaveMinutes === m }" @click="saveSettings({ autoSaveMinutes: m })">{{ m }} 分钟</button>
      </div>
      <div class="setting-row">
        <span>工作台日志显示范围：</span>
        <button v-for="(label, m) in ['1 个月', '3 个月', '6 个月', '全部']" :key="m" :class="{ primary: state.settings.logArchiveMonths === [1, 3, 6, 0][m] }" @click="saveSettings({ logArchiveMonths: [1, 3, 6, 0][m] })">{{ label }}</button>
        <span class="dim">更早的日志去「档案」页看</span>
      </div>
      <p class="dim">设置保存在本机（fm_settings），读档后自动恢复。</p>
    </template>
    <template v-else-if="sysTab === 'save'">
    <h3>系统 · 存档</h3>
    <p class="dim">自动档唯一（游戏运行中每 10 分钟自动覆盖 + 结算/事件后保存）；手动档 1–3 由你自己掌控。</p>
    <p v-if="message" class="msg">{{ message }}</p>

    <div class="row">
      <span class="dim">手动存档到：</span>
      <button :class="{ primary: manualSlot === 1 }" @click="manualSlot = 1">槽位 1</button>
      <button :class="{ primary: manualSlot === 2 }" @click="manualSlot = 2">槽位 2</button>
      <button :class="{ primary: manualSlot === 3 }" @click="manualSlot = 3">槽位 3</button>
      <button class="primary" @click="saveTo(manualSlot, false)">保存到手动档 {{ manualSlot }}</button>
      <button @click="saveTo(0, true)">立即自动存档</button>
      <button v-if="hasBackup" @click="loadBackup">恢复上次读档前进度</button>
      <button @click="exportSave">导出到文件</button>
      <label class="file-label">
        导入文件
        <input type="file" accept=".json" style="display: none" @change="importSave(($event.target as HTMLInputElement).files![0])" />
      </label>
    </div>

    <div class="row">
      <button class="gold-btn" @click="exportReport">📄 导出学习报告（考证/错题/生涯/合规）</button>
      <button @click="copyDiagnostics">复制问题诊断信息</button>
    </div>

    <h4>已有存档</h4>
    <div class="save-list">
      <div v-for="s in saves" :key="s.slot" class="save-item" :class="{ auto: s.auto }">
        <div class="info">
          <b>{{ s.auto ? '自动档（每 10 分钟）' : `手动档 ${s.slot}` }}</b>
          <span class="dim">{{ s.player }} · {{ s.date }} · AUM {{ s.aum }} · {{ s.savedAt.slice(0, 16).replace('T', ' ') }}</span>
        </div>
        <button @click="loadFrom(s.slot)">读取</button>
      </div>
      <p v-if="saves.length === 0" class="dim">暂无存档。开局后每 10 分钟自动存档，或手动保存到 1–3 槽位。</p>
    </div>

    <div class="about">
      <h4>关于</h4>
      <p class="dim">《重生之我是理财经理》朋友公测版 {{ PUBLIC_BETA_VERSION }} · TS Monorepo + Vue 3</p>
      <p class="dim">本游戏为虚构作品：所有机构（汇诚银行、玄商 300 等）、人物、产品、行情均以公开历史行情为蓝本架空改编，仅供学习与娱乐，不构成任何投资建议；市场数据为模拟生成，不代表任何真实产品表现。题库参考真实考试公开大纲原创改编。</p>
      <p class="dim">题库仍处于公测审校阶段，不代表任何考试机构的官方题库或官方合作。</p>
      <p class="dim">隐私：默认存档和学习记录仅保存在当前设备；除非你主动导出或配置收集端点，游戏不会上传存档。</p>
      <p class="dim">seed={{ state.seed }} · 存储={{ storageBackend() }} · 同种子同行情可复现</p>
    </div>
    </template>
    <DossierPanel v-else />
  </div>
</template>

<style scoped>
.tabs { display: flex; gap: 8px; margin-bottom: 6px; }
.tabs button.active { border-color: var(--gold); color: var(--gold); }
.setting-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin: 10px 0; line-height: 2; }
.switch-label { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.switch-label input { width: 16px; height: 16px; }
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
