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
import { KNOWLEDGE, DEBRIEF_CARDS } from './knowledge';
import { randomEvents } from './random-events';

/** 全量题库（两批合计） */
export const examBankAll = [...examBank, ...examBank2];

export const contentBundle: ContentBundle = {
  factors,
  industries,
  events: directorEvents,
  releases,
  products,
  clients,
};

export { factors, industries, releases, directorEvents, products, clients, eraDrift, eraLevel, examBank, examBank2, KNOWLEDGE, DEBRIEF_CARDS, randomEvents };
