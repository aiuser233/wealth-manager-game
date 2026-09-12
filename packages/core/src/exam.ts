import type { IsoDate } from './types';
import { Rng } from './rng';

/** 题型 */
export type QuestionType = 'single' | 'multiple' | 'judge';

/** 双审元数据（合规门基石）：所有教学内容统一附加 */
export interface ReviewMeta {
  status: 'draft' | 'reviewed' | 'approved';
  /** 内容依据的公开监管文件/文献 */
  source_notes: string[];
  /** 金融知识审校人 */
  k_reviewer?: string | null;
  /** 合规表述审校人 */
  c_reviewer?: string | null;
  reviewed_at?: string | null;
  /** 分年代教学点说明 */
  era_note?: string;
}

/** 题库题目（规划书 7.4 JSON 结构） */
export interface ExamQuestion {
  id: string;
  /** 科目 id，对应 ExamDef.id */
  subject: string;
  chapter: string;
  knowledge_tags: string[];
  type: QuestionType;
  stem: string;
  options: string[];
  /** 正确选项下标（单/判）或下标数组（多选） */
  answer: number | number[];
  explanation: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  source_note?: string;
  /** 双审元数据（存量内容批量补齐后必填） */
  review?: ReviewMeta;
}

/** 考试科目定义 */
export interface ExamDef {
  id: string;
  name: string;
  /** 及格正确率（0-1），AFP/CFP 为 0.7 */
  pass_mark: number;
  /** 题量区间 [min, max] */
  question_count: [number, number];
  /** 限时（秒，模拟机考倒计时） */
  time_limit_sec: number;
  /** 解锁年份（卷一 2006 起） */
  unlock_year: number;
  /** 解锁职级（0 见习起） */
  unlock_grade?: number;
  desc?: string;
}

/** 一场已抽出的考卷 */
export interface ExamPaper {
  examId: string;
  questions: ExamQuestion[];
  /** 每题满分（单选 1 / 多选 2 / 判断 0.5） */
  scores: number[];
  totalScore: number;
}

/** 考试结果 */
export interface ExamResult {
  examId: string;
  passed: boolean;
  /** 折算百分制 */
  scorePct: number;
  rawScore: number;
  totalScore: number;
  /** 每题对/半对/错：1 / 0.5(多选漏选) / 0 */
  perQuestion: number[];
  correctCount: number;
}

/** 每题分值 */
export function questionScore(q: ExamQuestion): number {
  if (q.type === 'multiple') return 2;
  if (q.type === 'judge') return 0.5;
  return 1;
}

/** 抽卷：按题型配比（单选 60% / 多选 25% / 判断 15%）+ 难度配比随机抽题，同场不重复 */
export function buildPaper(exam: ExamDef, bank: ExamQuestion[], rng: Rng): ExamPaper {
  const pool = bank.filter((q) => q.subject === exam.id);
  if (pool.length === 0) throw new Error(`科目 ${exam.id} 题库为空`);
  const count = Math.min(rng.int(exam.question_count[0], exam.question_count[1]), pool.length);
  // 题型配比受题库实际库存约束：多选 25% / 判断 15%，不足时回补单选
  let nMulti = Math.round(count * 0.25);
  let nJudge = Math.round(count * 0.15);
  const availMulti = pool.filter((q) => q.type === 'multiple').length;
  const availJudge = pool.filter((q) => q.type === 'judge').length;
  nMulti = Math.min(nMulti, availMulti);
  nJudge = Math.min(nJudge, availJudge);
  const nSingle = Math.min(count - nMulti - nJudge, pool.filter((q) => q.type === 'single').length);
  const actual = nSingle + nMulti + nJudge;

  const byType = (t: QuestionType) => rng.shuffle(pool.filter((q) => q.type === t));
  const singles = byType('single').slice(0, nSingle);
  const multis = byType('multiple').slice(0, nMulti);
  const judges = byType('judge').slice(0, nJudge);

  // 交错排列，避免同题型连排
  const questions: ExamQuestion[] = [];
  const maxLen = Math.max(singles.length, multis.length, judges.length);
  for (let i = 0; i < maxLen; i++) {
    if (singles[i]) questions.push(singles[i]);
    if (multis[i]) questions.push(multis[i]);
    if (judges[i]) questions.push(judges[i]);
  }
  void actual;

  const scores = questions.map(questionScore);
  return { examId: exam.id, questions, scores, totalScore: scores.reduce((a, b) => a + b, 0) };
}

