import type { ProductDef, IsoDate } from './types';
import type { MarketSim } from './market';

/**
 * 产品净值引擎 v1（规划书 6.3/5.5）：
 * - 固定利率型（fixed_rate_pa）：单利按天计提
 * - 净值型（nav_model）：票息/365 - 费用/365 + 因子暴露×因子日收益（利率型因子按敏感度折算） + 特质噪声
 * - 懒计算 + LRU 缓存：同一天同一产品只算一次
 */
const navCache = new Map<string, number>();

function cacheKey(productId: string, cursor: number): string {
  return `${productId}@${cursor}`;
}

function pruneCache() {
  if (navCache.size > 20000) {
    // 简单 FIFO 淘汰
    let n = 5000;
    for (const k of navCache.keys()) {
      navCache.delete(k);
      if (--n <= 0) break;
    }
  }
}

/** 洗掉种子噪声（每产品固定流，避免随调用顺序漂移） */
function idioNoise(seedKey: string, cursor: number): number {
  let h = 2166136261 >>> 0;
  const s = `${seedKey}|${cursor}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // FNV → [0,1)
  const u = ((h >>> 8) % 100000) / 100000;
  // 近似正态（Irwin-Hall 3 项）
  return (u + u + u - 1.5) * 0.816;
}

/** 产品在某交易日的单位净值（从 cursor0=1.0 起复权） */
export function productNavAt(
  sim: MarketSim,
  product: ProductDef,
  cursor: number,
  seed: number,
): number {
  if (cursor <= 0) return 1;
  const key = cacheKey(product.id, cursor);
  const hit = navCache.get(key);
  if (hit !== undefined) return hit;

  // 固定利率型：单利
  if (!product.nav_model) {
    const nav = 1 + (product.fixed_rate_pa ?? product.benchmark_pa) * (cursor / 250);
    navCache.set(key, nav);
    return nav;
  }

  const nm = product.nav_model;
  // 从缓存或 1.0 递推：找最近的更小 cursor 缓存
  let startCursor = 0;
  let nav = 1;
  for (let back = 1; back <= 10; back++) {
    const prev = navCache.get(cacheKey(product.id, cursor - back));
    if (prev !== undefined) {
      startCursor = cursor - back;
      nav = prev;
      break;
    }
  }
  for (let c = startCursor + 1; c <= cursor; c++) {
    const dayRets = sim.factorHistory[c - 1]?.rets;
    let r = nm.coupon_pa / 250 - nm.fee_pa / 250 + idioNoise(`${seed}|${product.id}`, c) * nm.idio_sigma;
    if (dayRets) {
      for (const [fid, beta] of Object.entries(nm.loadings)) {
        const v = dayRets[fid] ?? 0;
        // 利率型因子在 rets 里是绝对变化（小数）；价格型是对数收益率
        const isRate = fid === 'rate10y' || fid === 'lpr_5y' || fid === 'fed_rate' || fid === 'us10y' || fid === 'credit';
        r += isRate ? beta * v * 100 : beta * v;
      }
    }
    // 结构性保护：净值不为负；现金管理类波动 clamp
    r = Math.max(-0.03, Math.min(0.03, r));
    nav *= Math.exp(r);
  }
  nav = Math.max(0.05, nav);
  navCache.set(key, nav);
  pruneCache();
  return nav;
}

/** 持仓现值 */
export function holdingValue(
  sim: MarketSim,
  product: ProductDef,
  amount: number,
  navAtBuy: number,
  cursor: number,
  seed: number,
): number {
  const nav = productNavAt(sim, product, cursor, seed);
  return amount * (nav / Math.max(0.0001, navAtBuy));
}

/** 产品在当前日期是否在架 */
export function productOnShelf(p: ProductDef, date: IsoDate): boolean {
  if (!p.era) return true;
  const y = Number(date.slice(0, 4));
  return y >= p.era[0] && y <= p.era[1];
}
