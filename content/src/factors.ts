import type { MarketFactorDef } from '@fm/core';

/** 18 因子（M0 版）：全球层 8 + 国内层 10 */
export const factors: MarketFactorDef[] = [
  // ===== 全球层 =====
  { id: 'fed_rate', name: '美联储政策利率', layer: 'global', start: 0.0425, sigma_daily: 0.0002, mean_revert: 0.1, anchor: 0.0425, is_rate: true, floor: 0.0005, unit: 'rate' },
  { id: 'us10y', name: '美债10年期收益率', layer: 'global', start: 0.0440, sigma_daily: 0.0004, mean_revert: 0.15, anchor: 0.0440, is_rate: true, floor: 0.004, unit: 'rate' },
  { id: 'usd_idx', name: '美元指数', layer: 'global', start: 91.0, sigma_daily: 0.0035, drift_pa: 0.005, mean_revert: 0.0004, unit: 'fx' },
  { id: 'us_equity', name: '美股（纳指）', layer: 'global', start: 2200, sigma_daily: 0.0095, drift_pa: 0.075, mean_revert: 0.0002, unit: 'index' },
  { id: 'vix', name: '恐慌指数 VIX', layer: 'global', start: 13, sigma_daily: 0.05, mean_revert: 0.01, anchor: 15, floor: 9, unit: 'index' },
  { id: 'oil', name: '原油', layer: 'global', start: 62, sigma_daily: 0.016, drift_pa: 0.04, mean_revert: 0.0006, anchor: 70, unit: 'index' },
  { id: 'gold', name: '黄金', layer: 'global', start: 540, sigma_daily: 0.008, drift_pa: 0.07, mean_revert: 0.0003, unit: 'index' },
  { id: 'risk_g', name: '全球风险情绪', layer: 'global', start: 100, sigma_daily: 0.012, mean_revert: 0.002, anchor: 100, unit: 'index' },
  // ===== 国内层 =====
  { id: 'equity', name: 'A 股整体', layer: 'domestic', start: 1160, sigma_daily: 0.011, drift_pa: 0.055, mean_revert: 0.0002, unit: 'index' },
  { id: 'style_big', name: '大盘/价值风格', layer: 'domestic', start: 1000, sigma_daily: 0.009, drift_pa: 0.05, mean_revert: 0.0002, unit: 'index' },
  { id: 'style_small', name: '小盘/成长风格', layer: 'domestic', start: 1000, sigma_daily: 0.013, drift_pa: 0.06, mean_revert: 0.0002, unit: 'index' },
  { id: 'rate10y', name: '10 年期国债收益率', layer: 'domestic', start: 0.0280, sigma_daily: 0.0003, mean_revert: 0.1, anchor: 0.0280, is_rate: true, floor: 0.005, unit: 'rate' },
  { id: 'lpr_5y', name: '5 年期 LPR', layer: 'domestic', start: 0.0612, sigma_daily: 0.0001, mean_revert: 0.05, anchor: 0.0612, is_rate: true, floor: 0.01, unit: 'rate' },
  { id: 'credit', name: '信用利差', layer: 'domestic', start: 0.0110, sigma_daily: 0.0004, mean_revert: 0.12, anchor: 0.0110, is_rate: true, floor: 0.002, unit: 'spread' },
  { id: 'housing', name: '房价指数', layer: 'domestic', start: 100, sigma_daily: 0.0015, drift_pa: 0.075, mean_revert: 0.0003, unit: 'index' },
  { id: 'fx_cny', name: '人民币汇率（兑美元）', layer: 'domestic', start: 8.07, sigma_daily: 0.0012, drift_pa: -0.015, mean_revert: 0.0004, unit: 'fx' },
  { id: 'liquidity', name: '国内流动性', layer: 'domestic', start: 100, sigma_daily: 0.01, mean_revert: 0.003, anchor: 100, unit: 'index' },
  { id: 'sentiment_dom', name: '市场情绪', layer: 'domestic', start: 0, sigma_daily: 0.04, mean_revert: 0.01, anchor: 0, unit: 'index' },
];
