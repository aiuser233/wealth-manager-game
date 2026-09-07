import type { IndustryIndexDef } from '@fm/core';

const F = 'financial_realestate' as const;
const C = 'cyclical' as const;
const S = 'consumer' as const;
const P = 'pharma' as const;
const T = 'tech' as const;
const U = 'utility' as const;

/** 31 个行业指数（架空命名，仿申万一级风格） */
export const industries: IndustryIndexDef[] = [
  // 金融地产族
  { id: 'ind_bank', name: '玄商银行指数', family: F, start: 1000, idio_sigma: 0.008, drift_pa: 0.045, loadings: { equity: 0.85, style_big: 0.5, rate10y: -0.6, credit: -0.3, liquidity: 0.2 } },
  { id: 'ind_broker', name: '玄远券商指数', family: F, start: 1000, idio_sigma: 0.014, drift_pa: 0.05, loadings: { equity: 1.5, style_big: 0.3, sentiment_dom: 0.8, liquidity: 0.3 } },
  { id: 'ind_insurance', name: '安泰保险指数', family: F, start: 1000, idio_sigma: 0.011, drift_pa: 0.05, loadings: { equity: 1.0, style_big: 0.4, rate10y: -0.8 } },
  { id: 'ind_realestate', name: '恒基地产指数', family: F, start: 1000, idio_sigma: 0.013, drift_pa: 0.03, loadings: { equity: 1.0, housing: 0.9, lpr_5y: -2.5, credit: -0.5 } },
  // 周期资源族
  { id: 'ind_coal', name: '乌金煤炭指数', family: C, start: 1000, idio_sigma: 0.013, drift_pa: 0.05, loadings: { equity: 1.1, oil: 0.35, style_big: 0.3, risk_g: 0.2 } },
  { id: 'ind_steel', name: '铸铁钢铁指数', family: C, start: 1000, idio_sigma: 0.013, drift_pa: 0.03, loadings: { equity: 1.2, style_big: 0.4, housing: 0.4 } },
  { id: 'ind_nonferrous', name: '有色金属指数', family: C, start: 1000, idio_sigma: 0.015, drift_pa: 0.05, loadings: { equity: 1.25, oil: 0.25, usd_idx: -0.5, gold: 0.2 } },
  { id: 'ind_chem', name: '华学化工指数', family: C, start: 1000, idio_sigma: 0.012, drift_pa: 0.04, loadings: { equity: 1.15, oil: 0.3, style_small: 0.3 } },
  { id: 'ind_buildmat', name: '基石建材指数', family: C, start: 1000, idio_sigma: 0.012, drift_pa: 0.03, loadings: { equity: 1.1, housing: 0.6, style_big: 0.3 } },
  { id: 'ind_machinery', name: '重工机械指数', family: C, start: 1000, idio_sigma: 0.012, drift_pa: 0.045, loadings: { equity: 1.2, style_big: 0.4, housing: 0.35 } },
  { id: 'ind_transport', name: '通达运输指数', family: C, start: 1000, idio_sigma: 0.01, drift_pa: 0.035, loadings: { equity: 0.95, oil: -0.3, style_big: 0.35 } },
  { id: 'ind_agri', name: '丰年农业指数', family: C, start: 1000, idio_sigma: 0.013, drift_pa: 0.04, loadings: { equity: 1.0, style_small: 0.4, oil: 0.15 } },
  // 消费族
  { id: 'ind_foodbev', name: '醇香食品饮料指数', family: S, start: 1000, idio_sigma: 0.009, drift_pa: 0.075, loadings: { equity: 0.85, style_big: 0.55, sentiment_dom: 0.1 } },
  { id: 'ind_homeapp', name: '悦居家电指数', family: S, start: 1000, idio_sigma: 0.011, drift_pa: 0.05, loadings: { equity: 1.0, housing: 0.5, style_big: 0.3 } },
  { id: 'ind_textile', name: '锦裳纺织服装指数', family: S, start: 1000, idio_sigma: 0.011, drift_pa: 0.03, loadings: { equity: 0.95, style_small: 0.35 } },
  { id: 'ind_retail', name: '万商零售指数', family: S, start: 1000, idio_sigma: 0.011, drift_pa: 0.03, loadings: { equity: 1.0, sentiment_dom: 0.25, style_big: 0.2 } },
  { id: 'ind_tourism', name: '山水旅游指数', family: S, start: 1000, idio_sigma: 0.014, drift_pa: 0.05, loadings: { equity: 1.1, sentiment_dom: 0.4, risk_g: -0.2 } },
  { id: 'ind_auto', name: '驰骋汽车指数', family: S, start: 1000, idio_sigma: 0.012, drift_pa: 0.04, loadings: { equity: 1.15, oil: -0.25, style_big: 0.3 } },
  // 医药族
  { id: 'ind_pharma', name: '仁心化学制药指数', family: P, start: 1000, idio_sigma: 0.011, drift_pa: 0.07, loadings: { equity: 0.95, style_small: 0.3 } },
  { id: 'ind_tradchinese', name: '本草中药指数', family: P, start: 1000, idio_sigma: 0.011, drift_pa: 0.06, loadings: { equity: 0.9, style_big: 0.3 } },
  { id: 'ind_biotech', name: '生元生物科技指数', family: P, start: 1000, idio_sigma: 0.016, drift_pa: 0.08, loadings: { equity: 1.2, style_small: 0.7, us_equity: 0.2 } },
  { id: 'ind_meddevice', name: '精工医疗器械指数', family: P, start: 1000, idio_sigma: 0.013, drift_pa: 0.065, loadings: { equity: 1.1, style_small: 0.4 } },
  // 科技成长族
  { id: 'ind_computer', name: '曙光计算机指数', family: T, start: 1000, idio_sigma: 0.016, drift_pa: 0.08, loadings: { equity: 1.3, style_small: 0.7, us_equity: 0.3, sentiment_dom: 0.3 } },
  { id: 'ind_media', name: '光影传媒指数', family: T, start: 1000, idio_sigma: 0.017, drift_pa: 0.06, loadings: { equity: 1.25, style_small: 0.6, sentiment_dom: 0.5 } },
  { id: 'ind_comm', name: '星联通信指数', family: T, start: 1000, idio_sigma: 0.014, drift_pa: 0.06, loadings: { equity: 1.15, style_small: 0.5, us_equity: 0.2 } },
  { id: 'ind_equip', name: '智造电气设备指数', family: T, start: 1000, idio_sigma: 0.015, drift_pa: 0.07, loadings: { equity: 1.25, style_small: 0.6, oil: 0.1 } },
  { id: 'ind_military', name: '长城军工指数', family: T, start: 1000, idio_sigma: 0.017, drift_pa: 0.05, loadings: { equity: 1.2, style_small: 0.5, risk_g: -0.3 } },
  { id: 'ind_elecnew', name: '玄创新能源指数', family: T, start: 1000, idio_sigma: 0.017, drift_pa: 0.085, loadings: { equity: 1.35, style_small: 0.75, oil: -0.3, sentiment_dom: 0.3 } },
  // 稳定公用族
  { id: 'ind_power', name: '光明电力指数', family: U, start: 1000, idio_sigma: 0.007, drift_pa: 0.035, loadings: { equity: 0.7, style_big: 0.45, rate10y: -0.4 } },
  { id: 'ind_watergas', name: '清源水务燃气指数', family: U, start: 1000, idio_sigma: 0.007, drift_pa: 0.03, loadings: { equity: 0.65, style_big: 0.4, rate10y: -0.35 } },
  { id: 'ind_highway', name: '纵横公路铁路指数', family: U, start: 1000, idio_sigma: 0.006, drift_pa: 0.03, loadings: { equity: 0.6, style_big: 0.4, rate10y: -0.4 } },
];
