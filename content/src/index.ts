import type { ContentBundle } from '@fm/core';
import { factors } from './factors';
import { industries } from './industries';
import { releases } from './releases';
import { directorEvents } from './events';
import { products } from './products';
import { clients } from './clients';
import { eraDrift, eraLevel } from './macro';
import { examBank } from './exams';
import { examBank2 } from './exams2';
import { examBank3 } from './exams3';
import { examBank4 } from './exams4';
import { examBank5 } from './exams5';
import { examBank6 } from './exams6';
import { KNOWLEDGE, DEBRIEF_CARDS } from './knowledge';
import { knowledgeBatch2 } from './knowledge2';
import { knowledgeBatch3 } from './knowledge3';
import { knowledgeBatch4 } from './knowledge4';
import { knowledgeBatch5 } from './knowledge5';
import { randomEvents } from './random-events';
import { VOLUME1_QUESTS, VOLUME1_LIFELINES } from './quests';
import { VOLUME2_QUESTS } from './quests2';
import { VOLUME3_QUESTS } from './quests3';
import { LIFELINES_FULL, WANG_LIFELINE, LI_LIFELINE } from './lifelines';

/** 全量题库（六批合计） */
export const examBankAll = [...examBank, ...examBank2, ...examBank3, ...examBank4, ...examBank5, ...examBank6];

/** 知识库全量（五批合计） */
export const KNOWLEDGE_ALL = [...KNOWLEDGE, ...knowledgeBatch2, ...knowledgeBatch3, ...knowledgeBatch4, ...knowledgeBatch5];

/** 剧情任务全量（卷一~卷三） */
export const QUESTS_ALL = [...VOLUME1_QUESTS, ...VOLUME2_QUESTS, ...VOLUME3_QUESTS];

/** 人生线全量（完整版 18 节点：王秀兰 9 + 李建国 9） */
export const LIFELINES_ALL = LIFELINES_FULL;

export const contentBundle: ContentBundle = {
  factors,
  industries,
  events: directorEvents,
  releases,
  products,
  clients,
};

export { factors, industries, releases, directorEvents, products, clients, eraDrift, eraLevel, examBank, examBank2, KNOWLEDGE, DEBRIEF_CARDS, randomEvents, VOLUME1_QUESTS, VOLUME1_LIFELINES, VOLUME2_QUESTS, VOLUME3_QUESTS, WANG_LIFELINE, LI_LIFELINE };
