import type { ContentBundle } from '@fm/core';
import { factors } from './factors';
import { industries } from './industries';
import { releases } from './releases';
import { directorEvents } from './events';
import { products } from './products';
import { clients } from './clients';
import { deepClients, deepClients2 } from './clients-deep';
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
import { KNOWLEDGE, DEBRIEF_CARDS } from './knowledge';
import { knowledgeBatch2 } from './knowledge2';
import { knowledgeBatch3 } from './knowledge3';
import { knowledgeBatch4 } from './knowledge4';
import { knowledgeBatch5 } from './knowledge5';
import { knowledgeBatch6 } from './knowledge6';
import { knowledgeBatch7 } from './knowledge7';
import { knowledgeBatch8 } from './knowledge8';
import { debriefCardsDeep } from './knowledge6';
import { debriefCardsDeep2 } from './knowledge8';
import { randomEvents, randomEventsDeep, randomEventsDeep2 } from './random-events';
import { VOLUME1_QUESTS, VOLUME1_LIFELINES } from './quests';
import { VOLUME2_QUESTS } from './quests2';
import { VOLUME3_QUESTS } from './quests3';
import { VOLUME4_QUESTS } from './quests4';
import { VOLUME5_QUESTS } from './quests5';
import { EASTER_QUESTS } from './quests6';
import { LIFELINES_FULL, WANG_LIFELINE, LI_LIFELINE } from './lifelines';

/** 全量题库（廿七批合计） */
export const examBankAll = [...examBank, ...examBank2, ...examBank3, ...examBank4, ...examBank5, ...examBank6, ...examBank7, ...examBank8, ...examBank9, ...examBank10, ...examBank11, ...examBank12, ...examBank13, ...examBank14, ...examBank15, ...examBank16, ...examBank17, ...examBank18, ...examBank19, ...examBank20, ...examBank21, ...examBank22, ...examBank23, ...examBank24, ...examBank25, ...examBank26, ...examBank27];

/** 知识库全量（八批合计） */
const debriefAll = [...DEBRIEF_CARDS, ...debriefCardsDeep, ...debriefCardsDeep2];

export const KNOWLEDGE_ALL = [...KNOWLEDGE, ...knowledgeBatch2, ...knowledgeBatch3, ...knowledgeBatch4, ...knowledgeBatch5, ...knowledgeBatch6, ...knowledgeBatch7, ...knowledgeBatch8];

/** 剧情任务全量（卷一~卷五 + 卷六彩蛋卷） */
export const QUESTS_ALL = [...VOLUME1_QUESTS, ...VOLUME2_QUESTS, ...VOLUME3_QUESTS, ...VOLUME4_QUESTS, ...VOLUME5_QUESTS, ...EASTER_QUESTS];

/** 人生线全量（完整版 18 节点：王秀兰 9 + 李建国 9） */
export const LIFELINES_ALL = LIFELINES_FULL;

const clientsAll = [...clients, ...deepClients, ...deepClients2];

export const contentBundle: ContentBundle = {
  factors,
  industries,
  events: directorEvents,
  releases,
  products,
  clients: clientsAll,
};

export { factors, industries, releases, directorEvents, products, clients, deepClients, deepClients2, eraDrift, eraLevel, examBank, examBank2, KNOWLEDGE, randomEvents, randomEventsDeep, randomEventsDeep2, VOLUME1_QUESTS, VOLUME1_LIFELINES, VOLUME2_QUESTS, VOLUME3_QUESTS, VOLUME4_QUESTS, VOLUME5_QUESTS, EASTER_QUESTS, WANG_LIFELINE, LI_LIFELINE };
export { debriefAll as DEBRIEF_CARDS };
