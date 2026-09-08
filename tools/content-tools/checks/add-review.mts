/**
 * 一次性迁移脚本：给存量 485 题批量接入双审元数据（规划 3.2）。
 * 做法：给每个题库文件的 s/m/j 快捷构造器包一层 withReview（按 subject/tag 生成 source_notes），
 * 单点改动、全量生效、可复跑。新批次题目自动继承，无需再跑。
 */
import { readFileSync, writeFileSync } from 'fs';

const FILES = ['exams.ts', 'exams2.ts', 'exams3.ts', 'exams4.ts'].map((f) => `content/src/${f}`);

const PATCH = {
  import: `import { withReview } from '../../tools/content-tools/checks/with-review.mts';`,
  s: {
    from: `  ({ id, subject, chapter, knowledge_tags: tags, type: 'single', stem, options, answer, explanation, difficulty });`,
    to: `  return withReview({ id, subject, chapter, knowledge_tags: tags, type: 'single', stem, options, answer, explanation, difficulty });`,
  },
  m: {
    from: `  ({ id, subject, chapter, knowledge_tags: tags, type: 'multiple', stem, options, answer, explanation, difficulty });`,
    to: `  return withReview({ id, subject, chapter, knowledge_tags: tags, type: 'multiple', stem, options, answer, explanation, difficulty });`,
  },
  j: {
    from: `  ({ id, subject, chapter, knowledge_tags: tags, type: 'judge', stem, options: ['正确', '错误'], answer, explanation, difficulty });`,
    to: `  return withReview({ id, subject, chapter, knowledge_tags: tags, type: 'judge', stem, options: ['正确', '错误'], answer, explanation, difficulty });`,
  },
};

for (const file of FILES) {
  let src = readFileSync(file, 'utf8');
  if (src.includes('withReview')) {
    console.log(`${file}: 已接入，跳过`);
    continue;
  }
  let patched = 0;
  for (const key of ['s', 'm', 'j'] as const) {
    if (src.includes(PATCH[key].from)) {
      src = src.replace(PATCH[key].from, PATCH[key].to);
      patched++;
    }
  }
  if (patched === 0) throw new Error(`${file}: 构造器模式未匹配，需人工检查`);
  // import 插到第一行 import 之后
  src = src.replace(/^(import type \{ ExamQuestion \} from '@fm\/core';)/m, `$1\n${PATCH.import}`);
  writeFileSync(file, src);
  console.log(`${file}: ${patched}/3 构造器已接入 withReview`);
}
