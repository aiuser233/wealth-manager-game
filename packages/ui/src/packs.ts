/**
 * P4 培训后台 · 行内题包热加载：
 * - 银行合规部门提交 JSON 题包（无需改代码、无需重新构建）
 * - 导入时跑与 content-tools 相同的机器闸：禁语词表 / 真实机构名 / 年代穿越 / 双审元数据
 * - 校验通过 → 并入抽题池（考试抽卷 + 每日一题即时生效）；失败 → 指出具体问题
 * - 题包仅存本机（localStorage/storage），符合"数据不出本机"原则
 */
import type { ExamQuestion, QuestionType } from '@fm/core';
import { storage } from './storage';

/** 与 content-lint.mts 同源的合规词表（前端侧内联，避免跨包依赖 ts 工具） */
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

export const FORBIDDEN_BRANDS: string[] = [
  '工商银行', '建设银行', '农业银行', '中国银行', '交通银行', '招商银行', '平安银行',
  '中信证券', '国泰君安', '华泰证券', '易方达', '华夏基金', '嘉实基金', '天弘基金',
  '蚂蚁财富', '天天基金', '陆金所', '沪深300', '中证500',
];

const ERA_WORDS: Array<{ word: string; from: number }> = [
  { word: '余额宝', from: 2013 }, { word: '宝宝类', from: 2013 },
  { word: '直播间', from: 2016 }, { word: '个人养老金', from: 2022 },
  { word: '雪球', from: 2019 }, { word: '净值型', from: 2018 },
  { word: '资管新规', from: 2017 }, { word: 'LPR', from: 2019 },
  { word: '双录', from: 2016 }, { word: '科创板', from: 2019 },
];

export const VALID_SUBJECTS = ['exam_bank_law', 'exam_bank_pf', 'exam_fund', 'exam_securities', 'exam_afp', 'exam_cfp'] as const;
const VALID_TYPES: QuestionType[] = ['single', 'multiple', 'judge'];

export interface PackIssue {
  index: number;
  field: string;
  message: string;
}

export interface PackCheckResult {
  ok: boolean;
  issues: PackIssue[];
  questions: ExamQuestion[];
}

const KEY_PACKS = 'fm_custom_packs';
/** 双审过滤开关（P4 强制启用）：'0'=正式模式（只放行 approved），'1'=开发模式（放行全部）。
 *  人工双审完成后删除/置 '0' 该键，draft 内容即退出正式包。 */
const KEY_REVIEW_GATE = 'fm_review_gate';

/** 当前是否处于开发模式（放行未过审内容） */
export function reviewGateDevMode(): boolean {
  return storage.get(KEY_REVIEW_GATE) === '1';
}

/** 切换双审过滤模式（仅开发/演示用；正式培训包环境必须为关闭） */
export function setReviewGateDevMode(on: boolean) {
  storage.set(KEY_REVIEW_GATE, on ? '1' : '0');
}

/**
 * 双审门禁：正式模式下只放行 review.status === 'approved' 的内容。
 * 规划 §15-A1：人工双审完成后，approved 才进抽题池——本函数是"审完生效"的执行点。
 */
export function passesReviewGate(q: ExamQuestion): boolean {
  if (reviewGateDevMode()) return true;
  return q.review?.status === 'approved';
}

/** 行内题包元信息 */
export interface CustomPackMeta {
  name: string;
  importedAt: string;
  count: number;
  /** 题包声明的科目（用于行内专项考试） */
  subject: string;
  /** 题包自带科目名（行内自定义，如"XX分行合规专项"） */
  subjectName?: string;
}

