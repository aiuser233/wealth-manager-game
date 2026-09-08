/**
 * P4 培训后台 · 讲师端聚合报表：
 * - 导入多份学员记录（fm-student-record JSON）
 * - 聚合出：通过率（按科目）、弱项知识地图、剧情抉择分布、活跃度、合规红线
 * - 生成自包含 HTML 报表（打印即 PDF），交给培训部门
 * 隐私：仅汇总数据 + 匿名编号；原始记录不出讲师本机。
 */
import type { StudentRecord, ExamRecordItem } from './lms';

export interface TeamAggregate {
  classSize: number;
  studentIds: string[];
  /** 按科目通过率 */
  passRate: Array<{ examName: string; attempts: number; passed: number; rate: number }>;
  /** 弱项知识地图（全班聚合，tag -> 人数） */
  weakMap: Array<{ tag: string; students: number; total: number }>;
  /** 剧情抉择分布（任务标题 -> grade 分布） */
  choiceDist: Array<{ quest: string; dist: Record<string, number>; bestRate: number }>;
  /** 活跃度：人均活跃游戏日 */
  avgActiveDays: number;
  /** 合规红线：有违规记录的人数 */
  violationStudents: number;
  /** 卷一主线人均完成章数 */
  avgQuests: number;
  /** 证书持有分布 */
  certDist: Array<{ cert: string; holders: number }>;
}

export function aggregateTeam(records: StudentRecord[]): TeamAggregate {
  const passAgg = new Map<string, { attempts: number; passed: number }>();
  const weakAgg = new Map<string, { students: Set<string>; total: number }>();
  const choiceAgg = new Map<string, { dist: Record<string, number> }>();
  const certAgg = new Map<string, number>();
  let totalActive = 0;
  let violations = 0;
  let totalQuests = 0;

  for (const r of records) {
    for (const e of r.exams) {
      const a = passAgg.get(e.examName) ?? { attempts: 0, passed: 0 };
      a.attempts += 1;
      if (e.passed) a.passed += 1;
      passAgg.set(e.examName, a);
    }
    for (const [tag, n] of Object.entries(r.weakTags)) {
      const a = weakAgg.get(tag) ?? { students: new Set<string>(), total: 0 };
      a.students.add(r.studentId);
      a.total += n;
      weakAgg.set(tag, a);
    }
    for (const c of r.choices) {
      const a = choiceAgg.get(c.questTitle) ?? { dist: {} as Record<string, number> };
      a.dist[c.grade] = (a.dist[c.grade] ?? 0) + 1;
      choiceAgg.set(c.questTitle, a);
    }
    for (const cert of r.certs) certAgg.set(cert, (certAgg.get(cert) ?? 0) + 1);
    totalActive += r.activeDays.length;
    if (r.violations > 0) violations += 1;
    totalQuests += r.questsDone;
  }

  return {
    classSize: records.length,
    studentIds: records.map((r) => r.studentId),
    passRate: [...passAgg.entries()]
      .map(([examName, a]) => ({ examName, attempts: a.attempts, passed: a.passed, rate: a.attempts ? a.passed / a.attempts : 0 }))
      .sort((x, y) => y.attempts - x.attempts),
    weakMap: [...weakAgg.entries()]
      .map(([tag, a]) => ({ tag, students: a.students.size, total: a.total }))
      .sort((x, y) => y.students - x.students)
      .slice(0, 15),
    choiceDist: [...choiceAgg.entries()]
      .map(([quest, a]) => {
        const sum = Object.values(a.dist).reduce((x, y) => x + y, 0);
        const best = (a.dist.best ?? 0) + (a.dist.A ?? 0);
        return { quest, dist: a.dist, bestRate: sum ? best / sum : 0 };
      })
      .sort((x, y) => Object.values(y.dist).reduce((a, b) => a + b, 0) - Object.values(x.dist).reduce((a, b) => a + b, 0)),
    avgActiveDays: records.length ? totalActive / records.length : 0,
    violationStudents: violations,
    avgQuests: records.length ? totalQuests / records.length : 0,
    certDist: [...certAgg.entries()]
      .map(([cert, holders]) => ({ cert, holders }))
      .sort((x, y) => y.holders - x.holders),
  };
}

/** 学员单科最好成绩（明细表用） */
export function bestScorePerStudent(records: StudentRecord[]): Array<{ studentId: string; best: Record<string, number> }> {
  return records.map((r) => {
    const best: Record<string, number> = {};
    for (const e of r.exams) {
      best[e.examName] = Math.max(best[e.examName] ?? 0, e.scorePct);
    }
    return { studentId: r.studentId, best };
  });
}

const GRADE_COLORS: Record<string, string> = {
  best: '#c9a227',
  good: '#7da65a',
  normal: '#6f8fb5',
  bad: '#c0665a',
  A: '#c9a227', B: '#7da65a', C: '#6f8fb5', D: '#c0665a',
};

