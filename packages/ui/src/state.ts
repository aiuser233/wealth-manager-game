import { reactive, computed, ref } from 'vue';
import {
  GameCalendar, MarketSim, Game, Rng, Reception, QuestEngine,
  type MarketSnapshot, type IsoDate, type ActionResult, type ActionType,
  type TimeFrame, type ExamPaper, type ExamResult, type ReceptionSession, type ExamQuestion,
  type QuestDef, type LifeLineDef, judgeEnding, ENDINGS,
  type EndingId, type EndingInput,
  buildPaper, gradePaper, EXAM_DEFS,
} from '@fm/core';
import { contentBundle, eraDrift, eraLevel, randomEvents, examBankAll, VOLUME1_QUESTS, VOLUME2_QUESTS, VOLUME3_QUESTS, VOLUME4_QUESTS, VOLUME5_QUESTS, LIFELINES_ALL } from '@fm/content';
import { storage } from './storage';
import { recordExamAttempt, recordChoice, touchActiveDay } from './lms';
import { refreshAchievements, recordEnding } from './achievements';
import { packQuestions, passesReviewGate } from './packs';
import { TeamSystem } from '@fm/core';

export interface NewsItem { date: IsoDate; title: string; body: string }
export interface LogItem { date: IsoDate; text: string }

/** 行情终端的"距上次查看"口径 */
export type QuoteScope = 'day' | 'week' | 'month' | 'since_view';

const cal = new GameCalendar('2006-01-02', '2025-12-31');

