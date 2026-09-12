/**
 * 双审元数据注入器：按题目 subject 与首个 knowledge_tags 生成 source_notes（公开监管依据）。
 * status: 'draft'（待审）——培训包发布前须双审置 approved（P4 强制启用过滤）。
 */
import type { ExamQuestion, ReviewMeta } from '@fm/core';

/** 科目 → 公开监管依据 */
const SUBJECT_SOURCES: Record<string, string[]> = {
  exam_bank_law: ['《商业银行法》', '《银行业监督管理法》', '银行业专业人员职业资格考试公开大纲（改编）'],
  exam_bank_pf: ['《商业银行理财业务监督管理办法》（2018）', '《证券期货投资者适当性管理办法》（2017）', '银行业专业人员职业资格考试公开大纲（改编）'],
  exam_fund: ['《公开募集证券投资基金销售机构监督管理办法》（2020）', '基金从业资格考试公开大纲（改编）'],
  exam_securities: ['《证券法》（2019 修订）', '证券业从业人员资格考试公开大纲（改编）'],
  exam_afp: ['FPSB 中国 AFP 认证公开考纲（改编）', '《个人理财规划》学科公开教材'],
  exam_cfp: ['FPSB 中国 CFP 认证公开考纲（改编）', '《金融理财原理》学科公开教材'],
  exam_insurance: ['《商业银行代理保险业务管理办法》（2019）', '《人身保险销售行为管理办法》公开要点（改编）', '保险从业资格考试公开大纲（改编）'],
  exam_fund_alloc: ['《公开募集证券投资基金销售机构监督管理办法》（2020）', '基金从业资格考试公开大纲（改编）', '资产配置学科公开教材'],
};

/** 重点 tag → 追加的专项依据 */
const TAG_SOURCES: Array<{ tag: string; note: string }> = [
  { tag: 'deposit_insurance', note: '《存款保险条例》（2015）' },
  { tag: 'red_lines', note: '《银行业金融机构销售专区录音录像管理暂行办法》（2017）' },
  { tag: 'suitability', note: '《证券期货投资者适当性管理办法》（2017）' },
  { tag: 'nav_product', note: '资管新规（2018）' },
  { tag: 'dual_recording', note: '双录监管规定（2017）' },
  { tag: 'aml', note: '《反洗钱法》（2007）' },
  { tag: 'structured_product', note: '《商业银行理财产品销售管理办法》及雪球类产品监管公开文件' },
  { tag: 'credit_report', note: '《征信业管理条例》（2013）' },
];

/** 给题目对象补 review 字段（原地修改并返回） */
export function withReview<T extends ExamQuestion>(q: T): T {
  if (q.review) return q;
  const notes = new Set(SUBJECT_SOURCES[q.subject] ?? ['银行业/证券业职业资格考试公开大纲（改编）']);
  const firstTag = q.knowledge_tags?.[0];
  const tagNote = TAG_SOURCES.find((t) => t.tag === firstTag);
  if (tagNote) notes.add(tagNote.note);
  const review: ReviewMeta = { status: 'draft', source_notes: [...notes] };
  return { ...q, review };
}
