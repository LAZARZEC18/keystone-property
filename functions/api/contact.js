import handler from '../../netlify/functions/contact.mjs';
import { wrap } from '../_cf.js';

export const onRequest = wrap(handler);
