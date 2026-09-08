<script setup lang="ts">
/**
 * P4 培训后台 · 讲师工作台：
 * - 学员侧：设置编号 / 导出学习记录 / 配置收集端点
 * - 讲师侧：导入多份记录 → 团队聚合报表（通过率/弱项地图/抉择分布）→ 导出 HTML
 * - 行内题包：导入 JSON（禁语/机构/结构机器闸）→ 并入抽题池
 */
import { ref, computed } from 'vue';
import { getGame, gameReady } from '../state';
import {
  getStudentId, setStudentId, buildStudentRecord, downloadStudentRecord,
  uploadStudentRecord, getCollectEndpoint, setCollectEndpoint, examHistory, choiceHistory,
} from '../lms';
import { aggregateTeam, parseStudentRecord, teamReportHtml, type StudentRecord } from '../trainer';
import { checkPack, listPacks, savePack, removePack, packQuestions, type PackIssue, type CustomPackMeta } from '../packs';

const studentId = ref(getStudentId());
const savedId = ref('');
function saveId() {
  setStudentId(studentId.value);
  savedId.value = `学员编号已保存：${getStudentId() || '（匿名）'}`;
  setTimeout(() => (savedId.value = ''), 2500);
}

const msg = ref('');
function say(m: string) {
  msg.value = m;
  setTimeout(() => (msg.value = ''), 4000);
}

/** 导出学习记录（+可选上传） */
const exporting = ref(false);
async function exportRecord() {
  if (!gameReady.value) return say('请先进入游戏（有存档才能导出记录）。');
  exporting.value = true;
  try {
    const rec = buildStudentRecord(getGame());
    downloadStudentRecord(rec);
    const up = await uploadStudentRecord(rec);
    say(`学习记录已导出 JSON。${up}`);
  } finally {
    exporting.value = false;
  }
}

/** 收集端点 */
const endpoint = ref(getCollectEndpoint());
function saveEndpoint() {
  setCollectEndpoint(endpoint.value);
  say(endpoint.value.trim() ? '收集端点已保存（内网地址）。' : '收集端点已清空（纯本地模式）。');
}

/** 导入学员记录 → 聚合 */
const records = ref<StudentRecord[]>([]);
const className = ref('试点班');
async function onImportRecords(ev: Event) {
  const input = ev.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  if (files.length === 0) return;
  let ok = 0;
  for (const f of files) {
    const r = parseStudentRecord(await f.text());
    if ('error' in r) { say(`「${f.name}」${r.error}`); continue; }
    records.value = records.value.filter((x) => x.studentId !== r.studentId);
    records.value.push(r);
    ok += 1;
  }
  input.value = '';
  if (ok > 0) say(`成功导入 ${ok} 份学员记录（共 ${records.value.length} 份）。`);
}

const agg = computed(() => (records.value.length ? aggregateTeam(records.value) : null));
const myExams = computed(() => (gameReady.value ? examHistory() : []));
const myChoices = computed(() => choiceHistory());

