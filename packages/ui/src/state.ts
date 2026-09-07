import { reactive, computed } from 'vue';
import {
  GameCalendar, MarketSim, Game, Rng, Reception,
  type MarketSnapshot, type IsoDate, type ActionResult, type ActionType,
  type TimeFrame, type ExamPaper, type ExamResult, type ReceptionSession, type ExamQuestion,
  buildPaper, gradePaper, EXAM_DEFS,
} from '@fm/core';
import { contentBundle, eraDrift, eraLevel, randomEvents, examBankAll } from '@fm/content';

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

  /** 接待对话（进行中的会话） */
  reception: null as ReceptionSession | null,
  /** 对话日志（客户/玩家） */
  receptionLog: [] as Array<{ who: 'client' | 'me' | 'sys'; text: string }>,
  /** 已揭示的真实需求 */
  receptionRevealed: false,
  /** 待推荐的金额 */
  receptionAmount: 0,
  /** 通用弹窗（晋升/事件/月度结算） */
  modal: null as null | { kind: 'promotion' | 'month' | 'event'; payload?: any },
});

let game: Game;
/** 读档替换用的引用容器 */
const gameRef: { current: Game | null } = { current: null };

export function getGame(): Game {
  return gameRef.current ?? game;
}

export function newGame(seed: number, name: string, gender: 'm' | 'f') {
  const sim = new MarketSim(
    contentBundle.factors, contentBundle.industries, contentBundle.events,
    contentBundle.releases, cal, seed, eraDrift, eraLevel,
  );
  game = new Game(sim, cal, seed, contentBundle.clients);
  gameRef.current = game;
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
  // 注入随机事件池
  game.injectEvents(randomEvents as any, new Rng(seed ^ 0x5f3759df));
  // 自动存档（新开局覆盖 1 号自动档）
  try { localStorage.setItem('fm_save_0', serializeNow()); } catch { /* 存储满等异常忽略 */ }
  pushLog(`${game.player.name} 重生回到 2006 年 1 月，成为汇诚银行城东支行的见习理财经理。今天是你入职的第一天。`);
}

/** 当前游戏状态序列化（自动存档用） */
function serializeNow(): string {
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
    news: state.news.slice(0, 30),
    log: state.log.slice(0, 60),
  });
}

export const gameReady = computed(() => state.started && (gameRef.current !== null || typeof game !== 'undefined'));

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
  // 帧末掷骰随机事件（中断日也掷，UI 弹窗决策）
  const ev = game.rollRandomEvent();
  if (ev) state.modal = { kind: 'event', payload: ev };
  return res.daysAdvanced;
}

