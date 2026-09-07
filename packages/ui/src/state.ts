import { reactive, computed } from 'vue';
import {
  GameCalendar, MarketSim, Game, Rng,
  type MarketSnapshot, type IsoDate, type ActionResult, type ActionType,
  type TimeFrame, type ExamPaper, type ExamResult, buildPaper, gradePaper, EXAM_DEFS,
} from '@fm/core';
import { contentBundle, eraDrift, eraLevel, examBank } from '@fm/content';

export interface NewsItem { date: IsoDate; title: string; body: string }
export interface LogItem { date: IsoDate; text: string }

/** 行情终端的"距上次查看"口径 */
export type QuoteScope = 'day' | 'week' | 'month' | 'since_view';

const cal = new GameCalendar('2006-01-02', '2025-12-31');

export const state = reactive({
  screen: 'workbench' as 'workbench' | 'market' | 'clients' | 'help',
  started: false,
  seed: 42,
  playerSeedText: '',

  /** 今日行动点 */
  apUsed: 0,
  apMax: 4,
  /** 今日行动记录 */
  todayActions: [] as Array<{ name: string; text: string }>,

  news: [] as NewsItem[],
  log: [] as LogItem[],

  lastSnap: null as MarketSnapshot | null,
  /** 各口径的基准快照 */
  baseSnap: { day: null as MarketSnapshot | null, week: null as MarketSnapshot | null, month: null as MarketSnapshot | null, since_view: null as MarketSnapshot | null },
  quoteScope: 'since_view' as QuoteScope,

  selectedClientId: '' as string,
  lastResult: '' as string,

  /** 考试系统 */
  examScreen: 'list' as 'list' | 'taking' | 'result',
  examPaper: null as ExamPaper | null,
  examAnswers: [] as Array<number | number[]>,
  examResult: null as ExamResult | null,
  examIdx: 0,
  examSecondsLeft: 0,
  examTimer: 0 as ReturnType<typeof setInterval> | 0,

  /** 金手指记忆 */
  memoryHint: '' as string,
});

let game: Game;

export function newGame(seed: number, name: string, gender: 'm' | 'f') {
  const sim = new MarketSim(
    contentBundle.factors, contentBundle.industries, contentBundle.events,
    contentBundle.releases, cal, seed, eraDrift, eraLevel,
  );
  game = new Game(sim, cal, seed, contentBundle.clients);
  game.products = contentBundle.products;
  game.player.name = name || '林奇安';
  game.player.gender = gender;
  game.hooks.onNews = (n) => state.news.unshift(n);
  game.hooks.onRelease = (r) => {
    const def = contentBundle.releases.find((x) => x.name === r.name);
    state.news.unshift({
      date: r.date,
      title: `${def?.region === 'us' ? '海外' : 'A 国'}数据公布：${r.name}`,
      body: `实际值 ${r.actual.toFixed(2)}，预期 ${r.expect.toFixed(2)}，${r.beat ? '超预期' : '不及预期'}。`,
    });
  };
  state.started = true;
  state.news = [];
  state.log = [];
  state.todayActions = [];
  state.apUsed = 0;
  state.lastSnap = null;
  state.baseSnap = { day: null, week: null, month: null, since_view: null };
  state.selectedClientId = game.clients[0]?.id ?? '';
  refreshCaches();
  pushLog(`${game.player.name} 重生回到 2006 年 1 月，成为汇诚银行城东支行的见习理财经理。今天是你入职的第一天。`);
}

export function getGame(): Game {
  return game;
}

export const gameReady = computed(() => state.started && !!game);

function refreshCaches() {
  state.lastSnap = game.lastSnap;
  state.apUsed = game.apUsed;
  state.apMax = game.apMax;
  // 各口径基准：当日=昨收；周=上周五；月=上月末；since_view=上次查看
  const d = game.date;
  const weekDays = cal.tradingDaysOfWeek(d);
  const monthDays = cal.tradingDaysOfMonth(d);
  const dayBase = game.sim.cursor >= 2 ? game.sim.at?.(game.sim.cursor - 2) : undefined;
  state.baseSnap.day = dayBase ?? null;
  state.baseSnap.week = state.baseSnap.week && weekDays.includes(state.baseSnap.week.date) ? state.baseSnap.week : null;
  state.baseSnap.month = state.baseSnap.month && monthDays.includes(state.baseSnap.month.date) ? state.baseSnap.month : null;
  void monthDays;
}

/** sim 快照缓存（用于口径基准）——用简单 Map 缓存最近快照 */
declare module '@fm/core' {
  interface MarketSim {
    at?(i: number): MarketSnapshot | null;
  }
}

const snapCache: Map<number, MarketSnapshot> = new Map();
export function cacheSnap(s: MarketSnapshot, cursorBefore: number) {
  snapCache.set(cursorBefore, s);
  if (snapCache.size > 400) {
    const first = snapCache.keys().next().value;
    if (first !== undefined) snapCache.delete(first);
  }
}
export function snapAt(cursorBefore: number): MarketSnapshot | null {
  return snapCache.get(cursorBefore) ?? null;
}