export const state = reactive({
  screen: 'workbench' as 'workbench' | 'market' | 'clients' | 'help' | 'exam' | 'gallery' | 'system' | 'trainer' | 'lecturer' | 'team' | 'ach',
  started: false,
  seed: 42,
  playerSeedText: '',

  /** 今日行动点 */
  apUsed: 0,
  apMax: 4,
  /** 当前游戏日期（Game 实例字段非响应式，镜像到 state 供 UI 绑定） */
  gameDate: '----' as string,
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

  /** 主线剧情 */
  questEngine: null as QuestEngine | null,
  /** 剧情演出状态 */
  questDialog: null as null | { quest: QuestDef; idx: number; phase: 'dialogue' | 'choice' | 'result'; resultText?: string; resultGrade?: string },
  /** 人生线待确认 */
  lifeDialog: null as null | LifeLineDef,

  /** 结局闭环 v0：卷一结束的三维阶段评语 */
  volumeReview: null as null | { headline: string; lines: string[]; grades: Array<{ dim: string; grade: string; comment: string }> },

  /** P6 六结局：卷五末的完整结局画面（含周目/继承） */
  ending: null as null | { id: EndingId; def: typeof ENDINGS[EndingId]; summary: string[]; newGamePlus: boolean },
  /** 周目数（本局是第几周目；1=初见） */
  playthrough: 1,
  /** 二周目解锁（隐藏结局达成后置 true，跨局持久化在 storage） */
  ngPlusUnlocked: false,
  /** 二周目关键事件漂移：eventId -> 实际触发日期（仅 NG+ 局使用） */
  eventShifts: null as null | Record<string, IsoDate>,
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
  game.team = new TeamSystem();
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
  // P6 二周目：读取 NG+ 解锁标记与本局周目数（上周目通关 → playthrough+1）
  state.ngPlusUnlocked = storage.get('fm_ngplus') === '1';
  const lastPt = Number(storage.get('fm_playthrough') ?? 0);
  state.playthrough = lastPt >= 1 ? lastPt + 1 : 1;
  state.eventShifts = null;
  if (state.playthrough >= 2) {
    // 二周目：关键事件 ±1 季度漂移（按 seed 确定性漂移，同 seed 同漂移）
    state.eventShifts = computeEventShifts(seed);
    pushLog(`【第 ${state.playthrough} 周目】前世的记忆出现了偏差——关键事件的时间不再完全重演（±1 季度漂移）。这一世，靠专业，不靠背版。`);
  }
  refreshCaches();
  // 注入随机事件池
  game.injectEvents(randomEvents as any, new Rng(seed ^ 0x5f3759df));
  // 初始化主线剧情引擎（卷一）
  initQuestEngine(seed);
  // 自动存档（新开局覆盖 1 号自动档）
  storage.set('fm_save_0', serializeNow());
  // 新手引导（跳过条件：本浏览器已完成过）
  startTutorial();
  pushLog(`${game.player.name} 重生回到 2006 年 1 月，成为汇诚银行城东支行的见习理财经理。今天是你入职的第一天。`);
}

/** 当前游戏状态序列化（v2：含接待/考试/剧情 pending/K线历史，手动存档与自动档共用） */
export function serializeNow(): string {
  const g = getGame();
  return JSON.stringify({
    version: 2,
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
    highStressMonths: g.highStressMonths,
    coachLevel: g.coachLevel,
    team: g.team?.serialize() ?? null,
    market: {
      factorState: { ...g.sim.factorState },
      industryState: { ...g.sim.industryState },
      indicesState: { ...g.sim.indicesState },
      sentiment: g.sim.sentiment,
      cursor: g.sim.cursor,
    },
    /** K 线历史（snapHistory 环形缓冲） */
    snapHistory: g.snapHistory.slice(-120),
    clients: g.clients.map((c) => ({ ...c, holdings: c.holdings.map((h) => ({ ...h })) })),
    news: state.news.slice(0, 30),
    log: state.log.slice(0, 60),
    /** 剧情进度（含进行中任务、生涯日志） */
    quest: state.questEngine?.serialize() ?? null,
    /** P6 周目与事件漂移 */
    playthrough: state.playthrough,
    eventShifts: state.eventShifts,
    /** 接待会话中间态 */
    reception: state.reception ? { ...state.reception, need: state.reception.need } : null,
    receptionLog: state.reception ? state.receptionLog : [],
    receptionRevealed: state.receptionRevealed,
    receptionAmount: state.reception ? state.receptionAmount : 0,
    /** 考试进行态 */
    exam: state.examScreen === 'taking' && state.examPaper
      ? { paper: state.examPaper, answers: state.examAnswers, idx: state.examIdx, secondsLeft: state.examSecondsLeft }
      : null,
  });
}

export const gameReady = computed(() => state.started && (gameRef.current !== null || typeof game !== 'undefined'));

function refreshCaches() {
  state.lastSnap = game.lastSnap;
  state.apUsed = game.apUsed;
  state.apMax = game.apMax;
  state.gameDate = game.date;
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
  state.gameDate = game.date;
  if (state.baseSnap.since_view) {
    // 保留"距上次查看"基准，直到玩家手动刷新
  } else if (game.lastSnap) {
    state.baseSnap.since_view = game.lastSnap;
  }
}

export function doAction(type: ActionType, name: string): ActionResult {
  const r = game.doAction(type);
  state.apUsed = game.apUsed;
  state.gameDate = game.date;
  state.todayActions.push({ name, text: r.text });
  state.lastResult = r.text;
  touchActiveDay(game.date);
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

/** 市场波动降帧提示（粗帧+玄商300 单日 |收益|>3% 或持仓客户均浮亏 >8% 时建议降帧） */
function volatilityHint(): string | null {
  const g = getGame();
  if (g.frame === 'day' || !g.lastSnap) return null;
  const hist = g.snapHistory;
  if (hist.length >= 2) {
    const prev = hist[hist.length - 2].indices['idx_300'];
    const cur = g.lastSnap.indices['idx_300'];
    if (prev > 0 && Math.abs(cur / prev - 1) > 0.03) {
      return `【提示】玄商 300 单日波动超 3%（${((cur / prev - 1) * 100).toFixed(1)}%）。建议切回日帧逐日应对。`;
    }
  }
  // 持仓客户浮亏检查
  const holding = g.clients.filter((c) => c.status === 'active' && c.holdings.length > 0);
  if (holding.length > 0) {
    const losses = holding.map((c) => {
      const pv = g.clientPortfolioValue(c.id);
      const cost = c.holdings.reduce((s, h) => s + h.amount, 0);
      return cost > 0 ? pv / cost - 1 : 0;
    });
    const avg = losses.reduce((a, b) => a + b, 0) / losses.length;
    if (avg < -0.08) {
      return `【提示】持仓客户平均浮亏 ${(avg * 100).toFixed(1)}%。建议切回日帧，逐一做安抚与归因。`;
    }
  }
  return null;
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
  state.gameDate = game.date;
  for (const s of res.snaps) cacheSnap(s, 0);
  if (res.interrupted) {
    pushLog(`【中断】${res.interruptDate} ${res.interruptEvent?.title}——切换为日帧处理。`);
  } else {
    // 市场驱动降帧提示（规划 3.3-3）：粗帧下波动超阈值时建议切日帧
    const hint = volatilityHint();
    if (hint) pushLog(hint);
  }
  // 主线剧情触发（优先于随机事件；二周目带日期漂移）
  if (state.questEngine) {
    const q = state.questEngine.checkQuests(game.date, state.eventShifts ?? undefined);
    if (q) {
      state.questDialog = { quest: q, idx: 0, phase: 'dialogue' };
      return res.daysAdvanced;
    }
    const life = state.questEngine.checkLifeNodes(game.date, (cid) => {
      const c = getGame().clients.find((x) => x.id === cid);
      return c?.trust ?? 0;
    });
    if (life) {
      state.lifeDialog = life;
      return res.daysAdvanced;
    }
  }
  // 帧末掷骰随机事件（中断日也掷，UI 弹窗决策）
  const ev = game.rollRandomEvent();
  if (ev) state.modal = { kind: 'event', payload: ev };
  // 成就检测（月度粒度足够）
  refreshAchievements();
  return res.daysAdvanced;
}

// ================= 主线剧情 =================

/**
 * P6-2 二周目扰动：按 seed 确定性生成任务日期漂移（±1 季度内，最多 ±66 天）。
 * 同 seed 同漂移；日历范围钳制；只漂移主线任务，不动人生线。
 */
export function computeEventShifts(seed: number): Record<string, IsoDate> {
  const shifts: Record<string, IsoDate> = {};
  const rng = new Rng(seed ^ 0x2b1b_c0de);
  const all = [...VOLUME1_QUESTS, ...VOLUME2_QUESTS, ...VOLUME3_QUESTS, ...VOLUME4_QUESTS, ...VOLUME5_QUESTS];
  for (const q of all) {
    const roll = Math.round((rng.next() * 2 - 1) * 66); // -66 ~ +66 天
    if (roll === 0) continue;
    const base = cal.indexOf(q.date);
    if (base < 0) continue;
    const clamped = Math.max(0, Math.min(cal.count - 1, base + roll));
    const target = cal.at(clamped);
    if (target === q.date) continue;
    shifts[q.id] = target;
  }
  return shifts;
}

export function initQuestEngine(seed: number) {
  // 卷一~卷三全量任务：QuestEngine 按 date 顺序触发，volume 字段仅用于进度/评语统计
  state.questEngine = new QuestEngine(
    [...VOLUME1_QUESTS, ...VOLUME2_QUESTS, ...VOLUME3_QUESTS, ...VOLUME4_QUESTS, ...VOLUME5_QUESTS] as unknown as QuestDef[],
    LIFELINES_ALL as unknown as LifeLineDef[],
  );
}

/** 剧情演出：下一步 */
export function questNext() {
  const d = state.questDialog;
  if (!d) return;
  if (d.phase === 'dialogue') {
    if (d.idx < d.quest.dialogues.length - 1) {
      d.idx += 1;
    } else if (d.quest.choices.length > 0) {
      d.phase = 'choice';
    } else {
      finishQuest(0);
    }
  }
}

/** 剧情演出：做出选择 */
export function chooseQuest(choiceIdx: number) {
  finishQuest(choiceIdx);
  // 卷末任务完成 → 触发结局闭环（三维阶段评语）：卷一/卷二通用
  const d = state.questDialog;
  if (d?.quest.id.endsWith('vol1_end') && state.questEngine) {
    state.volumeReview = computeVolumeReview(1);
  } else if (d?.quest.id.endsWith('vol2_end') && state.questEngine) {
    state.volumeReview = computeVolumeReview(2);
  } else if (d?.quest.id.endsWith('vol3_end') && state.questEngine) {
    state.volumeReview = computeVolumeReview(3);
  } else if (d?.quest.id.endsWith('vol4_end') && state.questEngine) {
    state.volumeReview = computeVolumeReview(4);
  } else if (d?.quest.id.endsWith('vol5_end') && state.questEngine) {
    state.volumeReview = computeVolumeReview(5);
    // P6 六结局：卷五终章后判定完整结局
    computeFinalEnding();
  }
}

/** P6-1 六结局判定（卷五末触发；结局画面在 QuestDialog volumeReview 之后展示） */
export function computeFinalEnding() {
  const g = getGame();
  const qe = state.questEngine;
  if (!qe) return;
  const prog = (n: number) => qe.volumeProgress(n);
  const questsDone = [1, 2, 3, 4, 5].reduce((a, v) => a + prog(v).done, 0);
  const questsTotal = [1, 2, 3, 4, 5].reduce((a, v) => a + prog(v).total, 0);
  const avgTrust = g.clients.length
    ? g.clients.reduce((a, c) => a + c.trust, 0) / g.clients.length
    : 0;
  const input: EndingInput = {
    violations: g.violations,
    stress: g.player.attrs.stress,
    highStressMonths: g.highStressMonths ?? 0,
    grade: g.player.grade,
    aum: g.player.aum,
    seasonScore: g.recentSeasonScore(),
    avgTrust,
    questsDone,
    questsTotal,
    lifelinesDone: qe.lifelinesDone(),
    newGamePlus: state.playthrough >= 2,
    playerName: g.player.name,
  };
  const r = judgeEnding(input);
  recordEnding(r.id);
  // 隐藏结局达成 → 永久解锁二周目，并记录周目数供下一局递增
  if (r.id === 'reborn_investor') {
    state.ngPlusUnlocked = true;
    storage.set('fm_ngplus', '1');
  }
  storage.set('fm_playthrough', String(state.playthrough));
  state.ending = {
    id: r.id,
    def: ENDINGS[r.id],
    summary: [
      `判定依据：${r.reasons.join('；')}`,
      `主线：${questsDone}/${questsTotal} 章 · 人生线节点：${input.lifelinesDone} · 客户信任均值：${avgTrust.toFixed(0)}`,
    ],
    newGamePlus: state.playthrough >= 2,
  };
  pushLog(`【结局】「${ENDINGS[r.id].title}」——${ENDINGS[r.id].tagline}`);
  pushLog(`【档案】${state.ending.summary.join('；')}`);
}

/** 三维阶段评语（结局闭环 v0） */
export function computeVolumeReview(volume: number) {
  const g = getGame();
  const qe = state.questEngine;
  if (!qe) return null;
  const avgTrust = g.clients.length
    ? g.clients.reduce((a, c) => a + c.trust, 0) / g.clients.length
    : 0;
  const proScore = Math.min(60, g.player.certs.length * 10) + Math.min(30, g.player.attrs.pro * 0.3);
  return qe.volumeReview(volume, {
    perfScore: g.recentSeasonScore(),
    proScore,
    violations: g.violations,
    avgTrust,
  });
}

function finishQuest(choiceIdx: number) {
  const d = state.questDialog;
  const qe = state.questEngine;
  const g = getGame();
  if (!d || !qe) return;
  const res = qe.complete(choiceIdx);
  if (!res) return;
  // 应用效果
  const e = res.effects;
  if (e.trust) {
    const target = d.quest.client ? g.clients.find((c) => c.id === d.quest.client) : null;
    if (target) target.trust = Math.max(0, Math.min(100, target.trust + e.trust));
    else for (const c of g.clients) c.trust = Math.max(0, Math.min(100, c.trust + e.trust));
  }
  if (e.pro) g.player.attrs.pro += e.pro;
  if (e.comm) g.player.attrs.comm += e.comm;
  if (e.sales) g.player.attrs.sales += e.sales;
  if (e.rep) g.player.attrs.rep += e.rep;
  if (e.stress) g.player.attrs.stress = Math.max(0, g.player.attrs.stress + e.stress);
  if (e.aum) g.player.aum = Math.max(0, g.player.aum + e.aum);
  pushLog(`【剧情】${d.quest.title} —— ${res.outcome}`);
  // P4 学习记录：抉择态度数据入档（best/good/normal/bad 天然分级）
  recordChoice({ questTitle: d.quest.title, grade: res.grade, at: game.date });
  touchActiveDay(game.date);
  d.phase = 'result';
  d.resultText = res.outcome;
  d.resultGrade = res.grade;
}

export function closeQuestDialog() {
  state.questDialog = null;
  state.volumeReview = null;
  // 六结局画面关闭：显示生涯档案归档提示（游戏继续可自由回顾，重开一局即二周目）
  if (state.ending) {
    pushLog('【归档】二十年的生涯档案已保存。重启记忆开始新一局（二周目：关键事件将不再完全重演）。');
    state.ending = null;
  }
}

/** 人生线确认 */
export function confirmLifeNode() {
  const qe = state.questEngine;
  const g = getGame();
  const node = state.lifeDialog;
  if (!qe || !node) return;
  const res = qe.completeLife();
  if (!res) return;
  const c = g.clients.find((x) => x.id === node.client);
  if (c && node.effects.trust) c.trust = Math.max(0, Math.min(100, c.trust + node.effects.trust));
  pushLog(`【人生线】${node.title} —— ${node.text}`);
  state.lifeDialog = null;
}

// ================= 新手引导（P2：前 3 个交易日四教学点强制引导） =================

export interface TutorialStep {
  idx: number;
  title: string;
  text: string;
  /** 行动指引（指向哪个界面/操作） */
  hint: string;
}

const TUTORIAL_STEPS: Omit<TutorialStep, 'idx'>[] = [
  {
    title: '欢迎来到 2006',
    text: '你重生为汇诚银行城东支行的见习理财经理。\n这一世，你比所有人都多知道未来二十年的行情——但请记住：你的客户不是 K 线，是一个个具体的人。',
    hint: '点击"知道了"进入工作台。',
  },
  {
    title: '行动点（AP）与一天的工作',
    text: '每天有 4 点行动力（AP）。在工作台"今日行动"里接待客户、打电话维护关系、学习考证、去营业厅站大堂——每项消耗 1 AP。',
    hint: '试试在工作台执行一个行动，或直接推进时间。',
  },
  {
    title: '接待客户：先问，再卖',
    text: '接待是对话玩法：客户嘴上说的和真实需要的不一样。先"挖潜"两次揭示真实需求，再从货架上推荐风险匹配的产品。\n适当性不符客户会拒签——这是红线，不是技巧。',
    hint: '工作台 → 接待客户（消耗 1 AP）。',
  },
  {
    title: '行情终端与主线剧情',
    text: '"行情终端"看指数、行业与 K 线；每月"结算"推进时间。\n剧情会主动找上门：系统任务在日期到点后自动弹出，客户的人生线在信任足够时触发——你的每一次选择都会被记进生涯档案。',
    hint: '有问题随时看"手册"。推进时间后注意弹窗。',
  },
  {
    title: '金手指与代价',
    text: '"重启记忆"能调用前世记忆，告诉你未来大事件的方向——但每用一次，记忆就失准一分，2018 年后彻底归零。\n靠记忆赢一时，靠专业赢一世。开始营业吧。',
    hint: '点击"开始营业"正式入职。',
  },
];

export const tutorial = ref<TutorialStep | null>(null);

/** 开新档时启动引导（存档恢复不触发） */
export function startTutorial() {
  const done = storage.get('fm_tutorial_done') === '1';
  if (done) return;
  tutorial.value = { idx: 0, ...TUTORIAL_STEPS[0] };
}

export function tutorialNext() {
  const cur = tutorial.value;
  if (!cur) return;
  if (cur.idx + 1 >= TUTORIAL_STEPS.length) {
    tutorial.value = null;
    storage.set('fm_tutorial_done', '1');
  } else {
    tutorial.value = { idx: cur.idx + 1, ...TUTORIAL_STEPS[cur.idx + 1] };
  }
}

/** 玩家对随机事件做出选择 */
export function resolveEventChoice(choiceIdx?: number) {
  game.resolveEvent(choiceIdx);
  state.modal = null;
  // 月初自动存档钩子：事件结算后落一个自动档
  storage.set('fm_save_1', serializeNow());
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
  // 冲刺 buff：临时专业力加成（仅在考试判定内使用）
  const cramBoost = cramActive() ? 6 : 0;
  const savedPro = game.player.attrs.pro;
  if (cramBoost) game.player.attrs.pro += cramBoost;
  rngExam ??= new Rng(game.rngNextInt());
  // 抽卷用 rng；判分通过率由专业力影响（简化：通过线降低 = pro 加成）
  // P4：并入行内题包（同科目追加进池，抽卷配比算法自动兼容）
  // 双审门禁（规划 §15-A1）：正式模式只放行 review.status==='approved' 的题
  const pool = [...examBankAll, ...packQuestions()].filter(passesReviewGate);
  const paper = buildPaper(exam, pool, rngExam);
  if (cramBoost) game.player.attrs.pro = savedPro; // 还原，buff 在判分阶段再乘
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
  // 冲刺 buff：通过线判定时给 3 分宽限（临时抱佛脚的临场效应）
  if (cramActive()) res.scorePct = Math.min(100, res.scorePct + 3);
  state.examResult = res;
  state.examScreen = 'result';
  const exam = EXAM_DEFS.find((e) => e.id === state.examPaper!.examId);
  pushWrongQuestions(state.examPaper, res.perQuestion);
  try {
    const attempts = Number(storage.get('fm_exam_attempts') ?? 0) + 1;
    storage.set('fm_exam_attempts', String(attempts));
  } catch { /* 忽略 */ }
  // P4 学习记录：考试明细入档（讲师报表通过率数据源）
  recordExamAttempt({ examId: res.examId, examName: exam?.name ?? res.examId, passed: res.passed, scorePct: res.scorePct, at: game.date });
  touchActiveDay(game.date);
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
  knowledge_tags?: string[];
}

/** 错题本（按 questionId 去重） */
export function wrongBook(): WrongQuestion[] {
  const raw = storage.get('fm_wrong_book');
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
      knowledge_tags: q.knowledge_tags,
    });
  });
  storage.set('fm_wrong_book', JSON.stringify(book.slice(0, 200)));
}

