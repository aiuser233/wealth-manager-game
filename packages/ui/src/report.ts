import type { Game, QuestEngine } from '@fm/core';
import { GRADE_NAMES } from '@fm/core';

/**
 * 学习报告导出（P2，规划 4）：
 * 生成自包含 HTML（内联样式 + 打印分页），浏览器另存为 PDF 即可交给培训部门。
 * 内容四块：考证记录 / 错题图谱 / 生涯大事记 / 合规记录。
 */

export interface ReportData {
  playerName: string;
  generatedAt: string;
  gameDate: string;
  grade: string;
  certs: string[];
  weakSpots: Array<{ tag: string; count: number }>;
  wrongTotal: number;
  wrongCorrected: number;
  careerLog: Array<{ date: string; title: string; grade: string }>;
  lifeLog: Array<{ date: string; text: string }>;
  violations: number;
  examAttempts: number;
  kpiLine: Array<{ month: string; score: number }>;
  aum: string;
}

export function buildReport(g: Game, extras: {
  weakSpots: Array<{ tag: string; count: number }>;
  wrongTotal: number;
  wrongCorrected: number;
  examAttempts: number;
  lifeLog: Array<{ date: string; text: string }>;
  questEngine?: QuestEngine | null;
}): ReportData {
  return {
    playerName: g.player.name,
    generatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    gameDate: g.date,
    grade: GRADE_NAMES[g.player.grade] ?? '见习理财经理',
    certs: [...g.player.certs],
    weakSpots: extras.weakSpots,
    wrongTotal: extras.wrongTotal,
    wrongCorrected: extras.wrongCorrected,
    examAttempts: extras.examAttempts,
    careerLog: extras.questEngine?.careerLog?.map((c) => ({ ...c })) ?? [],
    lifeLog: extras.lifeLog,
    violations: g.violations,
    kpiLine: g.monthScores.map((s, i) => ({ month: `第 ${i + 1} 月`, score: s })),
    aum: fmtAum(g.player.aum),
  };
}

function fmtAum(n: number): string {
  if (n >= 100000000) return `${(n / 100000000).toFixed(2)} 亿`;
  if (n >= 10000) return `${(n / 10000).toFixed(1)} 万`;
  return `${Math.round(n)} 元`;
}

