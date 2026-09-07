import type { EconReleaseDef } from '@fm/core';

/** 经济数据日历（M0 核心集）：中方月度 3 项 + 美方月度 2 项 + 议息（事件） */
export const releases: EconReleaseDef[] = [
  {
    id: 'cpi_cn', name: 'CPI 同比', region: 'cn', freq: 'monthly', day_hint: 9,
    impact_beat: { rate10y: 0.002, equity: -0.004, liquidity: -0.004 },
    impact_miss: { rate10y: -0.002, equity: 0.003, liquidity: 0.004 },
    note: '%',
  },
  {
    id: 'pmi_cn', name: '制造业 PMI', region: 'cn', freq: 'monthly', day_hint: 1,
    impact_beat: { equity: 0.005, credit: -0.0005, liquidity: 0.003 },
    impact_miss: { equity: -0.004, credit: 0.0005, liquidity: -0.003 },
    note: '',
  },
  {
    id: 'tsf_cn', name: '社融增量', region: 'cn', freq: 'monthly', day_hint: 12,
    impact_beat: { equity: 0.006, liquidity: 0.005, credit: -0.001 },
    impact_miss: { equity: -0.005, liquidity: -0.004, credit: 0.001 },
    note: '万亿',
  },
  {
    id: 'nfp_us', name: '非农就业', region: 'us', freq: 'monthly', day_hint: 3,
    impact_beat: { fed_rate: 0.0002, us10y: 0.0015, usd_idx: 0.002, gold: -0.004, us_equity: 0.001 },
    impact_miss: { fed_rate: -0.0002, us10y: -0.0015, usd_idx: -0.002, gold: 0.004, us_equity: -0.001 },
    note: '万人',
  },
  {
    id: 'cpi_us', name: '美国 CPI 同比', region: 'us', freq: 'monthly', day_hint: 13,
    impact_beat: { fed_rate: 0.0003, us10y: 0.002, usd_idx: 0.003, gold: -0.005, us_equity: -0.003 },
    impact_miss: { fed_rate: -0.0003, us10y: -0.002, usd_idx: -0.003, gold: 0.005, us_equity: 0.003 },
    note: '%',
  },
];