/** 知识点弱项雷达：错题按 knowledge_tag 聚合 */
export function weakSpotRadar(): Array<{ tag: string; count: number }> {
  const book = wrongBook();
  const counter: Record<string, number> = {};
  for (const w of book) {
    for (const t of w.knowledge_tags ?? []) counter[t] = (counter[t] ?? 0) + 1;
  }
  return Object.entries(counter)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

/** 考前冲刺：消耗 AP 换通过率 buff（规划书 7.5"临时抱佛脚"） */
export function cramForExam(): string {
  const g = getGame();
  if (state.apUsed >= state.apMax) return '本帧行动点已用完，无法冲刺。';
  state.apUsed += 1;
  g.player.attrs.pro += 0.5;
  g.player.attrs.stress += 3;
  g.player.energy = Math.max(0, g.player.energy - 8);
  // 冲刺 buff：24h 内通过率提升（简单实现为 pro 临时加成记录）
  storage.set('fm_cram_until', String(Date.now() + 24 * 3600 * 1000));
  pushLog('【考前冲刺】熬了个通宵刷题……专业力 +0.5，通过率临时提升，但压力 +3、精力 -8。');
  return '冲刺完成！通过率临时提升（持续到明天）。';
}

/** 冲刺 buff 是否生效 */
export function cramActive(): boolean {
  const until = Number(storage.get('fm_cram_until') ?? 0);
  return Date.now() < until;
}

/** 每日一题（按日期确定性抽取，情绪加成；含行内题包；受双审门禁过滤） */
export function dailyQuestion(): { q: ExamQuestion; done: boolean } | null {
  const pool = [...examBankAll, ...packQuestions()]
    .filter(passesReviewGate)
    .filter((q) => q.subject === 'exam_bank_law' || q.subject === 'exam_bank_pf');
  if (pool.length === 0) return null;
  const dateKey = Number(game.date.replace(/-/g, ''));
  const idx = dateKey % pool.length;
  const done = storage.get(`fm_daily_${game.date}`) === '1';
  return { q: pool[idx], done };
}

/** 完成每日一题（答对给情绪加成） */
export function finishDaily(correct: boolean): string {
  storage.set(`fm_daily_${game.date}`, '1');
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
  if (typeof data.highStressMonths === 'number') g.highStressMonths = data.highStressMonths;
  if (typeof data.coachLevel === 'number') g.coachLevel = data.coachLevel;
  // 团队系统恢复（P6：旧存档无 team 字段时按当前年份补齐花名册）
  g.team = new TeamSystem();
  if (data.team) g.team.restore(data.team);
  g.team.syncRoster(Number((g.date ?? '2026-01-01').slice(0, 4)), g.rng);
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
  state.gameDate = g.date;
  state.lastSnap = null;
  state.baseSnap = { day: null, week: null, month: null, since_view: null };
  state.selectedClientId = g.clients[0]?.id ?? '';
  state.memoryHint = '';
  // K 线历史恢复
  g.snapHistory = Array.isArray(data.snapHistory) ? data.snapHistory.slice(-120) : [];
  // 接待会话中间态恢复
  if (data.reception) {
    state.reception = data.reception;
    state.receptionLog = Array.isArray(data.receptionLog) ? data.receptionLog : [{ who: 'client', text: data.reception.need?.surface ?? '' }];
    state.receptionRevealed = !!data.receptionRevealed;
    state.receptionAmount = data.receptionAmount ?? 0;
    // probe/evaluate 只依赖会话对象本身，rng 仅 start 用 —— 惰性重建引擎即可续聊
    receptionEngine = new Reception(getGame().rng);
  } else {
    state.reception = null;
    state.receptionLog = [];
  }
  // 考试进行态恢复
  if (data.exam?.paper) {
    state.examPaper = data.exam.paper;
    state.examAnswers = data.exam.answers ?? [];
    state.examIdx = data.exam.idx ?? 0;
    state.examScreen = 'taking';
    const examDef = EXAM_DEFS.find((e) => e.id === data.exam.paper.examId);
    state.examSecondsLeft = data.exam.secondsLeft ?? examDef?.time_limit_sec ?? 600;
    if (state.examTimer) clearInterval(state.examTimer);
    state.examTimer = setInterval(() => {
      state.examSecondsLeft -= 1;
      if (state.examSecondsLeft <= 0) submitExam();
    }, 1000);
  }
  // 重建 game 实例挂载（模块级 game 变量）
  replaceGame(g);
  state.seed = data.seed ?? 42;
  // 恢复剧情进度
  initQuestEngine(state.seed);
  if (data.quest) state.questEngine?.restore(data.quest);
  // P6 周目与事件漂移恢复
  state.playthrough = Number(data.playthrough ?? 1);
  state.eventShifts = data.eventShifts ?? null;
  state.ngPlusUnlocked = storage.get('fm_ngplus') === '1';
  state.ending = null;
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