export function advanceDays(n: number) {
  for (let i = 0; i < n; i++) {
    const before = game.sim.cursor;
    game.advanceDays(1);
    if (game.lastSnap) cacheSnap(game.lastSnap, before);
  }
  state.todayActions = [];
  state.apUsed = game.apUsed;
  state.lastSnap = game.lastSnap;
  if (state.baseSnap.since_view) {
    // 保留"距上次查看"基准，直到玩家手动刷新
  } else if (game.lastSnap) {
    state.baseSnap.since_view = game.lastSnap;
  }
}

export function doAction(type: ActionType, name: string): ActionResult {
  const r = game.doAction(type);
  state.apUsed = game.apUsed;
  state.todayActions.push({ name, text: r.text });
  state.lastResult = r.text;
  if (r.income_delta) pushLog(`[${game.date}] ${r.text}`);
  return r;
}

/** 切换时间帧 */
export function switchFrame(f: TimeFrame): boolean {
  const ok = game.setFrame(f);
  if (ok) {
    state.apUsed = game.apUsed;
    state.todayActions = [];
  }
  return ok;
}

/** 金手指：调用记忆碎片 */
export function useMemoryHint() {
  const r = game.useMemory();
  state.memoryHint = r.hint;
  return r;
}

/** 按当前帧推进一个回合（日=1 天，周=5 天，月=至月末） */
export function advanceFrame(daysOverride?: number): number {
  const res = game.advanceFrame(daysOverride);
  state.apUsed = game.apUsed;
  state.todayActions = [];
  state.lastSnap = game.lastSnap;
  for (const s of res.snaps) cacheSnap(s, 0);
  if (res.interrupted) {
    pushLog(`【中断】${res.interruptDate} ${res.interruptEvent?.title}——切换为日帧处理。`);
  }
  return res.daysAdvanced;
}

export function pushLog(text: string) {
  state.log.unshift({ date: game.date, text });
  if (state.log.length > 200) state.log.pop();
}

export function markViewed() {
  if (game.lastSnap) state.baseSnap.since_view = game.lastSnap;
}

// ================= 考试系统 =================

/** 当前可报名的科目（按年份解锁） */
export function availableExams() {
  const y = Number(game.date.slice(0, 4));
  return EXAM_DEFS.filter((e) => y >= e.unlock_year);
}

/** 已获得的证书 */
export function myCerts(): string[] {
  return game.player.certs;
}

let rngExam: Rng | null = null;

/** 开始一场考试：抽卷并进入答题界面 */
export function startExam(examId: string): boolean {
  const exam = EXAM_DEFS.find((e) => e.id === examId);
  if (!exam) return false;
  if (game.player.certs.includes(exam.name)) return false;
  rngExam ??= new Rng(game.rngNextInt());
  const paper = buildPaper(exam, examBank, rngExam);
  state.examPaper = paper;
  state.examAnswers = paper.questions.map((q) => (q.type === 'multiple' ? [] : -1));
  state.examIdx = 0;
  state.examResult = null;
  state.examScreen = 'taking';
  state.examSecondsLeft = exam.time_limit_sec;
  if (state.examTimer) clearInterval(state.examTimer);
  state.examTimer = setInterval(() => {
    state.examSecondsLeft -= 1;
    if (state.examSecondsLeft <= 0) submitExam();
  }, 1000);
  return true;
}

export function submitExam() {
  if (!state.examPaper || state.examScreen !== 'taking') return;
  if (state.examTimer) { clearInterval(state.examTimer); state.examTimer = 0; }
  const res = gradePaper(state.examPaper, state.examAnswers);
  state.examResult = res;
  state.examScreen = 'result';
  const exam = EXAM_DEFS.find((e) => e.id === state.examPaper!.examId);
  if (res.passed && exam && !game.player.certs.includes(exam.name)) {
    game.player.certs.push(exam.name);
    game.player.attrs.pro += 5;
    pushLog(`【考证】通过「${exam.name}」考试（${res.scorePct.toFixed(1)} 分），证书已入库，专业力 +5。`);
  } else {
    pushLog(`【考证】「${exam?.name}」成绩 ${res.scorePct.toFixed(1)} 分，未通过。下季度再战。`);
  }
  game.player.energy = Math.max(0, game.player.energy - 20);
  game.player.attrs.stress += 8;
}

export function quitExam() {
  if (state.examTimer) { clearInterval(state.examTimer); state.examTimer = 0; }
  state.examScreen = 'list';
  state.examPaper = null;
}

/** 单选题作答 */
export function answerSingle(idx: number, opt: number) {
  state.examAnswers[idx] = opt;
}
/** 多选题作答（切换勾选） */
export function toggleMulti(idx: number, opt: number) {
  const cur = state.examAnswers[idx];
  const arr = Array.isArray(cur) ? [...cur] : [];
  const pos = arr.indexOf(opt);
  if (pos >= 0) arr.splice(pos, 1);
  else arr.push(opt);
  state.examAnswers[idx] = arr;
}

export function fmtPct(v: number | undefined): string {
  if (v === undefined || !isFinite(v)) return '--';
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
}

/** 当前帧的中文名 */
export function frameLabel(): string {
  const f = game?.frame ?? 'day';
  return f === 'day' ? '今日' : f === 'week' ? '本周' : '本月';
}

export function pctClass(v: number | undefined): string {
  if (v === undefined || !isFinite(v)) return 'dim';
  return v >= 0 ? 'up' : 'down';
}

export { cal, game as currentGame };
