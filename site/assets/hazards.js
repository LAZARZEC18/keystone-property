// Flood, bushfire and coastal hazard maps for each state. Ownaroo has no hazard layer of its own, so every suburb
// and address page links straight to the official maps, where a buyer can check the exact block before an offer.
import { esc } from './ui.js';

const AFRIP = ['Australian Flood Risk Information Portal (Geoscience Australia)', 'https://afrip.ga.gov.au/flood/map/'];
export const HAZARD_MAPS = {
  NSW: [['Flood', 'NSW Flood Data Portal (NSW SES)', 'https://flooddata.ses.nsw.gov.au/'], ['Bushfire', 'NSW Planning Portal spatial viewer: bush fire prone land and flood planning layers', 'https://www.planningportal.nsw.gov.au/spatialviewer/']],
  VIC: [['Flood and bushfire', 'VicPlan: planning overlays for flooding and the Bushfire Management Overlay', 'https://mapshare.vic.gov.au/vicplan/'], ['Bushfire', 'CFA: am I at risk?', 'https://www.cfa.vic.gov.au/plan-prepare/am-i-at-risk']],
  QLD: [['Flood', 'Queensland FloodCheck', 'https://floodcheck.information.qld.gov.au/'], ['Bushfire', 'Queensland Fire Department: bushfire preparation', 'https://www.qfes.qld.gov.au/prepare/bushfire']],
  WA: [['Flood', 'WA floodplain mapping tool (Department of Water and Environmental Regulation)', 'https://www.wa.gov.au/service/natural-resources/water-resources/floodplain-mapping-tool'], ['Bushfire', 'Map of Bush Fire Prone Areas (Landgate)', 'https://maps.slip.wa.gov.au/landgate/bushfireprone/']],
  SA: [['Flood and bushfire', 'SA Property and Planning Atlas: hazard overlays', 'https://sappa.plan.sa.gov.au/'], ['Bushfire', 'Country Fire Service', 'https://www.cfs.sa.gov.au/']],
  TAS: [['Flood and bushfire', 'LISTmap: planning scheme hazard overlays', 'https://maps.thelist.tas.gov.au/listmap/app/list/map'], ['Bushfire', 'Tasmania Fire Service', 'https://www.fire.tas.gov.au/']],
  ACT: [['Flood and bushfire', 'ACTmapi: bushfire prone area and flood layers', 'https://www.actmapi.act.gov.au/'], ['Bushfire', 'ACT Emergency Services Agency: bushfire', 'https://www.esa.act.gov.au/be-emergency-ready/bushfire']],
  NT: [['Flood', 'NT floodplain maps', 'https://nt.gov.au/environment/water/water-in-the-nt/flooding-and-storm-surge/floodplain'], ['Storm surge', 'NT storm surge inundation maps', 'https://depws.nt.gov.au/water/water-resources/flooding-reports-maps/storm-surge-inundation-maps'], ['Bushfire', 'SecureNT: prepare for bushfires', 'https://securent.nt.gov.au/']],
};

/** A card of the official hazard maps for a state. coastKm: distance to the coast, to add a coastal note. */
export function hazardCard(state, { place = '', coastKm = null, compact = false } = {}) {
  const maps = [...(HAZARD_MAPS[state] || []), ['Flood (national)', ...AFRIP]];
  const coastal = coastKm !== null && coastKm !== undefined && coastKm < 1.5;
  return `<div class="card hazard-card">
    <div class="card-head"><h3>Flood, bushfire and coastal risk${place ? ` in ${esc(place)}` : ''}</h3><span class="tag warn-tag">Check before you offer</span></div>
    <p class="note" style="margin-top:0">Ownaroo doesn't map hazards yet, and its scores don't include them. Insurance can make or break a purchase, so check the exact address on the official maps below, and get an insurance quote before you sign.${coastal ? ' This area is close to the coast: ask the council about coastal erosion and storm-tide mapping too.' : ''}</p>
    <ul class="hazard-links${compact ? ' compact' : ''}">${maps.map(([k, t, u]) => `<li><span class="tag">${esc(k)}</span> <a href="${u}" target="_blank" rel="noopener">${esc(t)} ↗</a></li>`).join('')}</ul>
    <p class="fine">Maps are run by state agencies and councils and can be out of date. Your conveyancer's searches and the council's planning certificate are the final word.</p>
  </div>`;
}
