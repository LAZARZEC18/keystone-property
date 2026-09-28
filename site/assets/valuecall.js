// Where an asking price sits against a suburb estimate's likely range. Pure functions (no DOM).

export function valueCall(asking, est, { measured = true } = {}) {
  if (!asking || !est) return null;
  const gap = (asking / est.value - 1) * 100;
  // Outside the range: say so. Inside it, only a measured (official-sales) estimate is precise enough to say
  // which part of the range a price sits in; a modelled one can't, so it doesn't pretend to.
  if (asking < est.low) return { key: 'below', label: 'Below the likely range', cls: 'up', gap, pos: 0, note: 'The asking price is under Keyzing\'s range for a typical home like this. There may be a reason: condition, position, or a seller who needs to move. Recent sales in the street will tell you.' };
  if (asking > est.high) return { key: 'above', label: 'Above the likely range', cls: 'down', gap, pos: 1, note: 'The asking price is over Keyzing\'s range for a typical home like this. Better-than-typical homes sell above it; recent sales in the street will show whether this is one.' };
  const pos = (asking - est.low) / Math.max(1, est.high - est.low);
  if (!measured) return { key: 'within', label: 'Within the likely range', cls: '', gap, pos, note: 'This suburb\'s estimate is modelled, so its range is too wide to say more than that. Recent sales in the street are the real guide.' };
  if (pos < 1 / 3) return { key: 'lower', label: 'In the lower third of the likely range', cls: 'up', gap, pos, note: 'Toward the bottom of the range for a typical home like this. Recent sales in the street will show why.' };
  if (pos > 2 / 3) return { key: 'upper', label: 'In the upper third of the likely range', cls: 'down', gap, pos, note: 'Toward the top of the range for a typical home like this; better-than-typical features or position can justify it. Compare recent sales in the street.' };
  return { key: 'within', label: 'In the middle of the likely range', cls: '', gap, pos, note: 'Close to a typical home with these features. Recent sales in the same street will narrow it down.' };
}

/** Small bar showing where a price sits in the estimate's range. */
export function rangeBar(asking, est) {
  if (!asking || !est) return '';
  const lo = est.low * 0.9;
  const hi = est.high * 1.1;
  const x = (v) => Math.max(0, Math.min(100, ((v - lo) / (hi - lo)) * 100));
  return `<div class="range-bar" role="img" aria-label="Asking price position within the estimated range"><span class="rb-band" style="left:${x(est.low)}%;width:${x(est.high) - x(est.low)}%"></span><span class="rb-third" style="left:${x(est.low + (est.high - est.low) / 3)}%"></span><span class="rb-third" style="left:${x(est.low + (2 * (est.high - est.low)) / 3)}%"></span><span class="rb-mark" style="left:${x(asking)}%"></span></div><div class="spread fine"><span>${Math.round(est.low / 1000)}k</span><span>estimate ${Math.round(est.value / 1000)}k</span><span>${Math.round(est.high / 1000)}k</span></div>`;
}

