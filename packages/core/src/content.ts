import type { GameEventDef, MarketFactorDef, IndustryIndexDef, EconReleaseDef, ProductDef, ClientDef } from './types';

export interface ContentBundle {
  factors: MarketFactorDef[];
  industries: IndustryIndexDef[];
  events: GameEventDef[];
  releases: EconReleaseDef[];
  products: ProductDef[];
  clients: ClientDef[];
}

export function validateContent(b: ContentBundle): string[] {
  const errs: string[] = [];
  const factorIds = new Set(b.factors.map((f) => f.id));
  if (factorIds.size !== b.factors.length) errs.push('因子 id 重复');
  for (const ind of b.industries) {
    for (const k of Object.keys(ind.loadings)) {
      if (!factorIds.has(k)) errs.push(`行业 ${ind.id} 引用了未知因子 ${k}`);
    }
  }
  for (const ev of b.events) {
    for (const k of Object.keys(ev.shocks ?? {})) {
      if (!factorIds.has(k)) errs.push(`事件 ${ev.id} 冲击了未知因子 ${k}`);
    }
  }
  const prodIds = new Set(b.products.map((p) => p.id));
  if (prodIds.size !== b.products.length) errs.push('产品 id 重复');
  for (const c of b.clients) {
    if (!['mass', 'wealth', 'vip', 'private'].includes(c.tier)) errs.push(`客户 ${c.id} tier 非法`);
  }
  return errs;
}
