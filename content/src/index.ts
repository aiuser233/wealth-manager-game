import type { ContentBundle, ExamQuestion } from '@fm/core';
import { factors } from './factors';
import { industries } from './industries';
import { releases } from './releases';
import { directorEvents } from './events';
import { products } from './products';
import { clients } from './clients';
import { deepClients, deepClients2, deepClients3, deepClients4 } from './clients-deep';
import { eraDrift, eraLevel } from './macro';
import { examBank } from './exams';
import { examBank2 } from './exams2';
import { examBank3 } from './exams3';
import { examBank4 } from './exams4';
import { examBank5 } from './exams5';
import { examBank6 } from './exams6';
import { examBank7 } from './exams7';
import { examBank8 } from './exams8';
import { examBank9 } from './exams9';
import { examBank10 } from './exams10';
import { examBank11 } from './exams11';
import { examBank12 } from './exams12';
import { examBank13 } from './exams13';
import { examBank14 } from './exams14';
import { examBank15 } from './exams15';
import { examBank16 } from './exams16';
import { examBank17 } from './exams17';
import { examBank18 } from './exams18';
import { examBank19 } from './exams19';
import { examBank20 } from './exams20';
import { examBank21 } from './exams21';
import { examBank22 } from './exams22';
import { examBank23 } from './exams23';
import { examBank24 } from './exams24';
import { examBank25 } from './exams25';
import { examBank26 } from './exams26';
import { examBank27 } from './exams27';
import { examBank28 } from './exams28';
import { examBank29 } from './exams29';
import { examBank30 } from './exams30';
import { examBank31 } from './exams31';
import { examBank32 } from './exams32';
import { examBank33 } from './exams33';
import { examBank34 } from './exams34';
import { examBank35 } from './exams35';
import { examBank36 } from './exams36';
import { examBank37 } from './exams37';
import { examBank38 } from './exams38';
import { examBank39 } from './exams39';
import { examBank40 } from './exams40';
import { examBank41 } from './exams41';
import { examBank42 } from './exams42';
import { examBank43 } from './exams43';
import { examBank44 } from './exams44';
import { examBank45 } from './exams45';
import { examBank46 } from './exams46';
import { examBank47 } from './exams47';
import { examBank48 } from './exams48';
import { examBank49 } from './exams49';
import { examBank50 } from './exams50';
import { examBank51 } from './exams51';
import { KNOWLEDGE, DEBRIEF_CARDS } from './knowledge';
import { knowledgeBatch2 } from './knowledge2';
import { knowledgeBatch3 } from './knowledge3';
import { knowledgeBatch4 } from './knowledge4';
import { knowledgeBatch5 } from './knowledge5';
import { knowledgeBatch6 } from './knowledge6';
import { knowledgeBatch7 } from './knowledge7';
import { knowledgeBatch8 } from './knowledge8';
import { knowledgeBatch9, debriefCardsDeep3 } from './knowledge9';
import { knowledgeBatch10, debriefCardsDeep4 } from './knowledge10';
import { knowledgeBatch11, debriefCardsDeep5 } from './knowledge11';
import { debriefCardsDeep } from './knowledge6';
import { debriefCardsDeep2 } from './knowledge8';
import { randomEvents, randomEventsDeep, randomEventsDeep2, randomEventsDeep3, randomEventsDeep4, randomEventsDeep5 } from './random-events';
import { VOLUME1_QUESTS, VOLUME1_LIFELINES } from './quests';
import { VOLUME2_QUESTS } from './quests2';
import { VOLUME3_QUESTS } from './quests3';
import { VOLUME4_QUESTS } from './quests4';
import { VOLUME5_QUESTS } from './quests5';
import { EASTER_QUESTS } from './quests6';
import { NG_PLUS_QUESTS } from './quests7';
import { VOLUME8_QUESTS } from './quests8';
import { LIFELINES_FULL, WANG_LIFELINE, LI_LIFELINE, CHENGJIQING_LIFELINE } from './lifelines';

/**
 * 全量公测题池。扩产批次曾产生“id 不同、内容完全相同”的题目；这里按
 * 题干+选项+答案+解析生成内容指纹，稳定保留最早版本。源批次暂不物理删除，
 * 便于后续人工审校追溯。
 */