/**
 * 判分（规划书 7.3）：单选 1 分 / 多选 2 分（漏选得 1）/ 判断 0.5，折算百分制。
 * answers 与 paper.questions 对齐；未答传 -1 / []。
 */
export function gradePaper(paper: ExamPaper, answers: Array<number | number[]>): ExamResult {
  let raw = 0;
  let correct = 0;
  const per: number[] = [];
  paper.questions.forEach((q, i) => {
    const ans = answers[i];
    const full = paper.scores[i];
    let got = 0;
    if (q.type === 'multiple') {
      const right = [...(q.answer as number[])].sort();
      const given = Array.isArray(ans) ? [...ans].sort() : [];
      if (given.length > 0 && given.length <= right.length && given.every((v, j) => v === right[j])) {
        got = given.length === right.length ? full : full / 2; // 全对得满分，漏选得一半
      }
    } else if (ans === q.answer) {
      got = full;
    }
    per.push(got / full);
    if (got === full) correct += 1;
    raw += got;
  });
  const scorePct = paper.totalScore > 0 ? (raw / paper.totalScore) * 100 : 0;
  const exam = EXAM_DEFS.find((e) => e.id === paper.examId);
  const passMark = (exam?.pass_mark ?? 0.6) * 100;
  return {
    examId: paper.examId,
    passed: scorePct >= passMark,
    scorePct,
    rawScore: raw,
    totalScore: paper.totalScore,
    perQuestion: per,
    correctCount: correct,
  };
}

/** 8 张考卷（规划书 7.2 六门 + 深化批新增银保/资产配置两门专项，游戏内沿用真实证书名） */
export const EXAM_DEFS: ExamDef[] = [
  { id: 'exam_bank_law', name: '银行从业·法律法规与综合能力', pass_mark: 0.6, question_count: [20, 30], time_limit_sec: 720, unlock_year: 2006, desc: '入行第一证：银行业基础法规、职业操守与综合业务。' },
  { id: 'exam_bank_pf', name: '银行从业·个人理财', pass_mark: 0.6, question_count: [20, 30], time_limit_sec: 720, unlock_year: 2006, desc: '个人理财业务基础：产品、适当性与理财规划流程。' },
  { id: 'exam_fund', name: '基金从业·证券投资基金与销售', pass_mark: 0.6, question_count: [20, 30], time_limit_sec: 720, unlock_year: 2009, desc: '代销基金必备：基金类型、估值、费率与销售规范。' },
  { id: 'exam_securities', name: '证券从业·金融市场基础知识', pass_mark: 0.6, question_count: [20, 30], time_limit_sec: 720, unlock_year: 2014, desc: '证券市场全景：股票债券、发行交易与风险。' },
  { id: 'exam_afp', name: 'AFP 金融理财师认证', pass_mark: 0.7, question_count: [20, 30], time_limit_sec: 900, unlock_year: 2009, desc: '综合理财规划：全生命周期的资产配置与家庭财务。' },
  { id: 'exam_cfp', name: 'CFP 国际金融理财师认证', pass_mark: 0.7, question_count: [20, 30], time_limit_sec: 900, unlock_year: 2014, desc: '高阶认证：税务、传承、退休规划与复杂案例。' },
  { id: 'exam_insurance', name: '银行保险·寿险与银保业务', pass_mark: 0.6, question_count: [20, 30], time_limit_sec: 720, unlock_year: 2010, desc: '银保渠道实务：保障规划、销售适当性与双录规范。' },
  { id: 'exam_fund_alloc', name: '基金从业·资产配置专项', pass_mark: 0.7, question_count: [20, 30], time_limit_sec: 900, unlock_year: 2013, desc: '进阶专项：核心卫星、再平衡纪律与风险预算。' },
];

/** 考试窗口：每年 3/6/9/12 月的第三个周三（需提前 1 个月报名） */
export function examWindowDates(year: number): IsoDate[] {
  const months = [3, 6, 9, 12];
  const out: IsoDate[] = [];
  for (const m of months) {
    // 该月第一个周三之后 +14 天 ≈ 第三个周三
    let d = new Date(year, m - 1, 1);
    while (d.getDay() !== 3) d.setDate(d.getDate() + 1);
    d.setDate(d.getDate() + 14);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  }
  return out;
}
