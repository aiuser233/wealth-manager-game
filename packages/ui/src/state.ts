import { reactive, computed, ref } from 'vue';
import {
  GameCalendar, MarketSim, Game, Rng, Reception, QuestEngine,
  type MarketSnapshot, type IsoDate, type ActionResult, type ActionType,
  type TimeFrame, type ExamPaper, type ExamResult, type ReceptionSession, type ExamQuestion,
  type QuestDef, type LifeLineDef, judgeEnding, ENDINGS,
  type EndingId, type EndingInput, ACTION_NAMES,
  buildPaper, gradePaper, questionScore, EXAM_DEFS,
  emptyCareerStats as emptyStats, type CareerStats,
} from '@fm/core';
import { contentBundle, eraDrift, eraLevel, randomEvents, randomEventsDeep, randomEventsDeep2, randomEventsDeep3, randomEventsDeep4, randomEventsDeep5, examBankAll, VOLUME1_QUESTS, VOLUME2_QUESTS, VOLUME3_QUESTS, VOLUME4_QUESTS, VOLUME5_QUESTS, EASTER_QUESTS, NG_PLUS_QUESTS, VOLUME8_QUESTS, LIFELINES_ALL } from '@fm/content';
import { storage } from './storage';
import { recordExamAttempt, recordChoice, touchActiveDay } from './lms';
import { refreshAchievements, recordEnding } from './achievements';
import { packQuestions, passesReviewGate } from './packs';
import { TeamSystem } from '@fm/core';

export interface NewsItem { date: IsoDate; title: string; body: string }
export interface LogItem { date: IsoDate; text: string }

/** 行动小剧场：除接待外的行动都给出一段具体交互（客户提问/同事搭话/场景描述） */
export interface ActionScene {
  kind: 'lobby' | 'outreach' | 'study' | 'review' | 'aftersale' | 'social';
  /** 场景描述（谁、在哪、发生什么） */
  narration: string;
  /** 本行动结果（数值变化文案，结算后展示） */
  result: string;
  /** 学习刷题模式的题目（kind==='study' 时存在） */
  question?: ExamQuestion;
  /** 可选的玩家回应选项（轮值答疑/售后处理），每项带反馈文案 */
  options?: Array<{ text: string; reply: string; good: boolean }>;
  picked?: number;
}

/** 行情终端的"距上次查看"口径 */
export type QuoteScope = 'day' | 'week' | 'month' | 'since_view';

const cal = new GameCalendar('2006-01-02', '2027-06-30');

export const state = reactive({
  screen: 'workbench' as 'workbench' | 'market' | 'clients' | 'help' | 'exam' | 'gallery' | 'system' | 'archive' | 'trainer' | 'lecturer' | 'team' | 'ach',
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
  /** 已读新闻数（TopBar 红点=未读新闻数，进入行情终端即视为已读） */
  newsSeen: 0,
  log: [] as LogItem[],

  lastSnap: null as MarketSnapshot | null,
  /** 各口径的基准快照 */
  baseSnap: { day: null as MarketSnapshot | null, week: null as MarketSnapshot | null, month: null as MarketSnapshot | null, since_view: null as MarketSnapshot | null },
  quoteScope: 'since_view' as QuoteScope,

  selectedClientId: '' as string,
  lastResult: '' as string,

  /** 考试系统 */
  examScreen: 'list' as 'list' | 'taking' | 'result',
  /** 考试模式：formal 正式考 / mock 模考（全真计时）/ practice 练习（不限时即时反馈） */
  examMode: 'formal' as ExamMode,
  /** 练习模式单题反馈（对/错 + 解析展示） */
  practiceFeedback: null as null | { idx: number; correct: boolean },
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

  /** 行动小剧场（厅堂轮值/学习刷题/外拓拜访/复盘行情/售后处理/同事互动的具体交互） */
  actionScene: null as null | ActionScene,

  /** 学习刷题：当前题（来自题库） */
  studyQuestion: null as null | { q: ExamQuestion; picked: null | number | number[]; checked: boolean; correct: boolean },

  /** C1 错题重练会话 */
  redoSession: null as null | RedoSession,

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

  /** D1 设置中心（持久化到 fm_settings，读档恢复） */
  settings: {
    autoSaveEnabled: true,   // 自动存档开关（关掉后仅结算/事件时存）
    autoSaveMinutes: 10,     // 自动存档间隔（分钟）
    logArchiveMonths: 6,     // 工作台日志只显示最近 N 个月（0=全部）
  } as { autoSaveEnabled: boolean; autoSaveMinutes: number; logArchiveMonths: number },

  /** A3 预约队列：本月到访预约（接待行动时优先消费） */
  appointments: [] as Array<{
    id: string; clientId: string; clientName: string; month: string;
    reason: string; from: 'referral' | 'warning' | 'manual' | 'life';
  }>,

  /** A3/B2 客户档案页的操作反馈消息 */
  clientMsg: '' as string,

  /** D2 年度总结报告弹窗（跨年首日弹出一次） */
  annualReport: null as null | { year: number; lines: string[] },
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
  // A3：月结后把转介绍/流失预警客户放进预约队列
  game.hooks.onMonthClients = ({ referrals, warnings }) => {
    for (const id of referrals) {
      const c = game.clients.find((x) => x.id === id);
      if (c) enqueueAppointment({ clientId: id, clientName: c.name, reason: '初次见面：听听朋友口中的理财经理', from: 'referral' });
    }
    for (const id of warnings) {
      const c = game.clients.find((x) => x.id === id);
      if (c) enqueueAppointment({ clientId: id, clientName: c.name, reason: '持仓安抚：对近期波动有疑问', from: 'warning' });
    }
  };
  // D2：跨年弹出上一年度总结报告
  game.hooks.onYearTurn = (year) => {
    const rep = game.annualReportFor(year - 1);
    if (rep) {
      state.annualReport = rep;
      pushLog(`【年度总结】${year - 1} 年收官，年度报告已生成。`);
    }
  };
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
  state.newsSeen = 0;
  state.log = [];
  state.annualReport = null;
  state.appointments = [];
  loadSettings();
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
  game.injectEvents([...randomEvents, ...randomEventsDeep, ...randomEventsDeep2, ...randomEventsDeep3, ...randomEventsDeep4, ...randomEventsDeep5] as any, new Rng(seed ^ 0x5f3759df));
  // 初始化主线剧情引擎（卷一）
  initQuestEngine(seed);
  // 自动存档（新开局覆盖自动档，并重置自动存档计时器）
  autoSave();
  // 新手引导（跳过条件：本浏览器已完成过）
  startTutorial();
  pushLog(`${game.player.name} 重生回到 2006 年 1 月，成为汇诚银行城东支行的见习理财经理。今天是你入职的第一天。`);
}

// ================= 存档系统（问题 5：1 个自动档每 10 分钟轮转 + 3 个手动档） =================

/** 自动档槽位（唯一），手动档槽位 1-3 */
export const AUTO_SAVE_SLOT = 0;
export const MANUAL_SLOTS = [1, 2, 3] as const;
/** 自动存档间隔（分钟）的默认值；实际间隔由 state.settings.autoSaveMinutes 控制（D1 设置中心可调） */
const AUTO_SAVE_INTERVAL_MS = 10 * 60 * 1000;
void AUTO_SAVE_INTERVAL_MS;
let autoSaveTimer: ReturnType<typeof setInterval> | 0 = 0;

/** 写自动档并启动轮转计时（新开局/读档后都会调用） */
export function autoSave() {
  storage.set(`fm_save_${AUTO_SAVE_SLOT}`, serializeNow());
  startAutoSaveTimer();
}

/** 自动存档计时器：按设置间隔覆盖自动档（只在本局游戏进行中；设置关闭时不轮转） */
export function startAutoSaveTimer() {
  if (autoSaveTimer) clearInterval(autoSaveTimer);
  if (!state.settings.autoSaveEnabled) return;
  const ms = Math.max(1, state.settings.autoSaveMinutes) * 60 * 1000;
  autoSaveTimer = setInterval(() => {
    if (!state.started || state.ending || !state.settings.autoSaveEnabled) return;
    storage.set(`fm_save_${AUTO_SAVE_SLOT}`, serializeNow());
  }, ms);
}

/** D1 设置中心：保存设置并让计时器立即生效 */
export function saveSettings(patch?: Partial<typeof state.settings>) {
  if (patch) Object.assign(state.settings, patch);
  storage.set('fm_settings', JSON.stringify(state.settings));
  startAutoSaveTimer();
}

/** 启动/读档时恢复设置 */
export function loadSettings() {
  const raw = storage.get('fm_settings');
  if (raw) {
    try { Object.assign(state.settings, JSON.parse(raw)); } catch { /* 忽略损坏设置 */ }
  }
}

/** 停止自动存档计时（结局后/返回主界面用） */
export function stopAutoSaveTimer() {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer);
    autoSaveTimer = 0;
  }
}

