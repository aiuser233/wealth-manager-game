import { reactive, computed } from 'vue';
import {
  GameCalendar, MarketSim, Game, Rng,
  type MarketSnapshot, type IsoDate, type ActionResult, type ActionType,
} from '@fm/core';
import { contentBundle, eraDrift, eraLevel } from '@fm/content';

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

export function pushLog(text: string) {
  state.log.unshift({ date: game.date, text });
  if (state.log.length > 200) state.log.pop();
}

export function markViewed() {
  if (game.lastSnap) state.baseSnap.since_view = game.lastSnap;
}

export function fmtPct(v: number | undefined): string {
  if (v === undefined || !isFinite(v)) return '--';
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
}

export function pctClass(v: number | undefined): string {
  if (v === undefined || !isFinite(v)) return 'dim';
  return v >= 0 ? 'up' : 'down';
}

export { cal, game as currentGame };
