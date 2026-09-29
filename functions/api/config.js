import handler from '../../netlify/functions/config.mjs';
import { wrap } from '../_cf.js';

export const onRequest = wrap(handler);