/** 手动存档到指定槽位（1/2/3），带覆盖确认的 UI 逻辑放组件层 */
export function saveToSlot(slot: number): boolean {
  if (!MANUAL_SLOTS.includes(slot as 1 | 2 | 3)) return false;
  storage.set(`fm_save_${slot}`, serializeNow());
  pushLog(`【存档】进度已手动保存到槽位 ${slot}。`);
  return true;
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
    /** A0 生涯统计（转介绍/流失/年度报告底座） */
    stats: g.stats,
    statsServed: [...(g as any).servedClients ?? []],
    /** A3 预约队列 */
    appointments: state.appointments,
    /** D1 设置 */
    settings: { ...state.settings },
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
  // 各口径基准全部从 K 线历史缓冲（snapHistory，近 120 日）推导：
  // 当日=昨收（倒数第 2 个）；周=上周五（当前本周第 1 个交易日之前）；月=上月末
  const hist = game.snapHistory;
  const cur = hist[hist.length - 1];
  if (cur) {
    state.baseSnap.day = hist.length >= 2 ? hist[hist.length - 2] : null;
    const d = cur.date;
    const weekDays = cal.tradingDaysOfWeek(d);
    const weekIdx = weekDays.indexOf(d);
    if (weekIdx > 0) {
      // 本周内第 weekIdx 个交易日 → 基准=历史中再往前 weekIdx 个交易日
      state.baseSnap.week = hist.length > weekIdx ? hist[hist.length - 1 - weekIdx] : null;
    } else if (hist.length >= 2) {
      // 周一：基准=上周五（倒数第 2 个）
      state.baseSnap.week = hist[hist.length - 2];
    }
    const monthDays = cal.tradingDaysOfMonth(d);
    const monthIdx = monthDays.indexOf(d);
    if (monthIdx > 0 && hist.length > monthIdx) {
      state.baseSnap.month = hist[hist.length - 1 - monthIdx];
    }
  }
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
  // 全操作入日志：每次行动的完整反馈（结果+数值变化）都写进工作台日志
  const deltas: string[] = [];
  if (r.trust_delta) deltas.push(`信任 ${r.trust_delta > 0 ? '+' : ''}${r.trust_delta}`);
  if (r.pro_delta) deltas.push(`专业力 +${r.pro_delta.toFixed(1)}`);
  if (r.stress_delta) deltas.push(`压力 ${r.stress_delta > 0 ? '+' : ''}${r.stress_delta}`);
  if (r.aum_delta) deltas.push(`AUM +${fmtMoneyCN(r.aum_delta)}`);
  if (r.income_delta) deltas.push(`现金 +${fmtMoneyCN(r.income_delta)}`);
  pushLog(`【${name}】${r.text}${deltas.length ? `（${deltas.join('，')}）` : ''}`);
  buildActionScene(type, r);
  return r;
}

// ================= 行动小剧场（问题 2：除接待外的行动都有具体交互） =================

/** 厅堂轮值客户提问库（教学场景：附录答案按专业度给反馈） */
const LOBBY_QUESTIONS: Array<{ ask: string; options: Array<{ text: string; reply: string; good: boolean }> }> = [
  {
    ask: '「小伙子，我这笔钱明年要用，是不是买那个收益最高的基金就行？」',
    options: [
      { text: '「明年要用的钱不能买高波动的基金，我给您看看一年期定存和现金管理类。」', reply: '客户连连点头：「还是你们专业。」顺手填了张联系方式。', good: true },
      { text: '「对，收益最高的那只最近涨得很好。」', reply: '客户将信将疑地走了。旁边的老员工摇头：这单埋了颗雷。', good: false },
    ],
  },
  {
    ask: '「听说你们理财经理都有任务，是不是卖得越贵越好？」',
    options: [
      { text: '「任务有，但按规矩来：先看您的风险承受能力，再谈产品。双录都是全程的。」', reply: '客户笑了：「行，冲这句我开个卡。」', good: true },
      { text: '「想那么多干嘛，先买点试试水。」', reply: '客户皱了皱眉，去别的网点转了一圈。', good: false },
    ],
  },
  {
    ask: '「我孙子说现在流行在手机上买基金，我不会弄，你们管教吗？」',
    options: [
      { text: '「管教！我一步步教您，手机银行还能设置大字模式。」', reply: '十分钟后大爷完成了人生第一笔手机申购，逢人就夸。', good: true },
      { text: '「手机上自己摸索一下就行，很简单的。」', reply: '大爷撇撇嘴：「那我回家找孙子去。」', good: false },
    ],
  },
  {
    ask: '「股市最近天天涨，我朋友都赚翻了，我能不能把定存全取出来买股票？」',
    options: [
      { text: '「全仓搏一把风险很大，这笔钱您可以分一部分参与，但备用金建议留着。」', reply: '客户想了想：「那就先转三分之一。」——理性配置意识 +1。', good: true },
      { text: '「行情这么好，赶紧取，晚了就没了！」', reply: '客户热血上头全取了。若接下来行情变脸，第一个来找的就是你。', good: false },
    ],
  },
  {
    ask: '「闺女，我这养老钱买成黄金行不行？金店都说金子保值。」',
    options: [
      { text: '「金子长期保值但有波动，您这是养老钱，先说清楚几年内用不用、比例控制在多少。」', reply: '大妈竖起大拇指：「你这孩子实在。」留了张名片走了。', good: true },
      { text: '「行啊，金价一直涨，赶紧买。」', reply: '大妈把养老钱全买了金饰。下个月金价回调，第一个回来讨说法的就是她。', good: false },
    ],
  },
  {
    ask: '「小伙子，信用卡分期能免息，是不是白捡便宜？」',
    options: [
      { text: '「分期免息不免手续费，折算年化其实不低——我给您算笔账。」', reply: '客户听完直冒冷汗：「差点又背一笔。」对你的信任肉眼可见地涨。', good: true },
      { text: '「对，免息就是不要钱，随便分期。」', reply: '客户真去分了期。后来对账单发现手续费，逢人就说银行套路深。', good: false },
    ],
  },
  {
    ask: '「我想给上小学的孙子存笔教育金，怎么存才不会半路取出来花掉？」',
    options: [
      { text: '「专款专户：开个只进不出的账户做定投或长期存款，和其他钱物理隔离。」', reply: '客户记在本子上：「隔离这词好，钱跟人一样，离得近了就容易挪。」', good: true },
      { text: '「存我这就行，我帮您看着。」', reply: '钱没有制度约束，光靠人看着迟早挪用。客户将信将疑地走了。', good: false },
    ],
  },
  {
    ask: '「大额存单转让是什么意思？是不是有人不要利息了？」',
    options: [
      { text: '「是持有人急用钱，把没到期的存单转让给您，利率按原单算，有时还能占点便宜。」', reply: '客户恍然大悟，顺手问了转让区还有哪些单子。', good: true },
      { text: '「反正就是便宜，您买就完事了。」', reply: '客户不明不白买了，回去被儿子一问三不知，回头找你麻烦。', good: false },
    ],
  },
  {
    ask: '「数字人民币到底是啥？跟手机里那个零钱有啥不一样？」',
    options: [
      { text: '「数字人民币是国家发行的现金，零钱是平台记账——一个是央行负债，一个是企业欠条。」', reply: '客户听完掏出手机：「那你教我开通一个。」', good: true },
      { text: '「差不多，就是个新潮玩意儿。」', reply: '客户没听懂也没问。科普的窗口就这么关上了。', good: false },
    ],
  },
  {
    ask: '「基金分红方式选现金还是红利再投？我儿子说再投好。」',
    options: [
      { text: '「看用途：这笔钱近期要用就选现金，长期放着再投份额多。」', reply: '客户按用途改了设置，临走说了句「还是你想得细」。', good: true },
      { text: '「都行，随便选一个。」', reply: '客户嘟囔：「随便？那你们这是让我随便亏？」', good: false },
    ],
  },
  {
    ask: '「保险业务员说我这保单交满十年能全退还带利息，真的假的？」',
    options: [
      { text: '「您把合同拿来，我们逐条看现金价值表——口头承诺不作数。」', reply: '看完合同客户倒吸凉气：「幸亏来问了。」险些又一起销售误导。', good: true },
      { text: '「差不多是这样，您放心。」', reply: '十年后退保发现亏了一截，投诉工单写的就是你的名字。', good: false },
    ],
  },
  {
    ask: '「闺女，我听说房贷利率降了，我那套房月供能少多少？」',
    options: [
      { text: '「看您合同的重定价日和 LPR 加点，我帮您翻出合同算笔账。」', reply: '客户回家翻出合同，第二天专门来感谢：「总算弄明白了。」', good: true },
      { text: '「降了降了，反正会少。」', reply: '客户回头问儿子，儿子一查发现根本没到重定价日。', good: false },
    ],
  },
  {
    ask: '「小伙子，医保个人账户里的钱能取出来吗？我听人说可以。」',
    options: [
      { text: '「个人账户的钱定向用于医疗消费，取现是违规的——不过您可以用它给家人缴居民医保。」', reply: '客户竖起大拇指：「还是你懂政策。」', good: true },
      { text: '「应该能吧，你找中介问问。」', reply: '客户找的"中介"卷走两千元手续费。', good: false },
    ],
  },
  {
    ask: '「我想把公司分红存下来给孙子，听说家族信托要一千万？我没那么多。」',
    options: [
      { text: '「家庭服务信托 100 万起就能做，分配条款按您的意思来。」', reply: '客户眼睛亮了：「那给我讲讲。」', good: true },
      { text: '「那你这点钱做不了，存定期吧。」', reply: '客户悻悻而去，转头在别家做了个来路不明的"理财"。', good: false },
    ],
  }]

