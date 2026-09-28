// How far to trust a Keyzing value estimate, stated per state from the model's own out-of-sample test.
import { pct } from './ui.js';

const STATE_NAMES = { NSW: 'NSW', VIC: 'Victoria', QLD: 'Queensland', SA: 'South Australia', WA: 'Western Australia', TAS: 'Tasmania', NT: 'the Northern Territory', ACT: 'the ACT' };

/**
 * @param s suburb row (s.s state, s.conf high|medium|medium-low|low)
 * @param type 'h' | 'u'
 * @param model site/data/model.json (optional)
 * @returns {{level:'measured'|'tested'|'untested', label:string, text:string}}
 */
export function accuracy(s, type, model) {
  const h = model?.model?.holdout || {};
  const t = h[s.s];
  const tested = Object.entries(h).map(([k, v]) => `${k} ${pct(v.medianAbsPctError, 1)}`).join(', ') || 'VIC 11.9%, SA 11.3%, NSW 19.5%';
  const unitR2 = model?.model?.unitR2;
  const unit = type === 'u' ? ` Unit estimates are weaker than house estimates${unitR2 ? ` (the unit model explains about ${Math.round(unitR2 * 100)}% of the differences in unit prices between suburbs)` : ''}.` : '';
  if (s.conf === 'high' || s.conf === 'medium') {
    return { level: 'measured', label: 'Starting value measured', text: `The suburb starting value comes from official ${s.conf === 'high' ? 'suburb' : 'postcode'} sales in ${STATE_NAMES[s.s] || s.s}. The range reflects how much individual homes differ from the typical one.${unit}` };
  }
  if (t) {
    return { level: 'tested', label: `Modelled · tested in ${s.s}`, text: `No official sales series for this suburb, so its starting value is modelled. Tested on ${STATE_NAMES[s.s]} suburbs it hadn't seen, the model's median error was ${pct(t.medianAbsPctError, 1)}, and ${pct(t.within20pct, 0)} of suburbs were within 20%.${unit}` };
  }
  return { level: 'untested', label: `Modelled · not yet tested in ${s.s}`, text: `No official sales series for this suburb, and the model has not been tested against official sales in ${STATE_NAMES[s.s] || s.s}: it was validated only in Victoria, South Australia and NSW (median error ${tested}). Treat this as indicative only, and check recent sales in the street before relying on it.${unit}` };
}