function exportTeamReport() {
  if (!agg.value) return;
  const html = teamReportHtml(agg.value, className.value.trim() || '试点班', new Date().toLocaleString('zh-CN'));
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  const a = document.createElement('a');
  a.href = url;
  a.download = `团队学习报表_${className.value || '班级'}.html`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

/** 行内题包 */
const packMsg = ref('');
const packIssues = ref<PackIssue[]>([]);
const packMetas = ref<CustomPackMeta[]>(listPacks());
const packPoolCount = ref(packQuestions().length);

async function onImportPack(ev: Event) {
  const input = ev.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const raw = await file.text();
  const r = checkPack(raw);
  packIssues.value = r.issues.slice(0, 30);
  if (!r.ok) {
    packMsg.value = `题包校验未通过（${r.issues.length} 个问题），未导入。`;
    input.value = '';
    return;
  }
  const subjects = new Set(r.questions.map((q) => q.subject));
  const name = file.name.replace(/\.json$/i, '');
  savePack(name, [...subjects][0] ?? 'exam_bank_law', r.questions, file.name.includes('合规') ? '行内合规专项' : undefined);
  packMetas.value = listPacks();
  packPoolCount.value = packQuestions().length;
  packMsg.value = `题包「${name}」已导入 ${r.questions.length} 题，已并入抽题池。`;
  input.value = '';
}

function deletePack(name: string) {
  removePack(name);
  packMetas.value = listPacks();
  packPoolCount.value = packQuestions().length;
  packMsg.value = `题包「${name}」已删除。`;
}

const pct = (x: number) => `${(x * 100).toFixed(0)}%`;
</script>

<template>
  <div class="panel sys full trainer">
    <h3>培训后台 · 讲师工作台</h3>
    <p v-if="msg" class="msg">{{ msg }}</p>

    <div class="cols">
      <!-- 学员侧 -->
      <section class="panel">
        <h4>学员 · 学习记录</h4>
        <div class="row">
          <input v-model="studentId" placeholder="学员编号（工号/学号，可留空匿名）" />
          <button @click="saveId">保存编号</button>
        </div>
        <p v-if="savedId" class="msg">{{ savedId }}</p>
        <div class="row">
          <button class="primary" :disabled="exporting" @click="exportRecord">{{ exporting ? '导出中…' : '⬇ 导出我的学习记录' }}</button>
          <span class="dim">考试 {{ myExams.length }} 次 · 抉择 {{ myChoices.length }} 次</span>
        </div>
        <div class="row">
          <input v-model="endpoint" placeholder="可选：内网收集端点 URL（留空=纯本地）" style="flex:1" />
          <button @click="saveEndpoint">保存</button>
        </div>
        <p class="dim">记录包含：考试明细/错题知识点/剧情抉择/活跃日/证书/合规次数。默认匿名，不出本机。</p>
      </section>

      <!-- 讲师侧 -->
      <section class="panel">
        <h4>讲师 · 团队聚合报表</h4>
        <div class="row">
          <label class="file-label">
            导入学员记录（可多选）
            <input type="file" accept=".json" multiple style="display:none" @change="onImportRecords" />
          </label>
          <input v-model="className" placeholder="班级名称" style="width:120px" />
          <button class="gold-btn" :disabled="!agg" @click="exportTeamReport">📊 生成团队报表 HTML</button>
        </div>

        <div v-if="agg" class="agg">
          <div class="kpis">
            <span class="kpi"><b>{{ agg.classSize }}</b>学员</span>
            <span class="kpi"><b>{{ agg.avgActiveDays.toFixed(1) }}</b>人均活跃日</span>
            <span class="kpi"><b>{{ agg.avgQuests.toFixed(1) }}</b>人均主线章</span>
            <span class="kpi" :class="{ warn: agg.violationStudents > 0 }"><b>{{ agg.violationStudents }}</b>有违规记录</span>
          </div>
          <h5>考证通过率</h5>
          <table class="mini">
            <tr><th>科目</th><th>人次</th><th>通过</th><th>率</th></tr>
            <tr v-for="p in agg.passRate.slice(0, 6)" :key="p.examName">
              <td>{{ p.examName }}</td><td>{{ p.attempts }}</td><td>{{ p.passed }}</td>
              <td :class="p.rate >= 0.7 ? 'good' : 'bad'">{{ pct(p.rate) }}</td>
            </tr>
            <tr v-if="agg.passRate.length === 0"><td colspan="4" class="dim">暂无</td></tr>
          </table>
          <h5>弱项知识 Top 8</h5>
          <div class="weakbar" v-for="w in agg.weakMap.slice(0, 8)" :key="w.tag">
            <span class="tagname">{{ w.tag }}</span>
            <span class="bar" :style="{ width: Math.min(100, w.students * 20) + 'px' }"></span>
            <span class="dim">{{ w.students }} 人</span>
          </div>
          <p v-if="agg.weakMap.length === 0" class="dim">暂无错题数据。</p>
          <h5>剧情抉择分布</h5>
          <table class="mini">
            <tr><th>任务</th><th>分布</th><th>最优率</th></tr>
            <tr v-for="c in agg.choiceDist.slice(0, 6)" :key="c.quest">
              <td>{{ c.quest }}</td>
              <td><span v-for="(n, g) in c.dist" :key="g" class="grade-chip" :data-g="g">{{ g }}×{{ n }}</span></td>
              <td>{{ pct(c.bestRate) }}</td>
            </tr>
            <tr v-if="agg.choiceDist.length === 0"><td colspan="3" class="dim">暂无</td></tr>
          </table>
        </div>
        <p v-else class="dim">尚未导入学员记录。学员在「系统」页导出 JSON 后，讲师在此导入。</p>
      </section>
    </div>

    <!-- 行内题包 -->
    <section class="panel">
      <h4>行内题包热加载（合规部门提交）</h4>
      <div class="row">
        <label class="file-label">
          导入题包 JSON
          <input type="file" accept=".json" style="display:none" @change="onImportPack" />
        </label>
        <span class="dim">当前抽题池：{{ packPoolCount }} 题（含行内）</span>
      </div>
      <p v-if="packMsg" class="msg">{{ packMsg }}</p>
      <ul v-if="packIssues.length" class="issues">
        <li v-for="(it, i) in packIssues" :key="i" class="bad">
          第 {{ it.index + 1 }} 题 [{{ it.field }}]：{{ it.message }}
        </li>
      </ul>
      <table v-if="packMetas.length" class="mini">
        <tr><th>题包</th><th>题数</th><th>导入时间</th><th></th></tr>
        <tr v-for="m in packMetas" :key="m.name">
          <td>{{ m.name }}</td><td>{{ m.count }}</td><td class="dim">{{ m.importedAt.slice(0, 10) }}</td>
          <td><button class="danger" @click="deletePack(m.name)">删除</button></td>
        </tr>
      </table>
      <p class="dim">导入时自动跑合规机器闸（禁语/真实机构/答案结构），未通过不并入抽题池。题包仅存本机。</p>
    </section>
  </div>
</template>

<style scoped>
.trainer .cols { display: grid; grid-template-columns: 1fr 1.4fr; gap: 12px; align-items: start; }
.row { display: flex; gap: 8px; align-items: center; margin: 8px 0; flex-wrap: wrap; }
.row input { flex: 1; min-width: 140px; }
.agg h5 { margin: 10px 0 4px; }
table.mini { width: 100%; border-collapse: collapse; font-size: 13px; }
table.mini td, table.mini th { border: 1px solid var(--line, #ddd); padding: 4px 8px; text-align: left; }
td.good { color: #5a8a4a; font-weight: 700; }
td.bad { color: #c0665a; font-weight: 700; }
.kpis { display: flex; gap: 10px; flex-wrap: wrap; margin: 6px 0; }
.kpi { background: var(--panel2, #f8f4ea); border: 1px solid var(--line, #e4d9bd); border-radius: 8px; padding: 6px 12px; font-size: 12px; }
.kpi b { font-size: 18px; display: block; }
.kpi.warn b { color: #c0665a; }
.weakbar { display: flex; align-items: center; gap: 8px; margin: 4px 0; font-size: 12px; }
.weakbar .tagname { width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.weakbar .bar { display: inline-block; height: 12px; background: var(--gold, #b5893c); border-radius: 3px; }
.grade-chip { color: #fff; padding: 1px 6px; border-radius: 3px; margin-right: 4px; font-size: 12px; background: #6f8fb5; }
.grade-chip[data-g='best'], .grade-chip[data-g='A'] { background: #c9a227; }
.grade-chip[data-g='good'], .grade-chip[data-g='B'] { background: #7da65a; }
.grade-chip[data-g='bad'], .grade-chip[data-g='D'] { background: #c0665a; }
ul.issues { max-height: 160px; overflow: auto; margin: 6px 0; padding-left: 18px; font-size: 12px; }
li.bad { color: #c0665a; }
button.danger { border-color: #c0665a; color: #c0665a; }
@media (max-width: 767px) { .trainer .cols { grid-template-columns: 1fr; } }
</style>
