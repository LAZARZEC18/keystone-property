import handler from '../../netlify/functions/geocode.mjs';
import { wrap } from '../_cf.js';

export const onRequest = wrap(handler);
