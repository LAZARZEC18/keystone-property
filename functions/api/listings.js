import handler from '../../netlify/functions/listings.mjs';
import { wrap } from '../_cf.js';

export const onRequest = wrap(handler);
