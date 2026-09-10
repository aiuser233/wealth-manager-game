import type { ExamQuestion } from '@fm/core';
import { withReview } from '../../tools/content-tools/checks/with-review.mts';

/**
 * 题库批量扩产批次（100 题）：六科目主题矩阵生成，
 * 概念/辨析/多选/判断四题型轮换 × 难度梯度，与既有 tag 体系联动。
 */

const s = (id: string, subject: string, chapter: string, tags: string[], stem: string, options: string[], answer: number, explanation: string, difficulty: 1 | 2 | 3 | 4 | 5 = 2): ExamQuestion => {
  return withReview({ id, subject, chapter, knowledge_tags: tags, type: 'single', stem, options, answer, explanation, difficulty });
}
const m = (id: string, subject: string, chapter: string, tags: string[], stem: string, options: string[], answer: number[], explanation: string, difficulty: 1 | 2 | 3 | 4 | 5 = 3): ExamQuestion => {
  return withReview({ id, subject, chapter, knowledge_tags: tags, type: 'multiple', stem, options, answer, explanation, difficulty });
}
const j = (id: string, subject: string, chapter: string, tags: string[], stem: string, answer: 0 | 1, explanation: string, difficulty: 1 | 2 | 3 | 4 | 5 = 1): ExamQuestion => {
  return withReview({ id, subject, chapter, knowledge_tags: tags, type: 'judge', stem, options: ['正确', '错误'], answer, explanation, difficulty });
}

export const @@FN@@: ExamQuestion[] = [
