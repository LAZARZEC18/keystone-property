import handler from '../../netlify/functions/property.mjs';
import { wrap } from '../_cf.js';

export const onRequest = wrap(handler);