/** 售后处理场景库 */
const AFTERSALE_SCENES: Array<{ narration: string; options: Array<{ text: string; reply: string; good: boolean }> }> = [
  {
    narration: '客户王阿姨怒气冲冲进来：「我买的理财怎么亏了？你们说好的稳健呢！」',
    options: [
      { text: '先道歉安抚，调出产品说明书逐条解释风险等级，再给出后续方案。', reply: '王阿姨情绪平复：「你这么一讲我就明白了，下次买之前你多给我讲讲。」', good: true },
      { text: '「市场普跌谁都这样，您再等等。」', reply: '王阿姨更火了，扬言要投诉。行长在办公室里看了你一眼。', good: false },
    ],
  },
  {
    narration: '客户投诉上个月扣款失败错过定投，情绪激动。',
    options: [
      { text: '核实失败原因，当天补扣，赠送一次费率优惠，并开通余额提醒。', reply: '客户满意而去，还主动问起了基金定投的其他产品。', good: true },
      { text: '「这是系统问题，我们也没办法。」', reply: '客户摔门而去。当天下午投诉工单就到了支行。', good: false },
    ],
  },
  {
    narration: '一位客户拿着保险单冲进来：「业务员说交满十年全退还带利息，现在退怎么还要扣钱？！」',
    options: [
      { text: '先赔不是，再逐条对照合同条款与当时的双录录像，把现金价值表讲透，帮客户算清持有 vs 退保两种结果。', reply: '客户看完录像沉默了：「当时确实是我自己签的字……你帮我看看怎么继续最划算。」投诉变成了转机。', good: true },
      { text: '「业务员早离职了，这事我们管不了。」', reply: '客户直接去了监管投诉热线。第二天分行合规部来电，你写了一下午情况说明。', good: false },
    ],
  },
  {
    narration: '客户银行卡被盗刷 2000 元，认定是银行责任，要求立即赔偿。',
    options: [
      { text: '第一时间帮客户做挂失冻结、打印流水、指导报案，讲清争议处理流程与时限，全程书面留痕。', reply: '事后查明是短信钓鱼所致，银行无责——但客户对处理过程很满意：「流程你给我跑得明明白白。」', good: true },
      { text: '「肯定是您自己泄露密码，跟我们没关系。」', reply: '客户怒而投诉，事情最后查清银行确实无责，但客户还是流失了——对了一半，输了全部。', good: false },
    ],
  },
  {
    narration: '老客户深夜发消息：理财净值单日跳水 2%，情绪崩溃，「明天一早我就全赎回」。',

    options: [
      { text: '当晚先电话接住情绪，约次日面谈；次日带归因数据面谈：跌的原因、历史回撤、持有策略，让客户自己选。', reply: '客户最终选择持有并加做了资产配置检视。「亏钱那天有人管」——这单信任值翻倍。', good: true },
      { text: '回复「别慌，长期都这样」，然后睡觉。', reply: '客户一夜没睡好，早上一开门就冲到网点全赎了。转身去了别家。', good: false },
    ],
  },
  {
    narration: '客户要给异地儿子汇 8 万元「买房急用」，神色慌张，不断看手机上的催促消息。',
    options: [
      { text: '按反诈流程三问：用途、对象、是否被催促；请他打电话向儿子当面核实。', reply: '电话打过去——儿子的号是空号。客户惊出一身冷汗：「这是骗子！谢谢你啊小伙子！」', good: true },
      { text: '客户急着办就赶紧给办，别多嘴耽误人家的事。', reply: '汇款完成后下午客户哭着回来：钱进了诈骗账户。这笔账，柜台和你都难辞其咎。', good: false },
    ],
  },
  {
    narration: '客户拿着一份"养老床位预订合同"来咨询：交 20 万会员费每月返 800 元，"比理财划算"。',
    options: [
      { text: '帮她查企业登记与涉非线索，讲解"返本销售+高额回报"的非法集资特征，劝其尽快解约退款。', reply: '两个月后该机构被查，客户因退得早全身而退，送来一面锦旗。', good: true },
      { text: '「这项目听着不错，我也帮您算算收益。」', reply: '客户交了钱。一年后机构暴雷，投诉记录里你的"专业背书"被反复提及。', good: false },
    ],
  },
  {
    narration: '客户投诉基金转换时"少赎多买"：她以为转换免费，实际承担了申购补差。',
    options: [
      { text: '核实交易记录，逐笔解释转换规则与费用，协助她调整持有方式并书面致歉。', reply: '客户接受解释："规则没讲透，你们要认这个账。"投诉办结，信任回升。', good: true },
      { text: '「合同里都写了，您没看吗？」', reply: '投诉升级到监管热线，工单转回时已不是解释规则就能了结的事。', good: false },
    ],
  }]

/** 同事互动场景库 */
const SOCIAL_SCENES: Array<{ narration: string; options: Array<{ text: string; reply: string; good: boolean }> }> = [
  {
    narration: '午休时，隔壁柜台的师兄抱怨：「这个月任务又压下来了，愁。」',
    options: [
      { text: '「一起分析下手里的存量客户，看看哪些可以约来聊聊权益配置。」', reply: '两人对着客户名单聊了一下午，都理出了思路。团队氛围 +1。', good: true },
      { text: '「唉，都是打工的。」继续刷手机。', reply: '气氛更显低沉。', good: false },
    ],
  },
  {
    narration: '新来的实习生问你：「前辈，第一次见客户紧张怎么办？」',
    options: [
      { text: '「记住三件事：听比说重要、数据要留底、不懂的别装懂。」', reply: '实习生眼睛亮了。你发现教别人也是巩固自己（专业力小涨）。', good: true },
      { text: '「多接几单就习惯了。」', reply: '实习生似懂非懂地点头。', good: false },
    ],
  },
  {
    narration: '行长在晨会上点名：「小林，你们组这个月存款缺口还有 300 万，下周必须补上。」会后压力扑面而来。',
    options: [
      { text: '盘点到期存款客户名单，排优先级逐一电话维护，用到期资金承接补缺口——不碰违规冲量。', reply: '周五前缺口补齐大半。行长在周会上说「方法对，路子正」。压力转化为节奏。', good: true },
      { text: '找资金掮客问问「帮忙冲量」的门路，月底过了就撤。', reply: '冲量完成，但费用走账的痕迹留下了。合规检查时这是一颗随时会炸的雷。', good: false },
    ],
  },
  {
    narration: '你无意听到同事小李向客户推销一款「内部高息通道」，而它根本不在本行代销名单里。',
    options: [
      { text: '私下先劝小李停手，无果后按流程向合规部门报告。', reply: '报告是艰难的，但飞单资金不进银行体系、出事无法追责。合规部连夜核查，风险被掐灭在早期。', good: true },
      { text: '同事一场，睁一只眼闭一只眼。', reply: '三个月后客户血本无归，围堵网点。参与飞单的都被处理——包括「知情不报」的你。', good: false },
    ],
  },
  {
    narration: '季度绩效面谈，主管指出你「成交率高但客户投诉为零，说明太保守，要敢卖」。',
    options: [
      { text: '「我的业绩来自复购与转介绍，客户敢把家里全部的钱放我这儿。保守就是我的打法。」用留存数据说话。', reply: '主管翻着你的客户留存率沉默了：「下季度把这套方法整理出来给全组讲讲。」', good: true },
      { text: '「好的，我下季度加大推销力度。」', reply: '短期业绩上去了，投诉也跟着来了。你弄丢了自己最值钱的东西——口碑。', good: false },
    ],
  },
  {
    narration: '柜面因排队问题与客户起了争执，客户大声嚷嚷「要投诉」，大厅秩序眼看要乱。',
    options: [
      { text: '上前把客户请到贵宾室，倒杯水听他讲完，再回柜面协调加开窗口。', reply: '客户气消了一半：「不是钱的事，是气不顺。」最后他还办了张贵宾卡。', good: true },
      { text: '站在旁边看柜员自己处理，别沾包。', reply: '争执升级成大厅争吵，第二天支行例会上点名批评了全员的服务协同。', good: false },
    ],
  },
  {
    narration: '晨会前，同事们在议论新来的主管"要砍存量客户分配规则"。',
    options: [
      { text: '「规则变了我们就把服务做细——客户跟着专业走，不跟着嗓门走。」', reply: '人心安定下来。月底新规则落地，你组留存最好。', good: true },
      { text: '跟着一起抱怨主管。', reply: '传话传两圈就变味了，你的名字上了主管的"情绪名单"。', good: false },
    ],
  },
  {
    narration: '隔壁网点借调你帮三天忙，柜员问：「你们那边业绩压力怎么扛的？」',
    options: [
      { text: '「把客户分层，一天只打十个有效电话，剩下的交给转介绍。」', reply: '三天后她按这个方法打出两个预约，专程来道谢。', good: true },
      { text: '「硬扛，谁让咱是打工的。」', reply: '负能量随你传回了隔壁网点。', good: false },
    ],
  }]

