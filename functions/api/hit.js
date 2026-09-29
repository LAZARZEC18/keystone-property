import handler from '../../netlify/functions/hit.mjs';
import { wrap } from '../_cf.js';

export const onRequest = wrap(handler);