/** 聚合报表 → 自包含 HTML（打印即 PDF） */
export function teamReportHtml(agg: TeamAggregate, className: string, exportedAt: string): string {
  const pct = (x: number) => `${(x * 100).toFixed(0)}%`;
  const passRows = agg.passRate
    .map((p) => `<tr><td>${esc(p.examName)}</td><td>${p.attempts}</td><td>${p.passed}</td><td><b style="color:${p.rate >= 0.7 ? '#5a8a4a' : '#c0665a'}">${pct(p.rate)}</b></td></tr>`)
    .join('');
  const weakRows = agg.weakMap
    .map((w, i) => {
      const barW = Math.round((w.students / Math.max(1, agg.weakMap[0]?.students ?? 1)) * 200);
      return `<tr><td>${i + 1}. ${esc(w.tag)}</td><td><span style="display:inline-block;height:14px;background:#b5893c;width:${barW}px"></span></td><td>${w.students} 人 / 共 ${w.total} 错次</td></tr>`;
    })
    .join('');
  const choiceRows = agg.choiceDist
    .map((c) => {
      const total = Object.values(c.dist).reduce((a, b) => a + b, 0);
      const segs = Object.entries(c.dist)
        .map(([g, n]) => `<span style="background:${GRADE_COLORS[g] ?? '#999'};color:#fff;padding:1px 6px;border-radius:3px;margin-right:4px">${esc(g)}×${n}</span>`)
        .join('');
      return `<tr><td>${esc(c.quest)}</td><td>${segs}</td><td>最优率 ${pct(c.bestRate)}</td><td>${total} 次</td></tr>`;
    })
    .join('');
  const certRows = agg.certDist.map((c) => `<tr><td>${esc(c.cert)}</td><td>${c.holders} / ${agg.classSize}</td></tr>`).join('');
  return `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8"><title>${esc(className)} · 团队学习报表</title>
<style>
body{font-family:"Microsoft YaHei",sans-serif;color:#222;margin:32px auto;max-width:880px;line-height:1.6}
h1{border-bottom:3px solid #b5893c;padding-bottom:8px} h2{margin-top:28px;border-left:4px solid #b5893c;padding-left:10px}
table{width:100%;border-collapse:collapse;margin-top:8px} td,th{border:1px solid #ddd;padding:6px 10px;text-align:left}
th{background:#f5efe2} .kpis{display:flex;gap:14px;flex-wrap:wrap;margin:14px 0}
.kpi{background:#f8f4ea;border:1px solid #e4d9bd;border-radius:8px;padding:10px 16px}
.kpi b{font-size:22px;display:block} .dim{color:#888;font-size:12px}
@media print{body{margin:8mm}}
</style></head><body>
<h1>${esc(className)} · 团队学习报表</h1>
<p class="dim">生成时间 ${esc(exportedAt)} ｜ 数据来源：学员本地学习记录（匿名编号），仅聚合统计 ｜ 《重生之我是理财经理》培训后台</p>
<div class="kpis">
  <div class="kpi"><b>${agg.classSize}</b>学员数</div>
  <div class="kpi"><b>${agg.avgActiveDays.toFixed(1)}</b>人均活跃游戏日</div>
  <div class="kpi"><b>${agg.avgQuests.toFixed(1)}</b>人均主线章数</div>
  <div class="kpi"><b style="color:${agg.violationStudents === 0 ? '#5a8a4a' : '#c0665a'}">${agg.violationStudents}</b>有合规违规记录</div>
</div>
<h2>一、考证通过率（按科目）</h2>
<table><tr><th>科目</th><th>报考人次</th><th>通过人次</th><th>通过率</th></tr>${passRows || '<tr><td colspan=4 class=dim>暂无考试数据</td></tr>'}</table>
<h2>二、弱项知识地图（错题知识点 Top 15）</h2>
<table><tr><th>知识点</th><th colspan=2>波及学员 / 错题量</th></tr>${weakRows || '<tr><td colspan=3 class=dim>暂无错题数据</td></tr>'}</table>
<h2>三、剧情抉择分布（态度数据）</h2>
<table><tr><th>任务</th><th>抉择分布</th><th>最优率</th><th>总次数</th></tr>${choiceRows || '<tr><td colspan=4 class=dim>暂无剧情数据</td></tr>'}</table>
<h2>四、证书持有</h2>
<table><tr><th>证书</th><th>持有数</th></tr>${certRows || '<tr><td colspan=2 class=dim>暂无证书</td></tr>'}</table>
<p class="dim">本报表由虚构培训游戏《重生之我是理财经理》生成，所有机构、行情均为架空创作，不构成任何投资建议。</p>
</body></html>`;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** 校验导入文件是否为合法学员记录 */
export function parseStudentRecord(raw: string): StudentRecord | { error: string } {
  try {
    const d = JSON.parse(raw);
    if (d?.schema !== 'fm-student-record' || typeof d.studentId !== 'string') {
      return { error: '不是有效的学员学习记录（schema 不匹配）' };
    }
    if (!Array.isArray(d.exams)) d.exams = [];
    if (!Array.isArray(d.choices)) d.choices = [];
    if (!Array.isArray(d.activeDays)) d.activeDays = [];
    if (typeof d.weakTags !== 'object' || !d.weakTags) d.weakTags = {};
    return d as StudentRecord;
  } catch {
    return { error: 'JSON 解析失败' };
  }
}

export type { ExamRecordItem };