/** 外拓拜访场景库 */
const OUTREACH_SCENES: Array<{ narration: string; options: Array<{ text: string; reply: string; good: boolean }> }> = [
  {
    narration: '你带着产品资料拜访一位企业主客户，他开门见山：「你们银行不就是想让我买理财吗？」',
    options: [
      { text: '「先不谈产品。您厂里账上闲钱怎么摆的、对公结算顺不顺，我先帮您把把脉。」', reply: '聊到财务痛点，客户主动问了企业网银和代发工资。信任明显提升。', good: true },
      { text: '「我们最近有个产品收益不错……」递上宣传单。', reply: '客户礼貌收下，随口应付了两句。', good: false },
    ],
  },
  {
    narration: '你回访一位许久没联系的退休教师客户，她提起邻居在别的银行买到了「高息存款」。',
    options: [
      { text: '「阿姨，正规存款都有存款保险，超过 50 万也要看银行资质。我帮您查查那是什么产品。」', reply: '查完发现是代销理财，客户后怕：「还是你实在。」', good: true },
      { text: '「那您也去那家买呗。」', reply: '客户愣了一下，气氛尴尬。', good: false },
    ],
  },
  {
    narration: '社区邀你周末做一场「防范非法集资」公益讲座，来的是三十多位叔叔阿姨。',
    options: [
      { text: '精心准备：四个真实骗局拆解 + 一个判断口诀，全程不提任何产品。', reply: '讲座大获成功，社区要跟你签长期合作。此后每周都有居民指名找「小林老师」。', good: true },
      { text: '走个过场，讲一半开始发本行产品折页。', reply: '居委会主任当场皱眉收走了折页。公益变营销，社区的大门关上了。', good: false },
    ],
  },
  {
    narration: '一位流失半年的老客户主动约你见面——她在别家买了产品最近连续亏损，想听听你的看法。',
    options: [
      { text: '不带任何推荐目的：先做全资产诊断，把她在别家产品的风险讲透，方案让她自己选。', reply: '客户感慨：「出去转了一圈才知道谁靠谱。」资产回流的同时带来了两位朋友。', good: true },
      { text: '趁虚而入：「早听我的就不会亏，赶紧转到我这儿来。」', reply: '客户当场没说什么，之后再没回过消息。落井下石的样子，客户都记在心里。', good: false },
    ],
  },
  {
    narration: '一家 200 人的企业财务总监约谈代发工资业务，开口就问：「给我们什么费率优惠？」',
    options: [
      { text: '先展示服务方案：员工专属理财讲座、工资到账自动理财、个税服务——费率之外先谈价值。', reply: '总监拍板合作：「别家只会降价，你们会解决问题。」300 名员工的代发落了地。', good: true },
      { text: '直接给出最低费率，先拿下再说。', reply: '单子拿下了，但利润薄如纸，后续服务资源也跟不上——代发半年流失过半。', good: false },
    ],
  },
  {
    narration: '沿街商铺的老板抱怨：「收款码手续费贵，隔壁银行免费送。」',
    options: [
      { text: '「手续费背后是对账、流水贷款额度与到账时效。我拿您半年的流水帮您算笔综合账。」', reply: '算完账老板发现流水信用贷能救急：「那你帮我办一个。」 POS 之外带走了一笔经营贷需求。', good: true },
      { text: '「我们也免费送！」回去申请特批。', reply: '特批下来了，但同样的免费同行也送——价格战没有赢家，只亏了利润。', good: false },
    ],
  },
  {
    narration: '猎头联络你：同业机构开出翻倍薪水挖你带团队。',
    options: [
      { text: '认真评估：除了薪水，看平台客户结构、合规文化与自己二十年的积累是否匹配。', reply: '你想明白了自己要什么，婉拒了邀请——猎头说「你是第一个跟我聊了合规文化的候选人」。', good: true },
      { text: '翻倍薪水！立刻答应跳槽。', reply: '新平台冲量文化浓厚，半年后你带着一身指标焦虑回望老网点——有些东西没了就是没了。', good: false },
    ],
  },
  {
    narration: '社区重阳节活动，居委会请你去给老人们讲讲"守住钱袋子"。',
    options: [
      { text: '带三个真实案例：养老公寓会员卡、以房养老骗局、"高息存款"话术，讲完留咨询台。', reply: '现场一位大爷悄悄说："我就是被那个会员卡坑过的。"此后社区成了你的固定宣教点。', good: true },
      { text: '念完宣传折页就走。', reply: '老人们听了一半散了场。', good: false },
    ],
  },
  {
    narration: '产业园扫楼，保安拦着不让进："又是一家卖理财的。"',
    options: [
      { text: '「我们不卖产品。免费给园区企业做一场"新办企业财务避坑"讲座，您帮我们约场地。」', reply: '讲座场场爆满，园区管委会主动介绍新入驻企业给你。', good: true },
      { text: '塞给保安两包烟求放行。', reply: '烟收了，材料进了垃圾桶。', good: false },
    ],
  }]