/** 生成自包含 HTML 报告（打印即 PDF） */
export function reportHtml(d: ReportData): string {
  const gradeTag = d.grade;
  const weakRows = d.weakSpots.length
    ? d.weakSpots.map((w) => `<tr><td>${esc(w.tag)}</td><td class="num">${w.count}</td></tr>`).join('')
    : '<tr><td colspan="2" class="dim">暂无错题记录——继续保持。</td></tr>';
  const certList = d.certs.length
    ? d.certs.map((c) => `<span class="chip">${esc(c)}</span>`).join(' ')
    : '<span class="dim">暂未获得证书。</span>';
  const careerRows = d.careerLog.length
    ? d.careerLog.map((c) => `<tr><td>${esc(c.date)}</td><td>${esc(c.title)}</td><td>${esc(c.grade)}</td></tr>`).join('')
    : '<tr><td colspan="3" class="dim">剧情尚未推进。</td></tr>';
  const lifeRows = d.lifeLog.length
    ? d.lifeLog.map((c) => `<p><span class="dim">${esc(c.date)}</span> ${esc(c.text.slice(0, 80))}${c.text.length > 80 ? '…' : ''}</p>`).join('')
    : '<p class="dim">人生线尚未触发。</p>';
  const kpiCells = d.kpiLine.length
    ? d.kpiLine.map((k) => `<span class="chip ${k.score >= 80 ? 'good' : k.score >= 60 ? 'mid' : 'bad'}">${k.month}：${k.score}</span>`).join(' ')
    : '<span class="dim">暂无月度结算。</span>';
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><title>学习报告 · ${esc(d.playerName)}</title>
<style>
  body { font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif; color: #1c2333; max-width: 800px; margin: 24px auto; padding: 0 20px; line-height: 1.7; }
  h1 { font-size: 22px; border-bottom: 3px solid #2f5fbf; padding-bottom: 8px; }
  h2 { font-size: 16px; margin: 22px 0 8px; color: #2f5fbf; border-left: 4px solid #2f5fbf; padding-left: 8px; }
  .meta { color: #6b7385; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { border: 1px solid #d5dbe8; padding: 5px 9px; text-align: left; }
  th { background: #eef2fa; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .dim { color: #949cb0; }
  .chip { display: inline-block; border: 1px solid #d5dbe8; border-radius: 12px; padding: 1px 10px; margin: 2px 4px 2px 0; font-size: 12px; background: #f5f7fc; }
  .chip.good { border-color: #2e9e5b; color: #2e9e5b; }
  .chip.mid { border-color: #c98a1c; color: #c98a1c; }
  .chip.bad { border-color: #c24545; color: #c24545; }
  .cards { display: flex; gap: 10px; flex-wrap: wrap; }
  .card { flex: 1; min-width: 150px; border: 1px solid #d5dbe8; border-radius: 8px; padding: 10px 14px; background: #f8fafd; }
  .card b { font-size: 20px; display: block; }
  .card span { font-size: 12px; color: #6b7385; }
  .warn { color: #c24545; font-weight: 600; }
  .ok { color: #2e9e5b; font-weight: 600; }
  .foot { margin-top: 28px; border-top: 1px solid #d5dbe8; padding-top: 10px; font-size: 11px; color: #949cb0; }
  @media print { body { margin: 0; } }
</style></head><body>
<h1>《重生之我是理财经理》学习报告</h1>
<p class="meta">学员：${esc(d.playerName)} ｜ 当前职级：${esc(gradeTag)} ｜ 游戏内进度：${esc(d.gameDate)} ｜ AUM：${esc(d.aum)}<br>报告生成时间：${esc(d.generatedAt)}</p>

<div class="cards">
  <div class="card"><b>${d.certs.length}</b><span>已获证书</span></div>
  <div class="card"><b>${d.examAttempts}</b><span>考试场次</span></div>
  <div class="card"><b>${d.wrongTotal}</b><span>错题累计</span></div>
  <div class="card"><b class="${d.violations > 0 ? 'warn' : 'ok'}">${d.violations}</b><span>合规违规次数</span></div>
</div>

<h2>一、考证记录</h2>
<p>${certList}</p>

<h2>二、错题图谱（弱项知识 Top 10）</h2>
<table><thead><tr><th>知识标签</th><th style="text-align:right">错题数</th></tr></thead><tbody>${weakRows}</tbody></table>
<p class="dim">错题累计 ${d.wrongTotal} 道${d.wrongCorrected > 0 ? `，其中 ${d.wrongCorrected} 道在后续考试答对（系统自动追踪）` : ''}。</p>

<h2>三、生涯大事记（剧情抉择）</h2>
<table><thead><tr><th>日期</th><th>章节</th><th>评价</th></tr></thead><tbody>${careerRows}</tbody></table>

<h2>四、客户人生线（关怀轨迹）</h2>
${lifeRows}

<h2>五、月度绩效轨迹</h2>
<p>${kpiCells}</p>

<h2>六、合规记录</h2>
<p>${d.violations === 0 ? '<span class="ok">✓ 无违规记录。</span>' : `<span class="warn">⚠ 违规 ${d.violations} 次。</span> 违规会记入终身档案并影响晋升评审——培训重点是"知道红线在哪"。`}</p>

<p class="foot">本报告由《重生之我是理财经理》培训版自动生成。游戏为虚构作品：机构、人物、行情均以公开历史为蓝本架空改编，不构成任何投资建议；题库参考真实考试公开大纲原创改编。仅供培训学习使用。</p>
</body></html>`;
}

function esc(s: string): string {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** 触发浏览器下载（另存为 / 直接打印为 PDF） */
export function downloadReport(html: string, filename: string) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, '_blank');
  // 同时落一份本地文件，浏览器拦截弹窗时仍有兜底
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  if (w) setTimeout(() => URL.revokeObjectURL(url), 30000);
}
