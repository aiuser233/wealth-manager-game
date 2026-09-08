/**
 * P4 培训后台 · 学习记录模型（B 端聚合的数据源）：
 * - 学员在本地产生的学习行为（考试/错题/剧情抉择/活跃度）累积为一条匿名记录
 * - 记录以 JSON 文件导出（学员交给讲师，或可选推送到内网收集端点）
 * - 讲师端导入多份记录 → TrainerPanel 聚合出团队报表
 * - 隐私原则（规划 8）：记录默认匿名（编号可自定义），不含客户真实信息，不出本机
 */
import type { Game, QuestEngine } from '@fm/core';
import { GRADE_NAMES } from '@fm/core';
import { wrongBook } from './state';
import { storage } from './storage';

/** 单次考试摘要 */
export interface ExamRecordItem {
  examId: string;
  examName: string;
  passed: boolean;
  scorePct: number;
  /** 游戏内日期（YYYY-MM-DD），用于还原学习节奏 */
  at: string;
}

/** 一次剧情抉择的态度数据（best/good/normal/bad 天然分级） */
export interface ChoiceRecordItem {
  questTitle: string;
  grade: string;
  at: string;
}

/** 行内自定义学员编号（培训部门分配的工号/学号），空串表示匿名 */
const KEY_STUDENT = 'fm_student_id';
const KEY_EXAM_HISTORY = 'fm_exam_history';
const KEY_CHOICE_HISTORY = 'fm_choice_history';
/** 活跃度：有学习行为的游戏日集合（存最近 200 天） */
const KEY_ACTIVE_DAYS = 'fm_active_days';

export function getStudentId(): string {
  return storage.get(KEY_STUDENT) ?? '';
}

export function setStudentId(id: string) {
  storage.set(KEY_STUDENT, id.trim().slice(0, 40));
}

/** 考试历史（含未通过），供报表统计通过率 */
export function recordExamAttempt(item: ExamRecordItem) {
  const list = readList<ExamRecordItem>(KEY_EXAM_HISTORY);
  list.unshift(item);
  storage.set(KEY_EXAM_HISTORY, JSON.stringify(list.slice(0, 100)));
}

export function examHistory(): ExamRecordItem[] {
  return readList<ExamRecordItem>(KEY_EXAM_HISTORY);
}

/** 剧情抉择历史 */
export function recordChoice(item: ChoiceRecordItem) {
  const list = readList<ChoiceRecordItem>(KEY_CHOICE_HISTORY);
  list.unshift(item);
  storage.set(KEY_CHOICE_HISTORY, JSON.stringify(list.slice(0, 100)));
}

export function choiceHistory(): ChoiceRecordItem[] {
  return readList<ChoiceRecordItem>(KEY_CHOICE_HISTORY);
}

/** 学习活跃日（游戏内日期）。动作/考试/剧情结算时调用 */
export function touchActiveDay(date: string) {
  const days = new Set(readList<string>(KEY_ACTIVE_DAYS));
  days.add(date);
  const arr = [...days].sort().slice(-200);
  storage.set(KEY_ACTIVE_DAYS, JSON.stringify(arr));
}

export function activeDays(): string[] {
  return readList<string>(KEY_ACTIVE_DAYS);
}

function readList<T>(key: string): T[] {
  try {
    return storage.get(key) ? (JSON.parse(storage.get(key)!) as T[]) : [];
  } catch {
    return [];
  }
}

/** 导出的学习记录（讲师端聚合的最小单元） */
export interface StudentRecord {
  schema: 'fm-student-record';
  version: 1;
  studentId: string;
  exportedAt: string;
  /** 游戏内进度 */
  gameDate: string;
  grade: string;
  certs: string[];
  violations: number;
  aum: number;
  /** 考试明细 */
  exams: ExamRecordItem[];
  /** 错题知识点聚合（tag -> 次数） */
  weakTags: Record<string, number>;
  wrongTotal: number;
  /** 剧情抉择分布 */
  choices: ChoiceRecordItem[];
  /** 活跃游戏日 */
  activeDays: string[];
  /** 卷一主线完成章数 */
  questsDone: number;
}

export function buildStudentRecord(g: Game, questEngine?: QuestEngine | null): StudentRecord {
  const weak: Record<string, number> = {};
  const book = wrongBook();
  for (const w of book) {
    for (const t of w.knowledge_tags ?? []) weak[t] = (weak[t] ?? 0) + 1;
  }
  return {
    schema: 'fm-student-record',
    version: 1,
    studentId: getStudentId() || `anon_${g.player.name}`,
    exportedAt: new Date().toISOString(),
    gameDate: g.date,
    grade: GRADE_NAMES[g.player.grade] ?? '',
    certs: [...g.player.certs],
    violations: g.violations,
    aum: g.player.aum,
    exams: examHistory(),
    weakTags: weak,
    wrongTotal: book.length,
    choices: choiceHistory(),
    activeDays: activeDays(),
    questsDone: questEngine ? questEngine.serialize().completed.length : 0,
  };
}

/** 导出记录文件（JSON 下载） */
export function downloadStudentRecord(rec: StudentRecord) {
  const blob = new Blob([JSON.stringify(rec, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fm_record_${rec.studentId}_${rec.gameDate}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

/** 可选收集端点（银行内网）：默认关闭，配置后才上传 */
const KEY_ENDPOINT = 'fm_collect_endpoint';

export function getCollectEndpoint(): string {
  return storage.get(KEY_ENDPOINT) ?? '';
}

export function setCollectEndpoint(url: string) {
  storage.set(KEY_ENDPOINT, url.trim());
}

/** 上传记录到内网收集端点（fetch 失败不阻塞本地导出） */
export async function uploadStudentRecord(rec: StudentRecord): Promise<string> {
  const ep = getCollectEndpoint();
  if (!ep) return '未配置收集端点，仅导出本地文件。';
  try {
    const res = await fetch(ep, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rec),
    });
    return res.ok ? '已上传到收集端点。' : `上传失败（HTTP ${res.status}），本地文件仍可使用。`;
  } catch {
    return '上传失败（网络不可达），本地文件仍可使用。';
  }
}