/** 复盘行情场景库 */
const REVIEW_SCENES: Array<{ narration: string }> = [
  { narration: '你调出近一个月的指数走势，逐个板块对照新闻做归因笔记：涨因为什么、跌因为什么、哪些是情绪哪些是基本面。' },
  { narration: '你把持仓客户的组合和当前行情对照，检查风险敞口：哪几个客户该做再平衡了？顺手记下明天的回访名单。' },
  { narration: '你翻看今天的行情和新闻对照复盘，把「预期差」三字写进了笔记——超预期的数据和行情反应往往不一致。' },
  { narration: '你统计了板块成交占比：过去一个月最热的方向，换手率与拥挤度都到了历史高分位。历史上每一次「一致看多」都伴随着拥挤交易退潮——记下来：人多的地方，风景再好也别停留。' },
  { narration: '下周是政策日历周：重要会议与数据发布扎堆。你把三个关键时点标进备忘录——同样的数据，发布前和发布后的市场反应往往是两个物种。' },
  { narration: '人民币汇率与出口数据的背离让你停下了复盘：汇率在稳、订单在变。宏观变量的传导有时滞，客户的现金流最先感知——这周该提醒那几个外贸老板了。' },
  { narration: '基金二季报披露完毕，你抽查了自己重仓产品的风格：说好的价值风格，前十大重仓悄悄换成了一半科技股。风格漂移不可怕，可怕的是你不知道它漂了。' },
  { narration: '你算了下主要指数的估值分位：十年视角，当前位置不贵。但「不贵」和「会涨」中间隔着流动性、业绩与情绪三条街——笔记写下四个字：便宜不是买点。' },
  { narration: '复盘方法论升级：你把过去一年的复盘笔记翻出来验证——当初的归因有多少兑现了？发现一半是「正确但没用」：方向对、时间错。复盘的价值不在结论，在迭代。' },
  { narration: '你注意到一个新迹象：连不炒股的客户都在问"要不要上车"。情绪指标从来不在研报里，在厅堂里。' },
  { narration: '你把近三年的月度 KPI 完成度画成柱状图：开门红月份的完成率与次年一季度的客诉率呈正相关——冲量是有后账的。' },
  { narration: '你复盘了"降息预期"交易：债基收益率曲线倒挂的前一周，聪明钱早已动过——利率行情，抢跑是常态，跟单要三思。' },
  { narration: '黄金、原油、谷物同步上行的日子，你把"通胀交易"四个字写在了笔记本扉页。' },
  { narration: '你对照了两轮牛市的基金发行数据：峰值销量都出现在指数滞涨月，"越涨越好卖，越好卖越危险"的规律从未缺席。' },
  { narration: '一位客户在熊末加仓成功。复盘时你发现：他不是勇敢，是提前两年规划了这笔钱——纪律才是勇气的真身。' },
  { narration: '北向资金连续三日流出而指数未跌，你记下：定价权的边际变化，往往先于市场共识。' },
  { narration: '你统计了客户咨询高峰：大跌日问"卖不卖"、大涨日问"买不买"、只有年报季有人问"我到底赚没赚"。' },
  { narration: '把本周的新闻按"政策/流动性/情绪"三层归档后，你发现市场每天在演三幕剧，而多数人只盯着第三幕。' },
  { narration: '你给组合做了压力测试：假如 2015 重演，几个客户的回撤会触及生活底线？答案让你连夜列了回访名单。' },
  { narration: '风格数据回来了：小盘跑赢大盘的月度差值创下近三年新高。均值回归也许迟到，但风格从不缺席。' },
  { narration: '你复盘了本季度的成交：急单占比高的月份，售后处理量也在上升——销售端的快，是服务端的慢。' },
  { narration: '理财破净数量与赎回压力的相关性，你画了散点图：2022 年 11 月那个右上角的点，值得写进教科书。' },
  { narration: '你开始用"一句话复述"检验归因质量：说清一个行情只用一句话，才叫理解；要用一段话，多半是编的。' },
  { narration: '利率下行期，长久期固收产品成了香饽饽。你记下反向风险：一旦利率反转，久期是双刃剑。' },
  { narration: '季度末复盘：AUM 的增长里，多少来自市场贝塔，多少来自真实新客？后者才是你带得走的业绩。' },
]

/** 行动小剧场构建：根据行动类型生成具体交互场景（接待走独立对话，不在其中） */
function buildActionScene(type: ActionType, r: ActionResult) {
  const g = getGame();
  if (type === 'reception') return;
  if (type === 'rest') { state.actionScene = null; return; }
  if (type === 'lobby') {
    const q = g.rng.pick(LOBBY_QUESTIONS);
    state.actionScene = {
      kind: 'lobby',
      narration: `厅堂轮值中，一位前来办业务的大爷把你拦下：${q.ask}`,
      result: r.text,
      options: q.options,
    };
  } else if (type === 'aftersale') {
    const s = g.rng.pick(AFTERSALE_SCENES);
    state.actionScene = { kind: 'aftersale', narration: s.narration, result: r.text, options: s.options };
  } else if (type === 'social') {
    const s = g.rng.pick(SOCIAL_SCENES);
    state.actionScene = { kind: 'social', narration: s.narration, result: r.text, options: s.options };
  } else if (type === 'outreach') {
    const s = g.rng.pick(OUTREACH_SCENES);
    state.actionScene = { kind: 'outreach', narration: s.narration, result: r.text, options: s.options };
  } else if (type === 'review') {
    const s = g.rng.pick(REVIEW_SCENES);
    state.actionScene = { kind: 'review', narration: s.narration, result: r.text };
  } else if (type === 'study') {
    // 学习刷题：从题库随机抽一题（练习玩法），答对/答错结算行动收益
    const pool = [...examBankAll, ...packQuestions()];
    const q = pool.length > 0 ? pool[Math.floor(g.rng.next() * pool.length) % pool.length] : null;
    if (q) {
      state.studyQuestion = { q, picked: q.type === 'multiple' ? [] : null, checked: false, correct: false };
      state.actionScene = { kind: 'study', narration: '你翻开题库刷一套题（答对专业力加成更多）：', result: r.text, question: q };
    } else {
      state.actionScene = { kind: 'study', narration: '你学习了金融知识并做了一套题。', result: r.text };
    }
  }
}

/** 行动小剧场：做出选择（good 与否微调本行动结果，追加进日志） */
export function resolveActionScene(idx: number) {
  const s = state.actionScene;
  if (!s?.options) { state.actionScene = null; return; }
  const opt = s.options[Math.min(idx, s.options.length - 1)];
  s.picked = idx;
  const g = getGame();
  const a = g.player.attrs;
  if (opt.good) {
    // 应对得当：信任/专业力/沟通小幅奖励，压力小幅缓解
    if (s.kind === 'aftersale') { a.stress = Math.max(0, a.stress - 2); pushLog(`【售后处理】应对得当：${opt.reply}（压力 -2）`); }
    else if (s.kind === 'lobby') { a.comm += 0.3; pushLog(`【厅堂轮值】答疑获好评：${opt.reply}（沟通力 +0.3）`); }
    else if (s.kind === 'outreach') { pushLog(`【外拓拜访】切入痛点：${opt.reply}`); }
    else if (s.kind === 'social') { a.comm += 0.2; pushLog(`【同事互动】${opt.reply}（沟通力 +0.2）`); }
    else pushLog(`【${ACTION_NAMES[s.kind]}】${opt.reply}`);
  } else {
    // 应对不当：小幅惩罚，压力上升
    a.stress += 2;
    pushLog(`【${ACTION_NAMES[s.kind]}】应对欠妥：${opt.reply}（压力 +2）`);
  }
  state.apUsed = g.apUsed;
  state.gameDate = g.date;
  state.lastResult = opt.reply;
  state.todayActions.push({ name: ACTION_NAMES[s.kind], text: opt.reply });
}

/** 学习刷题：勾选/选择选项 */
export function pickStudyAnswer(v: number | number[]) {
  if (state.studyQuestion && !state.studyQuestion.checked) state.studyQuestion.picked = v;
}

/** 学习刷题：核对当前题（答对专业力加成提升，答错记入错题本） */
export function checkStudyAnswer(): string {
  const sq = state.studyQuestion;
  if (!sq || sq.checked) return '';
  const q = sq.q;
  let correct = false;
  if (q.type === 'multiple') {
    const picks = [...(sq.picked as number[])].sort().join(',');
    correct = picks === (q.answer as number[]).slice().sort().join(',');
  } else {
    correct = sq.picked === q.answer;
  }
  sq.checked = true;
  sq.correct = correct;
  const g = getGame();
  const a = g.player.attrs;
  let msg: string;
  if (correct) {
    a.pro += 1.2;
    a.stress = Math.max(0, a.stress - 1);
    pushLog(`【学习刷题】答对「${q.stem.slice(0, 20)}…」专业力 +1.2。`);
    msg = '答对了！专业力 +1.2（比闷头看书高效多了）。';
  } else {
    a.pro += 0.4;
    pushWrongQuestions({ examId: q.subject, questions: [q], scores: [0], totalScore: 0 } as unknown as ExamPaper, [0]);
    pushLog(`【学习刷题】答错「${q.stem.slice(0, 20)}…」，已记入错题本（专业力 +0.4）。`);
    msg = '答错了……已记入错题本（专业力 +0.4）。看看解析补上这个知识点。';
  }
  state.apUsed = g.apUsed;
  state.gameDate = g.date;
  return msg;
}

/** 关闭行动小剧场 */
export function closeActionScene() {
  state.actionScene = null;
  state.studyQuestion = null;
}

