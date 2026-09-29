import handler from '../../netlify/functions/photos.mjs';
import { wrap } from '../_cf.js';

export const onRequest = wrap(handler);