/** 校验一份题包 JSON（数组或 {questions: [...]}） */
export function checkPack(raw: string): PackCheckResult {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ok: false, issues: [{ index: -1, field: 'file', message: 'JSON 解析失败' }], questions: [] };
  }
  const arr = Array.isArray(data) ? data : (data as { questions?: unknown[] })?.questions;
  if (!Array.isArray(arr) || arr.length === 0) {
    return { ok: false, issues: [{ index: -1, field: 'file', message: '题包应为非空数组或 {questions:[...]}' }], questions: [] };
  }
  const issues: PackIssue[] = [];
  const questions: ExamQuestion[] = [];
  const ids = new Set<string>();
  arr.forEach((q, i) => {
    const o = q as Record<string, unknown>;
    const idx = i;
    // 结构字段
    for (const f of ['id', 'subject', 'stem', 'options', 'answer', 'explanation'] as const) {
      if (o[f] === undefined || o[f] === null || o[f] === '') issues.push({ index: idx, field: f, message: `缺少必填字段 ${f}` });
    }
    if (typeof o.id === 'string' && ids.has(o.id)) issues.push({ index: idx, field: 'id', message: `题目 id 重复：${o.id}` });
    if (typeof o.id === 'string') ids.add(o.id);
    if (typeof o.subject === 'string' && !VALID_SUBJECTS.includes(o.subject as (typeof VALID_SUBJECTS)[number])) {
      issues.push({ index: idx, field: 'subject', message: `未知科目 ${o.subject}（允许：${VALID_SUBJECTS.join('/')}）` });
    }
    if (typeof o.type === 'string' && !VALID_TYPES.includes(o.type as QuestionType)) {
      issues.push({ index: idx, field: 'type', message: `未知题型 ${o.type}` });
    }
    const options = o.options as string[] | undefined;
    if (!Array.isArray(options) || options.length < 2) {
      issues.push({ index: idx, field: 'options', message: '选项至少 2 个' });
    } else if (typeof o.answer === 'number' && (o.answer < 0 || o.answer >= options.length)) {
      issues.push({ index: idx, field: 'answer', message: `正确答案下标越界（${o.answer}）` });
    } else if (Array.isArray(o.answer)) {
      const bad = (o.answer as number[]).some((a) => a < 0 || a >= options!.length);
      if (bad) issues.push({ index: idx, field: 'answer', message: '多选答案下标越界' });
    }
    // 合规机器闸（与 content:lint 同源）：教学引用「」豁免
    const texts: Array<[string, string]> = [
      ['stem', String(o.stem ?? '')],
      ['explanation', String(o.explanation ?? '')],
      ...(options ?? []).map((op, j): [string, string] => [`options[${j}]`, String(op)]),
    ];
    for (const [field, text] of texts) {
      const masked = maskTeaching(text);
      for (const { word, reason } of BANNED_WORDS) {
        if (masked.includes(word)) issues.push({ index: idx, field, message: `禁语「${word}」：${reason}` });
      }
      for (const brand of FORBIDDEN_BRANDS) {
        if (masked.includes(brand)) issues.push({ index: idx, field, message: `真实机构/品牌「${brand}」：必须架空化` });
      }
      for (const { word, from } of ERA_WORDS) {
        if (masked.includes(word) && typeof o.era_year === 'number' && o.era_year < from) {
          issues.push({ index: idx, field, message: `年代穿越：「${word}」${from} 年后才存在` });
        }
      }
    }
    if (issues.some((x) => x.index === idx && (x.field === 'id' || x.field.startsWith('缺少') || x.field === 'options' || x.field === 'answer'))) return;
    questions.push(normalizeQuestion(o));
  });
  return { ok: issues.length === 0, issues, questions };
}

/** 「」内为教学引用（如"什么是保本保息"类题目），豁免禁语 */
export function maskTeaching(text: string): string {
  return text.replace(/「[^」]*」/g, (m) => '□'.repeat(m.length));
}

function normalizeQuestion(o: Record<string, unknown>): ExamQuestion {
  return {
    id: String(o.id),
    subject: String(o.subject),
    chapter: String(o.chapter ?? '行内题包'),
    knowledge_tags: Array.isArray(o.knowledge_tags) ? (o.knowledge_tags as string[]) : [],
    type: (VALID_TYPES.includes(o.type as QuestionType) ? o.type : 'single') as QuestionType,
    stem: String(o.stem),
    options: (o.options as string[]).map(String),
    answer: o.answer as number | number[],
    explanation: String(o.explanation ?? ''),
    difficulty: (typeof o.difficulty === 'number' && o.difficulty >= 1 && o.difficulty <= 5 ? o.difficulty : 3) as 1 | 2 | 3 | 4 | 5,
    source_note: String(o.source_note ?? '行内题包（合规部门提供）'),
    review: { status: 'draft', source_notes: ['行内题包（合规部门提供，待双审）'] },
  };
}

/** 已导入题包列表 */
export function listPacks(): CustomPackMeta[] {
  try {
    return storage.get(KEY_PACKS) ? (JSON.parse(storage.get(KEY_PACKS)!) as CustomPackMeta[]) : [];
  } catch {
    return [];
  }
}

/** 已导入的全部行内题目（并入抽题池用；受双审门禁过滤） */
export function packQuestions(): ExamQuestion[] {
  const metas = listPacks();
  const out: ExamQuestion[] = [];
  for (const m of metas) {
    try {
      const raw = storage.get(`${KEY_PACKS}:${m.name}`);
      if (raw) {
        const qs = JSON.parse(raw) as ExamQuestion[];
        out.push(...qs.filter(passesReviewGate));
      }
    } catch { /* 单包损坏跳过 */ }
  }
  return out;
}

/** 保存一个题包（校验通过后调用）。同名覆盖 */
export function savePack(name: string, subject: string, questions: ExamQuestion[], subjectName?: string): CustomPackMeta {
  const meta: CustomPackMeta = { name, subject, subjectName, importedAt: new Date().toISOString(), count: questions.length };
  const metas = listPacks().filter((m) => m.name !== name);
  metas.unshift(meta);
  storage.set(KEY_PACKS, JSON.stringify(metas.slice(0, 20)));
  storage.set(`${KEY_PACKS}:${name}`, JSON.stringify(questions));
  return meta;
}

/** 删除题包 */
export function removePack(name: string) {
  const metas = listPacks().filter((m) => m.name !== name);
  storage.set(KEY_PACKS, JSON.stringify(metas));
  storage.remove(`${KEY_PACKS}:${name}`);
}