/** 玩家对随机事件做出选择 */
export function resolveEventChoice(choiceIdx?: number) {
  game.resolveEvent(choiceIdx);
  state.modal = null;
  // 月初自动存档钩子：事件结算后落一个自动档
  try { localStorage.setItem('fm_save_1', serializeNow()); } catch { /* 忽略 */ }
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
  const paper = buildPaper(exam, examBankAll, rngExam);
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
  pushWrongQuestions(state.examPaper, res.perQuestion);
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

// ================= 错题本与每日一题 =================

export interface WrongQuestion {
  questionId: string;
  examName: string;
  stem: string;
  correctAnswer: string;
  explanation: string;
  wrongAt: string;
}

/** 错题本（按 questionId 去重） */
export function wrongBook(): WrongQuestion[] {
  const raw = localStorage.getItem('fm_wrong_book');
  return raw ? JSON.parse(raw) : [];
}

function pushWrongQuestions(paper: ExamPaper, per: number[]) {
  const book = wrongBook();
  const exam = EXAM_DEFS.find((e) => e.id === paper.examId);
  paper.questions.forEach((q, i) => {
    if (per[i] >= 1 || book.some((w) => w.questionId === q.id)) return;
    book.unshift({
      questionId: q.id,
      examName: exam?.name ?? '',
      stem: q.stem,
      correctAnswer: q.type === 'multiple' ? (q.answer as number[]).map((x) => String.fromCharCode(65 + x)).join('、') : String.fromCharCode(65 + (q.answer as number)),
      explanation: q.explanation,
      wrongAt: game.date,
    });
  });
  localStorage.setItem('fm_wrong_book', JSON.stringify(book.slice(0, 200)));
}

/** 每日一题（按日期确定性抽取，情绪加成） */
export function dailyQuestion(): { q: ExamQuestion; done: boolean } | null {
  const pool = examBankAll.filter((q) => q.subject === 'exam_bank_law' || q.subject === 'exam_bank_pf');
  if (pool.length === 0) return null;
  const dateKey = Number(game.date.replace(/-/g, ''));
  const idx = dateKey % pool.length;
  const done = localStorage.getItem(`fm_daily_${game.date}`) === '1';
  return { q: pool[idx], done };
}

/** 完成每日一题（答对给情绪加成） */
export function finishDaily(correct: boolean): string {
  localStorage.setItem(`fm_daily_${game.date}`, '1');
  if (correct) {
    game.player.attrs.stress = Math.max(0, game.player.attrs.stress - 2);
    game.player.attrs.pro += 0.3;
    pushLog('【每日一题】答对了！神清气爽（压力 -2，专业力 +0.3）。');
    return '答对了！神清气爽，压力 -2。';
  }
  game.player.attrs.stress += 1;
  pushLog('【每日一题】答错了……记入错题本（压力 +1）。');
  return '答错了，已记入错题本。下次一定！';
}

// ================= 接待对话 =================

let receptionEngine: Reception | null = null;

/** 开始接待（消耗 AP 由调用方控制；这里只生成会话） */
export function startReception(): boolean {
  const g = getGame();
  if (state.apUsed >= state.apMax) return false;
  receptionEngine ??= new Reception(g.rng);
  const s = receptionEngine.start(g.clients);
  if (!s) return false;
  state.reception = s;
  state.receptionRevealed = false;
  state.receptionAmount = Math.max(10000, Math.round(s.pool * s.need.intentRatio / 10000) * 10000);
  state.receptionLog = [
    { who: 'client', text: s.need.surface },
  ];
  return true;
}

/** 挖潜 */
export function probeReception(probeIdx: number) {
  const s = state.reception;
  if (!s || !receptionEngine) return;
  const r = receptionEngine.probe(s, probeIdx);
  state.receptionLog.push({ who: 'me', text: s.need.probes[probeIdx].text });
  state.receptionLog.push({ who: 'client', text: r.reply });
  s.trustGained += 0; // probe 内部已累计
  if (s.revealed && !state.receptionRevealed) {
    state.receptionRevealed = true;
    state.receptionLog.push({ who: 'sys', text: `【诊断】${s.need.hidden}` });
  }
}

/** 放弃接待 */
export function cancelReception() {
  const g = getGame();
  if (state.reception) {
    const c = g.clients.find((x) => x.id === state.reception!.clientId);
    if (c) c.trust = Math.max(0, c.trust - 2);
  }
  state.reception = null;
  state.receptionLog = [];
}

/** 推荐产品并成交 */
export function recommendReception(productId: string) {
  const s = state.reception;
  const g = getGame();
  if (!s || !receptionEngine) return;
  const product = g.products.find((p) => p.id === productId);
  const client = g.clients.find((c) => c.id === s.clientId);
  if (!product || !client) return;
  const evalRes = receptionEngine.evaluate(s, product, client, state.receptionAmount);
  state.receptionLog.push({ who: 'me', text: `我推荐了「${product.name}」，建议投入 ${fmtMoneyCN(state.receptionAmount)}。` });
  state.receptionLog.push({ who: 'client', text: evalRes.reason });
  if (evalRes.deal) {
    const res = g.executeDeal(client, product, state.receptionAmount);
    state.receptionLog.push({ who: 'sys', text: res.ok ? `✓ 成交！AUM +${fmtMoneyCN(state.receptionAmount)}` : `✗ ${res.reason}` });
  }
  // 信任结算（挖潜收益 + 推荐反馈）
  client.trust = Math.max(0, Math.min(100, client.trust + s.trustGained * 0.5 + evalRes.trustDelta));
  // 结束会话
  state.reception = null;
}

function fmtMoneyCN(n: number): string {
  if (n >= 100000000) return `${(n / 100000000).toFixed(2)} 亿`;
  if (n >= 10000) return `${(n / 10000).toFixed(1)} 万`;
  return `${Math.round(n)}`;
}

// ================= 存档系统 =================

/** 从存档 JSON 恢复游戏（引擎状态机重放到 cursor） */
export function loadGameFromSave(data: any) {
  const sim = new MarketSim(
    contentBundle.factors, contentBundle.industries, contentBundle.events,
    contentBundle.releases, cal, data.seed ?? 42, eraDrift, eraLevel,
  );
  const g = new Game(sim, cal, data.seed ?? 42, contentBundle.clients);
  g.products = contentBundle.products;
  // 重放市场状态机
  const target = data.market?.cursor ?? 0;
  while (sim.cursor < target) sim.stepToNext();
  // 直接覆盖数值状态（存档里的状态优先，重放保证一致性）
  if (data.market?.factorState) Object.assign(sim.factorState, data.market.factorState);
  if (data.market?.industryState) Object.assign(sim.industryState, data.market.industryState);
  if (data.market?.indicesState) Object.assign(sim.indicesState, data.market.indicesState);
  if (typeof data.market?.sentiment === 'number') sim.sentiment = data.market.sentiment;
  // 玩家
  if (data.player) {
    Object.assign(g.player, data.player);
    g.player.attrs = { ...data.player.attrs };
    g.player.certs = data.certs ?? data.player.certs ?? [];
  }
  if (data.kpi) Object.assign(g.kpi, data.kpi);
  if (Array.isArray(data.monthScores)) g.monthScores = [...data.monthScores];
  if (typeof data.memoryUses === 'number') g.memoryUses = data.memoryUses;
  if (data.frame) { g.frame = data.frame; g.apMax = data.frame === 'month' ? 36 : data.frame === 'week' ? 10 : 4; }
  if (typeof data.forceDayDays === 'number') g.forceDayDays = data.forceDayDays;
  if (typeof data.apUsed === 'number') g.apUsed = data.apUsed;
  if (typeof data.violations === 'number') g.violations = data.violations;
  if (Array.isArray(data.clients)) {
    for (const sc of data.clients) {
      const gc = g.clients.find((x) => x.id === sc.id);
      if (gc) {
        gc.holdings = (sc.holdings ?? []).map((h: any) => ({ ...h }));
        gc.trust = sc.trust ?? gc.trust;
        gc.status = sc.status ?? 'active';
      }
    }
  }
  // 替换全局 game 引用：通过 newGame 重建再覆盖（简单可靠）
  state.started = true;
  state.news = Array.isArray(data.news) ? data.news : [];
  state.log = Array.isArray(data.log) ? data.log : [];
  state.todayActions = [];
  state.apUsed = g.apUsed;
  state.apMax = g.apMax;
  state.lastSnap = null;
  state.baseSnap = { day: null, week: null, month: null, since_view: null };
  state.selectedClientId = g.clients[0]?.id ?? '';
  state.memoryHint = '';
  state.reception = null;
  state.receptionLog = [];
  // 重建 game 实例挂载（模块级 game 变量）
  replaceGame(g);
  state.seed = data.seed ?? 42;
  pushLog(`【读档】已恢复到 ${g.date} 的进度。`);
}

/** 模块内 game 引用替换 */
function replaceGame(g: Game) {
  gameRef.current = g;
  game = g;
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
