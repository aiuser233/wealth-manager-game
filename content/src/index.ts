import type { ContentBundle } from '@fm/core';
import { factors } from './factors';
import { industries } from './industries';
import { releases } from './releases';
import { directorEvents } from './events';
import { products } from './products';
import { clients } from './clients';
import { eraDrift, eraLevel } from './macro';

export const contentBundle: ContentBundle = {
  factors,
  industries,
  events: directorEvents,
  releases,
  products,
  clients,
};

export { factors, industries, releases, directorEvents, products, clients, eraDrift, eraLevel };