/** 切换时间帧 */
export function switchFrame(f: TimeFrame): boolean {
  const ok = game.setFrame(f);
  if (ok) {
    state.apUsed = game.apUsed;
    state.todayActions = [];
    pushLog(`【操作】主动切换到${f === 'day' ? '日帧' : f === 'week' ? '周帧' : '月帧'}，行动点重置为 ${state.apMax}。`);
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
  pushLog(`【记忆】${r.hint}`);
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
  const all = [...VOLUME1_QUESTS, ...VOLUME2_QUESTS, ...VOLUME3_QUESTS, ...VOLUME4_QUESTS, ...VOLUME5_QUESTS, ...EASTER_QUESTS];
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
  // 卷一~卷六全量任务：QuestEngine 按 date 顺序触发，volume 字段仅用于进度/评语统计
  // R4 卷七（二周目来客）：仅 NG+ 局（playthrough≥2）注册；R5 卷八（薪火）：仅一周目局（playthrough=1）注册——两卷互斥，按周目分流
  const base = [...VOLUME1_QUESTS, ...VOLUME2_QUESTS, ...VOLUME3_QUESTS, ...VOLUME4_QUESTS, ...VOLUME5_QUESTS, ...EASTER_QUESTS];
  const quests = state.playthrough >= 2
    ? [...base, ...NG_PLUS_QUESTS]
    : [...base, ...VOLUME8_QUESTS];
  state.questEngine = new QuestEngine(
    quests as unknown as QuestDef[],
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
  } else if (d?.quest.id === 'q6_e7_heritage_craft' && state.questEngine) {
    // 彩蛋卷：e7 完成即全部实质章节达成（e8 终章为收束），e8 弹出前预生成卷六阶段评语
    state.volumeReview = computeVolumeReview(6);
  } else if (d?.quest.id === 'q6_e8_endgame_lights' && state.questEngine) {
    state.volumeReview = computeVolumeReview(6);
  }
}

/** P6-1 六结局判定（卷五末触发；结局画面在 QuestDialog volumeReview 之后展示） */
export function computeFinalEnding() {
  const g = getGame();
  const qe = state.questEngine;
  if (!qe) return;
  const prog = (n: number) => qe.volumeProgress(n);
  // R5：卷七（二周目）与卷八（一周目）互斥，按周目注册其一；单局主线恒为 82，全量内容 90
  const questsDone = [1, 2, 3, 4, 5, 6, 7, 8].reduce((a, v) => a + prog(v).done, 0);
  const questsTotal = [1, 2, 3, 4, 5, 6, 7, 8].reduce((a, v) => a + prog(v).total, 0);
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
  // 卷六彩蛋终章：结局画面之后到达 → 收起剧情弹窗，不盖结局
  if (d.quest.id === 'q6_e8_endgame_lights' && state.ending) {
    d.phase = 'result';
    d.resultText = res.outcome;
    d.resultGrade = res.grade;
    state.questDialog = null;
    pushLog('【彩蛋卷】「万家灯火」收束——八张回访单钉进档案最后一页。');
    return;
  }
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
  const res = game.resolveEvent(choiceIdx);
  // 事件处理结果入日志：玩家怎么处理的、造成什么影响
  if (res) {
    const eff = res.effects;
    const effTexts: string[] = [];
    if (eff?.trust) effTexts.push(`全体客户信任 ${eff.trust > 0 ? '+' : ''}${eff.trust}`);
    if (eff?.stress) effTexts.push(`压力 ${eff.stress > 0 ? '+' : ''}${eff.stress}`);
    if (eff?.fame) effTexts.push(`知名度 ${eff.fame > 0 ? '+' : ''}${eff.fame}`);
    if (eff?.aum) effTexts.push(`AUM ${fmtMoneyCN(eff.aum)}`);
    if (eff?.income) effTexts.push(`现金 ${fmtMoneyCN(eff.income)}`);
    const tag = res.risk === 'red' ? ' ⚠️ 触碰红线，违规 +1、口碑 -10！' : res.risk === 'grey' ? '（灰色地带处理）' : '';
    pushLog(`【事件】「${res.title}」${tag} ${res.outcomeText || '处理完毕'}${effTexts.length ? `（${effTexts.join('，')}）` : ''}`);
  }
  state.modal = null;
  // 月结/事件后自动存档一次
  autoSave();
}

export function pushLog(text: string) {
  state.log.unshift({ date: game.date, text });
  if (state.log.length > 200) state.log.pop();
}

export function markViewed() {
  if (game.lastSnap) state.baseSnap.since_view = game.lastSnap;
  // 进入行情终端视为已读新闻：红点清零
  state.newsSeen = state.news.length;
}

/** 未读新闻数（TopBar 工作台 tab 红点的数据源） */
export function unreadNews(): number {
  return Math.max(0, state.news.length - state.newsSeen);
}

// ================= 考试系统 =================

/** 考试模式：formal 正式考（发证书/耗精力/入档）· mock 模考（计时全流程，不发证书）· practice 练习（不限时，即时对错） */
export type ExamMode = 'formal' | 'mock' | 'practice';
/**
 * 当前可报名的科目。
 * 问题 4（试运行二批）：所有考试放开——不再按年代解锁，玩家随时可以报名任何证书；
 * 正式考仍受"开考月份（3/6/9/12）"窗口与报名费约束，练习/模考完全自由。
 */
export function availableExams() {
  return EXAM_DEFS;
}

/** 已获得的证书 */
export function myCerts(): string[] {
  return game.player.certs;
}

let rngExam: Rng | null = null;

/** 考前最后做的一套卷（冲刺押题的来源），LRU 只留最近一次 */
export interface LastPracticePaper {
  label: string;          // 如「模拟考·AFP 金融理财师认证」
  examId: string;
  /** 做错的题目（含错题本兜底前的本次错题），押题池 */
  wrong: ExamQuestion[];
  wrongCount: number;
  at: string;             // 游戏内日期
}
let lastPractice: LastPracticePaper | null = null;
/** 冲刺押题时被抽中的题（判分加成用） */
let crammedQuestionIds = new Set<string>();

/** lastPractice 的响应式版本号：Vue computed 无法追踪模块内 let，赋值时手动 +1 */
const lastPracticeVersion = ref(0);

export function lastPracticePaper(): LastPracticePaper | null {
  void lastPracticeVersion.value; // 建立响应式依赖
  return lastPractice;
}

/** 开始一场考试：抽卷并进入答题界面 */
export function startExam(examId: string, mode: ExamMode = 'formal'): boolean {
  const exam = EXAM_DEFS.find((e) => e.id === examId);
  if (!exam) return false;
  if (mode === 'formal' && game.player.certs.includes(exam.name)) return false;
  // 冲刺 buff：正式考试抽卷时，把考前最后做的一套卷中 20% 错题押进正题
  crammedQuestionIds = new Set();
  // 冲刺 buff：临时专业力加成（仅在考试判定内使用）
  const cramBoost = mode === 'formal' && cramActive() ? 6 : 0;
  const savedPro = game.player.attrs.pro;
  if (cramBoost) game.player.attrs.pro += cramBoost;
  rngExam ??= new Rng(game.rngNextInt());
  // 抽卷用 rng；判分通过率由专业力影响（简化：通过线降低 = pro 加成）
  // P4：并入行内题包（同科目追加进池，抽卷配比算法自动兼容）
  // 双审门禁（规划 §15-A1）：正式模式只放行 review.status==='approved' 的题；
  // 练习/模考为学习用途，放行全部题（当前题库均为 draft 待人工审，正式考需培训后台开开发模式或人工审完后可用）
  const bankPool = [...examBankAll, ...packQuestions()];
  const pool = mode === 'formal' ? bankPool.filter(passesReviewGate) : bankPool;
  if (pool.length === 0) {
    // 正式考过审题不足：给出明确提示而不是崩溃（draft 题在人工双审完成后自动可用）
    pushLog(`【考证】「${exam.name}」暂无过审题目（人工双审进行中），请先用练习/模考备考，或在培训后台开启开发模式。`);
    return false;
  }
  let paper = buildPaper(exam, pool, rngExam);
  if (cramBoost) game.player.attrs.pro = savedPro; // 还原，buff 在判分阶段再乘
  // 冲刺押题：把押题池中属于本科目的错题替换进卷子（至多卷面的 20%）
  if (mode === 'formal' && cramActive() && lastPractice) {
    const candidates = lastPractice.wrong.filter((q) => q.subject === examId && !paper.questions.some((p) => p.id === q.id));
    const maxCram = Math.max(1, Math.floor(paper.questions.length * 0.2));
    const picks = candidates.slice(0, Math.min(maxCram, candidates.length));
    if (picks.length > 0) {
      // 从卷尾替换（保住题型交错的开头；同题型优先替换，简化：直接顶替末尾 n 题）
      for (let i = 0; i < picks.length; i++) {
        paper.questions[paper.questions.length - 1 - i] = picks[i];
      }
      // 重建分值表
      paper = { ...paper, questions: [...paper.questions], scores: paper.questions.map(questionScore) };
      paper.scores = paper.questions.map(questionScore);
      paper.totalScore = paper.scores.reduce((a, b) => a + b, 0);
      crammedQuestionIds = new Set(picks.map((q) => q.id));
      pushLog(`【押题】冲刺 buff 生效：${picks.length} 道最近做错的题被押进了「${exam.name}」考卷（复习没白费）。`);
    }
  }
  state.examMode = mode;
  state.examPaper = paper;
  state.examAnswers = paper.questions.map((q) => (q.type === 'multiple' ? [] : -1));
  state.examIdx = 0;
  state.examResult = null;
  state.examScreen = 'taking';
  // 练习/模考不限时（问题 4：只有正式考保留计时）；正式按科目限时
  state.examSecondsLeft = mode === 'formal' ? exam.time_limit_sec : -1;
  if (state.examTimer) clearInterval(state.examTimer);
  if (mode === 'formal') {
    state.examTimer = setInterval(() => {
      state.examSecondsLeft -= 1;
      if (state.examSecondsLeft <= 0) submitExam();
    }, 1000);
  }
  return true;
}

/** 练习模式：单题即时判对错（提交本题，直接展示正误与解析） */
export function checkPracticeAnswer(idx: number): boolean {
  const paper = state.examPaper;
  if (!paper || state.examMode !== 'practice') return false;
  const q = paper.questions[idx];
  const ans = state.examAnswers[idx];
  let correct = false;
  if (q.type === 'multiple') {
    const right = [...(q.answer as number[])].sort();
    const given = Array.isArray(ans) ? [...ans].sort() : [];
    correct = given.length === right.length && given.every((v, i) => v === right[i]);
  } else {
    correct = ans === q.answer;
  }
  state.practiceFeedback = { idx, correct };
  return correct;
}

export function clearPracticeFeedback() {
  state.practiceFeedback = null;
}

export function submitExam() {
  if (!state.examPaper || state.examScreen !== 'taking') return;
  if (state.examTimer) { clearInterval(state.examTimer); state.examTimer = 0; }
  const mode = state.examMode;
  const res = gradePaper(state.examPaper, state.examAnswers);
  // 冲刺 buff：正式考通过线判定时给 3 分宽限（临时抱佛脚的临场效应）
  if (mode === 'formal' && cramActive()) res.scorePct = Math.min(100, res.scorePct + 3);
  state.examResult = res;
  state.examScreen = 'result';
  const exam = EXAM_DEFS.find((e) => e.id === state.examPaper!.examId);
  const examName = exam?.name ?? res.examId;
  // 记录"考前最后做的一套卷"（冲刺押题数据源：正式/模考/练习都算）
  const wrongQs = state.examPaper.questions.filter((_, i) => res.perQuestion[i] < 1);
  lastPractice = {
    label: `${mode === 'formal' ? '正式考' : mode === 'mock' ? '模拟考' : '练习卷'}·${examName}`,
    examId: res.examId,
    wrong: wrongQs,
    wrongCount: wrongQs.length,
    at: game.date,
  };
  lastPracticeVersion.value += 1;
  pushWrongQuestions(state.examPaper, res.perQuestion);
  touchActiveDay(game.date);
  if (mode === 'formal') {
    try {
      const attempts = Number(storage.get('fm_exam_attempts') ?? 0) + 1;
      storage.set('fm_exam_attempts', String(attempts));
    } catch { /* 忽略 */ }
    // P4 学习记录：考试明细入档（讲师报表通过率数据源）
    recordExamAttempt({ examId: res.examId, examName, passed: res.passed, scorePct: res.scorePct, at: game.date });
    if (res.passed && exam && !game.player.certs.includes(exam.name)) {
      game.player.certs.push(exam.name);
      game.player.attrs.pro += 5;
      pushLog(`【考证】通过「${examName}」考试（${res.scorePct.toFixed(1)} 分），证书已入库，专业力 +5。`);
    } else {
      pushLog(`【考证】「${examName}」正式考成绩 ${res.scorePct.toFixed(1)} 分，未通过。复盘错题，下季度再战。`);
    }
    game.player.energy = Math.max(0, game.player.energy - 20);
    game.player.attrs.stress += 8;
  } else {
    // 练习/模考：只给轻微成长反馈，不耗精力不入档
    const tag = mode === 'mock' ? '【模考】' : '【练习】';
    pushLog(`${tag}「${examName}」${mode === 'mock' ? '全真模拟' : '自主练习'}完成，成绩 ${res.scorePct.toFixed(1)} 分（${res.correctCount}/${state.examPaper.questions.length} 题）。错题已入错题本，正式考试不收报名费、不发证——先练后战。`);
    if (mode === 'mock') {
      game.player.attrs.pro += 1; // 全真模考的临场经验
    } else {
      game.player.attrs.pro += 0.5;
      game.player.attrs.stress = Math.max(0, game.player.attrs.stress - 1); // 刷题减压
    }
  }
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

/** C1 错题重练会话类型（实现见下方「错题重练模式」段） */
export interface RedoSession {
  questions: ExamQuestion[];
  answers: Array<number | number[]>;
  idx: number;
  checked: boolean[];
  correct: boolean[];
  finished: boolean;
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
    for (const t of w.knowledge_tags ?? []) counter[t] = (weak_counter(t, counter), counter[t]);
  }
  return Object.entries(counter)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}
function weak_counter(tag: string, counter: Record<string, number>) {
  counter[tag] = (counter[tag] ?? 0) + 1;
}

// ================= C1 错题重练模式 =================

/** 重练会话：错题本组卷（至多 10 题，全题型），即时反馈 + 重做统计 */

/** 开一场错题重练：从错题本抽题（questionId 反查题库原题） */
export function startWrongRedo(limit = 10): string {
  const book = wrongBook();
  if (book.length === 0) return '错题本是空的，先去做一套练习/模考吧。';
  const pool = [...examBankAll, ...packQuestions()];
  const byId = new Map(pool.map((q) => [q.id, q]));
  const qs: ExamQuestion[] = [];
  for (const w of book) {
    const q = byId.get(w.questionId);
    if (q && !qs.some((x) => x.id === q.id)) qs.push(q);
    if (qs.length >= limit) break;
  }
  if (qs.length === 0) return '错题本里的题目在题库中已不存在（题包更新），已自动跳过。试试清空错题本。';
  state.redoSession = {
    questions: qs,
    answers: qs.map((q) => (q.type === 'multiple' ? [] : -1)),
    idx: 0,
    checked: qs.map(() => false),
    correct: qs.map(() => false),
    finished: false,
  };
  pushLog(`【错题重练】组卷 ${qs.length} 题（来自错题本），开始重做。`);
  return `已组卷 ${qs.length} 题，开始重练。`;
}

export function redoAnswerSingle(idx: number, opt: number) {
  const s = state.redoSession;
  if (s && !s.checked[idx]) s.answers[idx] = opt;
}
export function redoToggleMulti(idx: number, opt: number) {
  const s = state.redoSession;
  if (!s || s.checked[idx]) return;
  const cur = s.answers[idx];
  const arr = Array.isArray(cur) ? [...cur] : [];
  const pos = arr.indexOf(opt);
  if (pos >= 0) arr.splice(pos, 1); else arr.push(opt);
  s.answers[idx] = arr;
}

/** 核对当前题（即时反馈） */
export function redoCheck(): boolean {
  const s = state.redoSession;
  if (!s) return false;
  const q = s.questions[s.idx];
  const ans = s.answers[s.idx];
  let correct = false;
  if (q.type === 'multiple') {
    const right = [...(q.answer as number[])].sort();
    const given = Array.isArray(ans) ? [...ans].sort() : [];
    correct = given.length === right.length && given.every((v, i) => v === right[i]);
  } else {
    correct = ans === q.answer;
  }
  s.checked[s.idx] = true;
  s.correct[s.idx] = correct;
  return correct;
}

export function redoNext() {
  const s = state.redoSession;
  if (!s) return;
  if (s.idx < s.questions.length - 1) { s.idx += 1; }
  else {
    // 收卷：统计 + 全对从错题本移除（重练毕业）
    const right = s.correct.filter(Boolean).length;
    const all = s.correct.length;
    g_redoStat(right, all);
    if (right === all) {
      // 全对：这些题从错题本毕业
      const done = new Set(s.questions.map((q) => q.id));
      storage.set('fm_wrong_book', JSON.stringify(wrongBook().filter((w) => !done.has(w.questionId))));
      pushLog(`【错题重练】${all} 题全对！这些题已从错题本毕业（专业力 +${(all * 0.4).toFixed(1)}）。`);
      const g = getGame();
      g.player.attrs.pro += all * 0.4;
      g.player.attrs.stress = Math.max(0, g.player.attrs.stress - 2);
    } else {
      pushLog(`【错题重练】${right}/${all} 题，做错的题继续留在错题本里下次再战（专业力 +${(right * 0.4).toFixed(1)}）。`);
      const g = getGame();
      g.player.attrs.pro += right * 0.4;
    }
    touchActiveDay(getGame().date);
    s.finished = true;
  }
}

function g_redoStat(right: number, total: number) {
  const arr = redoHistory();
  arr.unshift({ at: getGame().date, right, total });
  storage.set('fm_redo_history', JSON.stringify(arr.slice(0, 50)));
  redoHistoryVersion.value += 1; // 响应式版本号：收卷后历史面板即时刷新
}

/** 重练历史（C2 考试历史区域展示；模块级 storage 直读挂版本号保证响应式） */
const redoHistoryVersion = ref(0);
export function redoHistory(): Array<{ at: string; right: number; total: number }> {
  void redoHistoryVersion.value;
  const raw = storage.get('fm_redo_history');
  return raw ? JSON.parse(raw) : [];
}

export function quitRedo() {
  state.redoSession = null;
}

/** 考前冲刺：点击后激活 buff——下一次正考抽卷时，考前最后做的一套卷（练习/模考/正式）中
 *  做错的 20% 题目会被直接选进考卷正题（规划书 7.5"临时抱佛脚"的具象化）。 */
export function cramForExam(): string {
  const g = getGame();
  if (state.apUsed >= state.apMax) return '本帧行动点已用完，无法冲刺。';
  state.apUsed += 1;
  g.player.attrs.stress += 3;
  g.player.energy = Math.max(0, g.player.energy - 8);
  // 冲刺 buff：真实时间戳实现，开启下一次正式考试的"错题押题"效果
  storage.set('fm_cram_until', String(Date.now() + 24 * 3600 * 1000));
  const last = lastPracticePaper();
  const poolNote = last ? `押题池来源：${last.label}（${last.wrongCount} 道错题）。` : '提示：先做一套练习/模考攒下错题，冲刺押题才有子弹。';
  pushLog(`【考前冲刺】通宵复盘近期错卷（压力 +3、精力 -8）。激活押题 buff：下一次正式考试会把考前最后做的一套卷中 20% 错题带进考卷。${poolNote}`);
  return '冲刺完成！下一次正式考试将押中最近一套卷的 20% 错题（持续到明天）。';
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

/** 接待对话 ================= */

let receptionEngine: Reception | null = null;

/** A3 预约到访系统：把"谁该来"变成玩家可经营的对象——
 *  - 转介绍/人生线/流失预警客户会自动进入下月预约队列（月结时生成）
 *  - 玩家也可以在客户档案页主动约客户到访（1 AP：电话邀约）
 *  - 接待行动优先接待队列中的客户（接待引擎按指定客户开局）
 */

/** 电话邀约：1 AP，把指定客户约进本/下月到访队列（信任越高越答应） */
export function inviteClient(clientId: string): string {
  const g = getGame();
  if (state.apUsed >= state.apMax) return '本帧行动点已用完，无法邀约。';
  const c = g.clients.find((x) => x.id === clientId);
  if (!c) return '查无此客户。';
  if (c.status !== 'active') return `${c.name} 目前账户休眠，先通过持续回访恢复信任到 45 以上才会回来。`;
  if (state.appointments.some((a) => a.clientId === clientId)) return `${c.name} 已在预约队列里。`;
  if (state.appointments.length >= 6) return '本月预约队列已满（6 位），先接待完再约。';
  const agree = g.rng.chance(0.35 + c.trust / 150); // 信任 30 → 55%，信任 75 → 85%
  state.apUsed += 1;
  state.gameDate = g.date;
  if (!agree) {
    pushLog(`【邀约】给${c.name}打电话约时间，对方说最近忙，过段时间再说（信任 ${Math.round(c.trust)}，越高越容易答应）。`);
    return `${c.name} 暂时没答应，提升信任后再试试。`;
  }
  const reason = c.holdings.length === 0
    ? '聊聊资产配置'
    : g.clientPnlPct(c) < -5 ? '安抚持仓波动、做归因沟通' : '做年度持仓检视';
  state.appointments.push({
    id: `apt_${Date.now()}_${Math.floor(g.rng.next() * 1e4)}`,
    clientId, clientName: c.name,
    month: g.date.slice(0, 7),
    reason, from: 'manual',
  });
  pushLog(`【邀约】${c.name} 答应${reason}，已加入本月预约队列（共 ${state.appointments.length} 位待接待）。`);
  return `${c.name} 已约到本月到访。`;
}

/** 月结时自动生成预约：转介绍客户/流失预警客户主动到访（u 内部由 core 事件驱动此处入队） */
export function enqueueAppointment(entry: { clientId: string; clientName: string; reason: string; from: 'referral' | 'warning' | 'life' }) {
  if (state.appointments.length >= 6) return;
  if (state.appointments.some((a) => a.clientId === entry.clientId)) return;
  state.appointments.push({
    id: `apt_${Date.now()}_${Math.floor(Math.random() * 1e4)}`,
    month: getGame().date.slice(0, 7),
    ...entry,
  });
  pushLog(`【预约】${entry.clientName} 来电预约到访：${entry.reason}。`);
}

/** 开始接待：若预约队列有客户，优先接待预约客户 */
export function startReception(): boolean {
  const g = getGame();
  if (state.apUsed >= state.apMax) return false;
  receptionEngine ??= new Reception(g.rng);
  // 预约队列优先：消费最早一条
  const aptIdx = state.appointments.findIndex((a) => a.clientId && g.clients.some((c) => c.id === a.clientId && c.status === 'active'));
  const apt = aptIdx >= 0 ? state.appointments[aptIdx] : null;
  const s = apt
    ? receptionEngine.startFor(g.clients, apt.clientId)
    : receptionEngine.start(g.clients);
  if (!s) return false;
  if (apt) {
    state.appointments.splice(aptIdx, 1);
    pushLog(`【预约到访】${apt.clientName} 如约而至（${apt.reason}）。`);
  }
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
    pushLog(`【接待】${state.reception.clientName}提前送客，未做推荐（信任 -2）。接待了但没聊透，下次记得先挖潜。`);
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
  let dealResult = '';
  if (evalRes.deal) {
    const res = g.executeDeal(client, product, state.receptionAmount);
    if (res.ok) {
      dealResult = `✓ 成交！AUM +${fmtMoneyCN(state.receptionAmount)}`;
      state.receptionLog.push({ who: 'sys', text: dealResult });
    } else {
      dealResult = `✗ 成交失败：${res.reason}`;
      state.receptionLog.push({ who: 'sys', text: dealResult });
    }
  }
  // 信任结算（挖潜收益 + 推荐反馈）
  client.trust = Math.max(0, Math.min(100, client.trust + s.trustGained * 0.5 + evalRes.trustDelta));
  // 接待结果完整入工作台日志：客户/产品/结果/信任变化
  const probeCnt = s.probed;
  const probeNote = probeCnt >= 2 ? '充分挖潜后推荐' : probeCnt === 1 ? '简单挖潜后推荐' : '未挖潜直接推荐';
  const trustNow = Math.round(client.trust);
  pushLog(
    `【接待】${s.clientName}到访，${probeNote}「${product.name}」（${fmtMoneyCN(state.receptionAmount)}）。结果：${evalRes.deal ? dealResult : `未成交——${evalRes.reason}`}${evalRes.trustDelta ? `，客户反馈信任 ${evalRes.trustDelta > 0 ? '+' : ''}${evalRes.trustDelta}` : ''}。当前信任 ${trustNow}。`,
  );
  touchActiveDay(game.date);
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
  // A0 生涯统计恢复（旧档无字段则用空结构，保证字段完整）
  g.stats = { ...emptyStats(), ...(data.stats ?? {}) };
  if (Array.isArray(data.statsServed)) (g as any).servedClients = new Set(data.statsServed);
  if (typeof data.monthDeals === 'number') g.monthDeals = data.monthDeals;
  if (typeof data.monthReceptions === 'number') g.monthReceptions = data.monthReceptions;
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
  // A3 预约队列恢复 / D1 设置恢复
  state.appointments = Array.isArray(data.appointments) ? data.appointments : [];
  loadSettings();
  pushLog(`【读档】已恢复到 ${g.date} 的进度。`);
  // 读档后重置自动存档计时（10 分钟轮转）
  autoSave();
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
