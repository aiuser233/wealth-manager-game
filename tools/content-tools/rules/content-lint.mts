/**
 * 内容 Lint 规则（合规门的第一道机器闸）：
 * - 禁语词表：任何承诺收益/内部消息类表述直接 FAIL
 * - 合规风险词：预警（人工复核）
 * - 年代穿越：2025 年内容不得出现 2013 年前的工具词，反之亦然
 * - 术语一致性：架空机构名表之外不得出现真实机构名
 */

/** 一票否决：出现即编译失败 */
export const BANNED_WORDS: Array<{ word: string; reason: string }> = [
  { word: '保本保息', reason: '违反资管新规' },
  { word: '保本保收益', reason: '违反资管新规' },
  { word: '稳赚不赔', reason: '收益承诺' },
  { word: '稳赚', reason: '收益承诺' },
  { word: '只赚不赔', reason: '收益承诺' },
  { word: '零风险高收益', reason: '收益承诺' },
  { word: '绝对收益', reason: '收益承诺（无对冲语境）' },
  { word: '内幕消息', reason: '违法表述' },
  { word: '老鼠仓', reason: '违法表述（教学引用需加"违规"标注）' },
];

/** 预警：出现需人工复核（不阻断） */
export const RISK_WORDS: Array<{ word: string; hint: string }> = [
  { word: '保证', hint: '确认不是在承诺收益/保障范围' },
  { word: '必涨', hint: '预测性表述' },
  { word: '包赚', hint: '收益承诺' },
  { word: '推荐买入', hint: '不得荐股荐基，确认语境是教学' },
  { word: '加杠杆', hint: '确认有风险提示语境' },
];

/** 年代工具词（年代穿越检查） */
export const ERA_WORDS: Array<{ word: string; from: number }> = [
  { word: '余额宝', from: 2013 },
  { word: '宝宝类', from: 2013 },
  { word: '直播间', from: 2016 },
  { word: '直播理财', from: 2016 },
  { word: '个人养老金', from: 2022 },
  { word: '雪球', from: 2019 },
  { word: '净值型', from: 2018 },
  { word: '资管新规', from: 2017 },
  { word: 'LPR', from: 2019 },
  { word: '双录', from: 2016 },
  { word: '科创板', from: 2019 },
  { word: 'ChatGPT', from: 2022 },
  { word: 'AI 投顾', from: 2019 },
  { word: '存折', to: 2015 },
  { word: '利息税', to: 2008 },
];

/** 架构机构名白名单（真实机构出现即 FAIL） */
export const FORBIDDEN_BRANDS: string[] = [
  '工商银行', '建设银行', '农业银行', '中国银行', '交通银行', '招商银行', '平安银行',
  '中信证券', '国泰君安', '华泰证券', '易方达', '华夏基金', '嘉实基金', '天弘基金',
  '余额宝', '蚂蚁财富', '天天基金', '陆金所', '滴滴', '微信',
  '沪深300', '沪深 300', '中证500', '上证50', '创业板指',
];

export interface LintIssue {
  level: 'error' | 'warning';
  file: string;
  path: string;
  word?: string;
  message: string;
}

/** 对一段文本跑 lint；返回问题列表 */
export function lintText(text: string, file: string, path: string, year?: number): LintIssue[] {
  const issues: LintIssue[] = [];
  // 教学引用豁免：被「」包裹的词视为教学引用
  const teachingText = text.replace(/「[^」]*」/g, (m: string) => '□'.repeat(m.length));
  for (const { word, reason } of BANNED_WORDS) {
    if (teachingText.includes(word)) {
      issues.push({ level: 'error', file, path, word, message: `禁语「${word}」：${reason}` });
    }
  }
  // prototype 字段是「原型图鉴」教学场景：显示现实原型名是功能本身
  const isPrototypeField = /prototype/i.test(path);
  for (const brand of FORBIDDEN_BRANDS) {
    if (isPrototypeField && (brand === '沪深 300' || brand === '沪深300' || brand === '余额宝')) continue;
    if (teachingText.includes(brand)) {
      issues.push({ level: 'error', file, path, word: brand, message: `出现真实机构/品牌「${brand}」：必须架空化` });
    }
  }
  for (const { word, hint } of RISK_WORDS) {
    if (teachingText.includes(word)) {
      issues.push({ level: 'warning', file, path, word, message: `风险词「${word}」：${hint}` });
    }
  }
  if (year !== undefined) {
    for (const ew of ERA_WORDS) {
      const inEra = ew.from ? year >= ew.from : true;
      const notAfter = ew.to ? year <= ew.to : true;
      if (teachingText.includes(ew.word) && !inEra) {
        issues.push({ level: 'error', file, path, word: ew.word, message: `年代穿越：「${ew.word}」${ew.from} 年后才存在，内容标注年份 ${year}` });
      }
      if (teachingText.includes(ew.word) && !notAfter) {
        issues.push({ level: 'error', file, path, word: ew.word, message: `年代穿越：「${ew.word}」${ew.to} 年后不应出现，内容标注年份 ${year}` });
      }
    }
  }
  return issues;
}
