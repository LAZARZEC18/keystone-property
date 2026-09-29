import handler from '../../netlify/functions/live.mjs';
import { wrap } from '../_cf.js';

export const onRequest = wrap(handler);
