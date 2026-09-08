/**
 * P4 培训后台测试：行内题包校验 / 讲师聚合报表
 * （storage 依赖浏览器 env —— vitest 环境无 window，这里直测纯函数部分：
 *  checkPack 不依赖 storage；aggregate/parse 也不依赖。packQuestions 走 storage 兜底 = 空 Map）
 */
import { describe, it, expect } from 'vitest';
import { checkPack, maskTeaching, type PackCheckResult } from '../src/packs';
import { aggregateTeam, parseStudentRecord, teamReportHtml, type TeamAggregate } from '../src/trainer';
import type { ExamQuestion } from '@fm/core';

const baseQ = {
  id: 'custom_001',
  subject: 'exam_bank_law',
  type: 'single',
  stem: '合规销售的第一步是什么？',
  options: ['如实揭示风险', '承诺保本', '夸大收益', '省略风险提示'],
  answer: 0,
  explanation: '适当性与风险揭示是销售行为合规的起点。',
  knowledge_tags: ['suitability'],
  difficulty: 2,
};

function packResult(raw: unknown): PackCheckResult {
  return checkPack(JSON.stringify(raw));
}

describe('行内题包校验', () => {
  it('合法题包通过并输出规范化题目', () => {
    const r = packResult([baseQ]);
    expect(r.ok).toBe(true);
    expect(r.issues).toHaveLength(0);
    expect(r.questions).toHaveLength(1);
    expect(r.questions[0].review?.status).toBe('draft');
    expect(r.questions[0].source_note).toContain('行内题包');
  });

  it('禁语被拦截', () => {
    const r = packResult([{ ...baseQ, id: 'x1', explanation: '本品稳赚不赔' }]);
    expect(r.ok).toBe(false);
    expect(r.issues.some((i) => i.message.includes('稳赚'))).toBe(true);
  });

  it('真实机构名被拦截', () => {
    const r = packResult([{ ...baseQ, id: 'x2', stem: '工商银行的贷款产品有哪些' }]);
    expect(r.ok).toBe(false);
    expect(r.issues.some((i) => i.message.includes('工商银行'))).toBe(true);
  });

  it('教学引用「」内的禁语豁免', () => {
    const r = packResult([{ ...baseQ, id: 'x3', stem: '以下哪项属于违规表述：「稳赚不赔」' }]);
    expect(r.ok).toBe(true);
  });

  it('科目校验失败', () => {
    const r = packResult([{ ...baseQ, id: 'x4', subject: 'exam_unknown' }]);
    expect(r.ok).toBe(false);
    expect(r.issues.some((i) => i.field === 'subject')).toBe(true);
  });

  it('答案下标越界被拦截', () => {
    const r = packResult([{ ...baseQ, id: 'x5', answer: 9 }]);
    expect(r.ok).toBe(false);
    expect(r.issues.some((i) => i.field === 'answer')).toBe(true);
  });

  it('id 重复被拦截', () => {
    const r = packResult([baseQ, { ...baseQ }]);
    expect(r.ok).toBe(false);
    expect(r.issues.some((i) => i.message.includes('重复'))).toBe(true);
  });

  it('缺必填字段被拦截', () => {
    const { stem, ...rest } = baseQ as Record<string, unknown>;
    void stem;
    const r = packResult([rest]);
    expect(r.ok).toBe(false);
    expect(r.issues.some((i) => i.message.includes('必填'))).toBe(true);
  });

  it('「」掩码函数正确', () => {
    expect(maskTeaching('「稳赚」和直接说稳赚')).toContain('□□□□');
    expect(maskTeaching('直接说稳赚')).toContain('稳赚');
  });
});

// ==== 讲师聚合 ====

function mkRecord(i: number, over: Partial<Record<string, unknown>> = {}): ReturnType<typeof fakeRecord> {
  return fakeRecord(i, over);
}
function fakeRecord(i: number, over: Record<string, unknown>) {
  return {
    schema: 'fm-student-record' as const,
    version: 1 as const,
    studentId: `s${i}`,
    exportedAt: '2026-09-09T00:00:00Z',
    gameDate: '2007-06-01',
    grade: '见习理财经理',
    certs: i % 2 === 0 ? ['银行业专业基础'] : [],
    violations: i === 2 ? 2 : 0,
    aum: 100000 * i,
    exams: i < 3
      ? [{ examId: 'exam_bank_law', examName: '银行业法律法规', passed: i < 2, scorePct: 60 + i * 20, at: '2007-03-01' }]
      : [],
    weakTags: { suitability: i, stamp_duty: i === 0 ? 3 : 0 },
    wrongTotal: i,
    choices: [{ questTitle: '任务一', grade: i === 0 ? 'best' : 'good', at: '2007-01-05' }],
    activeDays: Array.from({ length: i + 1 }, (_, k) => `2007-01-${String(k + 1).padStart(2, '0')}`),
    questsDone: i,
    ...over,
  } as unknown as import('../src/lms').StudentRecord;
}

describe('讲师聚合报表', () => {
  const recs = [mkRecord(0), mkRecord(1), mkRecord(2), mkRecord(3)];

  it('班级规模与编号', () => {
    const agg = aggregateTeam(recs);
    expect(agg.classSize).toBe(4);
    expect(agg.studentIds).toEqual(['s0', 's1', 's2', 's3']);
  });

  it('按科目通过率', () => {
    const agg = aggregateTeam(recs);
    const law = agg.passRate.find((p) => p.examName === '银行业法律法规');
    expect(law).toBeDefined();
    expect(law!.attempts).toBe(3);
    expect(law!.passed).toBe(2);
  });

  it('弱项地图按人数排序', () => {
    const agg = aggregateTeam(recs);
    expect(agg.weakMap[0].tag).toBe('suitability');
    expect(agg.weakMap[0].students).toBe(4);
  });

  it('剧情抉择分布含最优率', () => {
    const agg = aggregateTeam(recs);
    expect(agg.choiceDist[0].quest).toBe('任务一');
    expect(agg.choiceDist[0].dist.best).toBe(1);
    expect(agg.choiceDist[0].bestRate).toBeCloseTo(0.25);
  });

  it('活跃度与超时红线聚合', () => {
    const agg: TeamAggregate = aggregateTeam(recs);
    expect(agg.avgActiveDays).toBeCloseTo((1 + 2 + 3 + 4) / 4);
    expect(agg.violationStudents).toBe(1);
    expect(agg.avgQuests).toBeCloseTo((0 + 1 + 2 + 3) / 4);
  });

  it('记录校验拒绝非法格式', () => {
    expect(parseStudentRecord('not json')).toHaveProperty('error');
    expect(parseStudentRecord(JSON.stringify({ foo: 1 }))).toHaveProperty('error');
    const ok = parseStudentRecord(JSON.stringify(fakeRecord(9)));
    expect(ok).not.toHaveProperty('error');
  });

  it('报表 HTML 包含关键板块', () => {
    const html = teamReportHtml(aggregateTeam(recs), '试点一班', '2026-09-09');
    expect(html).toContain('考证通过率');
    expect(html).toContain('弱项知识地图');
    expect(html).toContain('剧情抉择分布');
    expect(html).toContain('试点一班');
  });
});