const examBankRaw = [...examBank, ...examBank2, ...examBank3, ...examBank4, ...examBank5, ...examBank6, ...examBank7, ...examBank8, ...examBank9, ...examBank10, ...examBank11, ...examBank12, ...examBank13, ...examBank14, ...examBank15, ...examBank16, ...examBank17, ...examBank18, ...examBank19, ...examBank20, ...examBank21, ...examBank22, ...examBank23, ...examBank24, ...examBank25, ...examBank26, ...examBank27, ...examBank28, ...examBank29, ...examBank30, ...examBank31, ...examBank32, ...examBank33, ...examBank34, ...examBank35, ...examBank36, ...examBank37, ...examBank38, ...examBank39, ...examBank40, ...examBank41, ...examBank42, ...examBank43, ...examBank44, ...examBank45, ...examBank46, ...examBank47, ...examBank48, ...examBank49, ...examBank50, ...examBank51];

function questionFingerprint(question: (typeof examBankRaw)[number]): string {
  return JSON.stringify([question.stem.trim(), question.options, question.answer, question.explanation.trim()]);
}

const questionByFingerprint = new Map<string, ExamQuestion>();
export const examBankAll: ExamQuestion[] = [];
for (const question of examBankRaw) {
  const fingerprint = questionFingerprint(question);
  const retained = questionByFingerprint.get(fingerprint);
  if (retained) {
    // 重复题可能被不同批次挂到不同知识词条；合并标签，去重不破坏知识图谱覆盖。
    retained.knowledge_tags = [...new Set([...retained.knowledge_tags, ...question.knowledge_tags])];
    continue;
  }
  const playable = { ...question, knowledge_tags: [...question.knowledge_tags] } as ExamQuestion;
  questionByFingerprint.set(fingerprint, playable);
  examBankAll.push(playable);
}

export const EXAM_BANK_DEDUPE_STATS = {
  source: examBankRaw.length,
  playable: examBankAll.length,
  removed: examBankRaw.length - examBankAll.length,
} as const;

/** 知识库全量（八批合计） */
const debriefAll = [...DEBRIEF_CARDS, ...debriefCardsDeep, ...debriefCardsDeep2, ...debriefCardsDeep3, ...debriefCardsDeep4, ...debriefCardsDeep5];

export const KNOWLEDGE_ALL = [...KNOWLEDGE, ...knowledgeBatch2, ...knowledgeBatch3, ...knowledgeBatch4, ...knowledgeBatch5, ...knowledgeBatch6, ...knowledgeBatch7, ...knowledgeBatch8, ...knowledgeBatch9, ...knowledgeBatch10, ...knowledgeBatch11];

/** 剧情任务全量（卷一~卷五 + 卷六彩蛋卷 + 卷七二周目来客 + 卷八一周目薪火） */
export const QUESTS_ALL = [...VOLUME1_QUESTS, ...VOLUME2_QUESTS, ...VOLUME3_QUESTS, ...VOLUME4_QUESTS, ...VOLUME5_QUESTS, ...EASTER_QUESTS, ...NG_PLUS_QUESTS, ...VOLUME8_QUESTS];

/** 人生线全量（13 条线 109 节点，程季青「薪火」线 8 节点） */
export const LIFELINES_ALL = LIFELINES_FULL;

const clientsAll = [...clients, ...deepClients, ...deepClients2, ...deepClients3, ...deepClients4];

export const contentBundle: ContentBundle = {
  factors,
  industries,
  events: directorEvents,
  releases,
  products,
  clients: clientsAll,
};

export { factors, industries, releases, directorEvents, products, clients, deepClients, deepClients2, deepClients3, deepClients4, eraDrift, eraLevel, examBank, examBank2, KNOWLEDGE, randomEvents, randomEventsDeep, randomEventsDeep2, randomEventsDeep3, randomEventsDeep4, randomEventsDeep5, VOLUME1_QUESTS, VOLUME1_LIFELINES, VOLUME2_QUESTS, VOLUME3_QUESTS, VOLUME4_QUESTS, VOLUME5_QUESTS, EASTER_QUESTS, NG_PLUS_QUESTS, VOLUME8_QUESTS, WANG_LIFELINE, LI_LIFELINE, CHENGJIQING_LIFELINE };
export { debriefAll as DEBRIEF_CARDS };
