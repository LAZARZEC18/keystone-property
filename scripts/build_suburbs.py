"""
Build Keystone's national suburb dataset.

Joins, for every Australian suburb/locality (ABS SAL 2021):
  * geography: centroid, state, postcode, capital-city/regional area, council (LGA 2025), remoteness
  * ABS Census 2021 (and 2016 for change): population, income, rent, mortgage, tenure, dwelling mix, unemployment
  * official sales medians where a state publishes them openly:
      VIC Valuer-General Victorian Property Sales Report (houses + units, by suburb)
      SA  Land Services SA metropolitan median house sales (by suburb)
      NSW DCJ Rent and Sales Report (sales + bond rents, by postcode)
  * a Keystone price and rent model calibrated on those official medians, anchored to current
    Cotality regional medians, for every suburb that has no official figure.

Outputs site/data/suburbs.json (national index) and site/data/model.json (fit statistics).
Run: python3 scripts/build_suburbs.py  (needs data/raw/*, see scripts/fetch_raw.sh)
"""
import json, math, os, re, sys, glob
from collections import defaultdict

import numpy as np
import pandas as pd
import shapefile
from shapely.geometry import shape, Point
from shapely.strtree import STRtree

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.environ.get('KEYSTONE_RAW', os.path.join(ROOT, 'data', 'raw'))
OUT = os.path.join(ROOT, 'site', 'data')
MARKET = json.load(open(os.path.join(ROOT, 'data', 'market.json')))

STATE_ABBR = {'1': 'NSW', '2': 'VIC', '3': 'QLD', '4': 'SA', '5': 'WA', '6': 'TAS', '7': 'NT', '8': 'ACT', '9': 'OT'}
UNIT_ELASTICITY = 0.45
CBD = {'SYD': (-33.8688, 151.2093), 'MEL': (-37.8136, 144.9631), 'BNE': (-27.4698, 153.0251), 'ADL': (-34.9285, 138.6007),
       'PER': (-31.9523, 115.8613), 'HBA': (-42.8821, 147.3272), 'DRW': (-12.4634, 130.8456), 'CBR': (-35.2809, 149.1300)}
GCC_REGION = {'1GSYD': 'SYD', '1RNSW': 'RNSW', '2GMEL': 'MEL', '2RVIC': 'RVIC', '3GBRI': 'BNE', '3RQLD': 'RQLD',
              '4GADE': 'ADL', '4RSAU': 'RSA', '5GPER': 'PER', '5RWAU': 'RWA', '6GHOB': 'HBA', '6RTAS': 'RTAS',
              '7GDAR': 'DRW', '7RNTE': 'RNT', '8ACTE': 'CBR'}


def log(*a):
    print(*a, file=sys.stderr, flush=True)


def norm_name(s):
    s = str(s or '').upper()
    s = re.sub(r'\s*\(.*?\)\s*', ' ', s)          # "Richmond (Vic.)" -> "RICHMOND"
    s = s.replace('&', 'AND').replace("'", '').replace('’', '')
    s = re.sub(r'\bST\.?\s', 'ST ', s)
    s = re.sub(r'\bMOUNT\b', 'MT', s)
    s = re.sub(r'[^A-Z0-9 ]', ' ', s)
    return re.sub(r'\s+', ' ', s).strip()


def num(x):
    try:
        if x is None or (isinstance(x, float) and math.isnan(x)):
            return None
        if isinstance(x, str):
            x = x.replace(',', '').replace('$', '').strip()
            if x in ('', '-', 's', '(s)', '^', '.', 'NA', 'n.a.'):
                return None
        v = float(x)
        return v if math.isfinite(v) else None
    except (TypeError, ValueError):
        return None


# ---------------------------------------------------------------- geography
def load_polys(path, key_fields):
    r = shapefile.Reader(path)
    geoms, recs = [], []
    for sr in r.iterShapeRecords():
        if not sr.shape.points:
            continue
        g = shape(sr.shape.__geo_interface__)
        if not g.is_valid:
            g = g.buffer(0)
        geoms.append(g)
        recs.append({k: sr.record[k] for k in key_fields})
    return geoms, recs


def locate(points, geoms, recs):
    tree = STRtree(geoms)
    out = []
    for p in points:
        hit = None
        for i in tree.query(p):
            if geoms[i].contains(p):
                hit = recs[i]
                break
        if hit is None:  # coastal slivers: nearest polygon
            i = tree.nearest(p)
            hit = recs[i]
        out.append(hit)
    return out


def coastline():
    from shapely.ops import unary_union
    geoms, _ = load_polys(os.path.join(RAW, 'b_GCCSA/GCCSA_2021_AUST_GDA2020'), ['GCC_CODE21'])
    land = unary_union([g.simplify(0.005) for g in geoms])
    polys = list(land.geoms) if hasattr(land, 'geoms') else [land]
    # keep the mainland + Tasmania + sizeable islands; boundary = coastline
    polys = [p for p in polys if p.area > 0.002]
    return unary_union([p.exterior for p in polys])


def build_geography():
    log('geography: SAL')
    r = shapefile.Reader(os.path.join(RAW, 'b_SAL', 'SAL_2021_AUST_GDA2020'))
    rows = []
    for sr in r.iterShapeRecords():
        rec = sr.record
        if not sr.shape.points:
            continue
        code = rec['SAL_CODE21']
        name = rec['SAL_NAME21']
        if re.search(r'No usual address|Migratory|Offshore|Shipping', name):
            continue
        g = shape(sr.shape.__geo_interface__)
        if not g.is_valid:
            g = g.buffer(0)
        pt = g.representative_point()
        rows.append({'code': 'SAL' + code, 'name': name, 'state': STATE_ABBR.get(rec['STE_CODE21'], 'OT'),
                     'area': round(rec['AREASQKM21'] or 0, 3), 'pt': pt})
    pts = [x['pt'] for x in rows]
    for label, path, fields in [
        ('poa', 'b_POA/POA_2021_AUST_GDA2020', ['POA_CODE21']),
        ('gcc', 'b_GCCSA/GCCSA_2021_AUST_GDA2020', ['GCC_CODE21']),
        ('lga', 'b_LGA_2025/LGA_2025_AUST_GDA2020', ['LGA_NAME25']),
        ('lgc', 'b_LGA_2025/LGA_2025_AUST_GDA2020', ['LGA_CODE25']),
        ('sa2', 'b_SA2/SA2_2021_AUST_GDA2020', ['SA2_CODE21']),
        ('ra', 'b_RA/RA_2021_AUST_GDA2020', ['RA_NAME21']),
    ]:
        log('geography:', label)
        geoms, recs = load_polys(os.path.join(RAW, path), fields)
        hits = locate(pts, geoms, recs)
        for x, h in zip(rows, hits):
            x[label] = list(h.values())[0]
    log('geography: coastline')
    coast = coastline()
    for x in rows:
        x['coast_km'] = coast.distance(x['pt']) * 100  # degrees -> ~km (good enough as a log feature)
    for x in rows:
        x['lat'] = round(x['pt'].y, 5)
        x['lng'] = round(x['pt'].x, 5)
        x['region'] = GCC_REGION.get(x['gcc'])
        x['ra'] = re.sub(r' of Australia.*$', '', x['ra'] or '').replace('Australia', '').strip()
        x['lga'] = re.sub(r'\s*\(.*?\)$', '', x['lga'] or '')
        del x['pt']
    return rows


# ---------------------------------------------------------------- census
def census():
    d21 = os.path.join(RAW, 'c21', '2021 Census GCP Suburbs and Localities for AUS')
    d16 = os.path.join(RAW, 'c16', '2016 Census GCP State Suburbs for AUST')
    rd = lambda t: pd.read_csv(os.path.join(d21, f'2021Census_{t}_AUST_SAL.csv')).set_index('SAL_CODE_2021')
    g01, g02, g36, g37, g43 = rd('G01'), rd('G02'), rd('G36'), rd('G37'), rd('G43')
    c = pd.DataFrame(index=g01.index)
    c['pop'] = g01['Tot_P_P']
    c['age'] = g02['Median_age_persons']
    c['mort'] = g02['Median_mortgage_repay_monthly']
    c['rent21'] = g02['Median_rent_weekly']
    c['hhinc'] = g02['Median_tot_hhd_inc_weekly']
    c['hhsize'] = g02['Average_household_size']
    tot = g37['Total_Total'].replace(0, np.nan)
    c['ownOutright'] = g37['O_OR_Total'] / tot
    c['ownMortgage'] = g37['O_MTG_Total'] / tot
    c['renters'] = g37['R_Tot_Total'] / tot
    c['socialHousing'] = g37['R_ST_h_auth_Total'] / tot
    opd = g36['OPDs_Tot_OPDs_Dwellings'].replace(0, np.nan)
    c['houses'] = g36['OPDs_Separate_house_Dwellings'] / opd
    c['flats'] = g36['OPDs_Flt_apart_Tot_Dwgs'] / opd
    c['dwellings'] = g36['Total_PDs_Dwellings']
    c['occupied'] = g36['OPDs_Tot_OPDs_Dwellings'] / g36['Total_PDs_Dwellings'].replace(0, np.nan)
    c['unemp'] = g43['Percent_Unem_loyment_P']

    # 2016 State Suburbs, matched on normalised name + state
    geo16 = pd.read_excel(os.path.join(RAW, 'c16', 'Metadata', '2016Census_geog_desc_1st_and_2nd_release.xlsx'),
                          sheet_name='2016_ASGS_Non-ABS_Structures')
    geo16 = geo16[geo16['ASGS_Structure'] == 'SSC']
    names16 = {row['Census_Code_2016']: row['Census_Name_2016'] for _, row in geo16.iterrows()}
    r16 = lambda t: pd.read_csv(os.path.join(d16, f'2016Census_{t}_AUS_SSC.csv')).set_index('SSC_CODE_2016')
    a, b = r16('G01'), r16('G02')
    old = {}
    for code in a.index:
        nm = names16.get(code)
        if not nm:
            continue
        st = STATE_ABBR.get(str(code)[3:4])
        old[(norm_name(nm), st)] = {'pop16': a.at[code, 'Tot_P_P'], 'rent16': b.at[code, 'Median_rent_weekly'],
                                    'mort16': b.at[code, 'Median_mortgage_repay_monthly'],
                                    'hhinc16': b.at[code, 'Median_tot_hhd_inc_weekly']}
    return c, old


# ---------------------------------------------------------------- official medians
MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
PERIODS = {}


def months_between(y1, m1, y2, m2):
    return (y2 - y1) * 12 + (m2 - m1)


def vic_period(path):
    x = pd.read_excel(path, header=None, nrows=3)
    lab, yr = str(x.iloc[1, 9]).strip(), int(float(x.iloc[2, 9]))
    end = MONTHS.index(lab.split('-')[-1][:3]) + 1
    return f'{lab} {yr}', yr, end - 1  # (label, year, mid-month)

def vic_quarterly(path):
    x = pd.read_excel(path, header=None)
    out = {}
    for _, r in x.iterrows():
        nm = r[0]
        if not isinstance(nm, str) or nm.strip() in ('Locality', '') or 'VICTORIA' in nm.upper() or 'GROUP TOTAL' in nm.upper():
            continue
        vals = [num(v) for v in r[1:11]]
        medians = [v for v in vals if v and v > 20000]
        if len(medians) < 5:
            continue
        # columns: 5 quarters (with '^' flags between), then sales Oct-Dec, sales 2025 total, changes
        tail = [num(v) for v in r[11:15]]
        out[norm_name(nm)] = {'median': medians[-1], 'medianYearAgo': medians[0],
                              'sales': tail[0], 'salesYear': tail[1]}
    return out


def vic_timeseries(path):
    x = pd.read_excel(path, header=None)
    hdr = x.iloc[1].tolist()
    year_cols = [(i, int(v)) for i, v in enumerate(hdr) if isinstance(v, (int, float)) and not pd.isna(v) and 2000 < v < 2100]
    out = {}
    for _, r in x.iloc[4:].iterrows():
        nm = r[0]
        if not isinstance(nm, str):
            continue
        series = {}
        for i, y in year_cols:
            v = num(r[i])
            if v and v > 20000:
                series[y] = v
        if series:
            out[norm_name(nm)] = series
    return out


def sa_medians():
    files = sorted(glob.glob(os.path.join(RAW, 'sa_*.xlsx')))
    agg = defaultdict(lambda: {'now_w': 0, 'now_s': 0, 'ago_w': 0, 'ago_s': 0})
    for f in files:
        x = pd.read_excel(f, header=0)
        cols = list(x.columns)
        for _, r in x.iterrows():
            nm = r[cols[1]]
            if not isinstance(nm, str):
                continue
            s0, m0, s1, m1 = num(r[cols[2]]), num(r[cols[3]]), num(r[cols[4]]), num(r[cols[5]])
            a = agg[norm_name(nm)]
            if s1 and m1:
                a['now_w'] += s1 * m1; a['now_s'] += s1
            if s0 and m0:
                a['ago_w'] += s0 * m0; a['ago_s'] += s0
    out = {}
    for k, a in agg.items():
        if a['now_s'] >= 8:
            out[k] = {'median': a['now_w'] / a['now_s'], 'sales': a['now_s'],
                      'medianYearAgo': a['ago_w'] / a['ago_s'] if a['ago_s'] >= 8 else None}
    last = sorted(files)[-1]
    m = re.search(r'sa_(\d{4})q(\d)', os.path.basename(last))
    y, q = int(m.group(1)), int(m.group(2))
    end_m = q * 3
    start_y, start_m = (y - 1, end_m + 1) if end_m < 12 else (y, 1)
    PERIODS['SA'] = (f'{MONTHS[start_m - 1]} {start_y}-{MONTHS[end_m - 1]} {y}', y, end_m - 6 if end_m > 6 else end_m + 6 - 12)
    if end_m <= 6:
        PERIODS['SA'] = (PERIODS['SA'][0], y - 1, end_m + 6)
    return out, len(files)


def nsw_postcode(path, kind):
    x = pd.read_excel(path, sheet_name='Postcode', header=None)
    per = next((str(v) for v in x[0].head(4) if isinstance(v, str) and 'period' in v.lower()), '')
    mm = re.search(r'(January|February|March|April|May|June|July|August|September|October|November|December)\s*(?:-|to)\s*(January|February|March|April|May|June|July|August|September|October|November|December)\s*(\d{4})', per)
    if mm:
        a, b, yr = mm.group(1)[:3], mm.group(2)[:3], int(mm.group(3))
        PERIODS['NSW_' + kind] = (f'{a}-{b} {yr}', yr, MONTHS.index(b) )  # mid-month of the quarter
    hdr_row = x.index[x[0].astype(str).str.strip() == 'Postcode'][0]
    data = x.iloc[hdr_row + 1:]
    out = defaultdict(dict)
    for _, r in data.iterrows():
        pc = r[0]
        if pd.isna(pc):
            continue
        pc = str(int(pc)) if isinstance(pc, (int, float)) else str(pc).strip()
        pc = pc.zfill(4)
        if kind == 'sales':
            dtype = str(r[1]).strip()
            med = num(r[3])
            cnt = num(r[6])
            ann = num(str(r[8]).replace('%', '')) if isinstance(r[8], str) else num(r[8])
            if med:
                out[pc][dtype] = {'median': med * 1000, 'sales': cnt, 'annualPct': ann}
        else:
            dtype, beds = str(r[1]).strip(), str(r[2]).strip()
            med = num(r[4])
            if med and beds == 'Total':
                out[pc][dtype] = {'rent': med, 'bonds': num(r[7])}
    return out


# ---------------------------------------------------------------- main
def main():
    geo = build_geography()
    c, old = census()
    log('suburbs:', len(geo))
    PERIODS['VIC'] = vic_period(os.path.join(RAW, 'vic_house_q4_2025.xls'))
    vic_h = vic_quarterly(os.path.join(RAW, 'vic_house_q4_2025.xls'))
    vic_u = vic_quarterly(os.path.join(RAW, 'vic_unit_q4_2025.xls'))
    vic_ts = vic_timeseries(os.path.join(RAW, 'vic_house_ts_wb.xlsx'))
    sa, sa_files = sa_medians()
    nsw_s = nsw_postcode(os.path.join(RAW, 'nsw_sales.xlsx'), 'sales')
    nsw_r = nsw_postcode(os.path.join(RAW, 'nsw_rent.xlsx'), 'rent')
    log(f'official: VIC houses {len(vic_h)}, units {len(vic_u)}, ts {len(vic_ts)}; SA {len(sa)} ({sa_files} qtrs); NSW sales pcs {len(nsw_s)}, rent pcs {len(nsw_r)}')

    regions = MARKET['regions']
    recs = []
    for g in geo:
        if g['code'] not in c.index or not g['region']:
            continue
        row = c.loc[g['code']]
        pop = num(row['pop']) or 0
        if pop < 50:  # skip empty localities (national parks, industrial estates)
            continue
        r = dict(g)
        for k in ['pop', 'age', 'mort', 'rent21', 'hhinc', 'hhsize', 'ownOutright', 'ownMortgage', 'renters',
                  'socialHousing', 'houses', 'flats', 'dwellings', 'occupied', 'unemp']:
            r[k] = num(row[k])
        o = old.get((norm_name(g['name']), g['state']))
        if o:
            p16 = num(o['pop16'])
            r['popGrowth5'] = (pop / p16 - 1) * 100 if p16 and p16 >= 50 else None
            i16 = num(o['hhinc16'])
            r['incGrowth5'] = (r['hhinc'] / i16 - 1) * 100 if i16 and r['hhinc'] else None
            t16 = num(o['rent16'])
            r['rentGrowth5'] = (r['rent21'] / t16 - 1) * 100 if t16 and r['rent21'] else None
        key = norm_name(g['name'])
        off = {}
        if g['state'] == 'VIC':
            if key in vic_h:
                off['house'] = {**vic_h[key], 'period': PERIODS['VIC'][0], 'source': 'VIC'}
            if key in vic_u:
                off['unit'] = {**vic_u[key], 'period': PERIODS['VIC'][0], 'source': 'VIC'}
            ts = vic_ts.get(key)
            if ts and len(ts) >= 6:
                ys = sorted(ts)
                y0, y1 = ys[0], ys[-1]
                off['cagr'] = ((ts[y1] / ts[y0]) ** (1 / (y1 - y0)) - 1) * 100
                off['cagrYears'] = f'{y0}-{y1}'
                off['history'] = [[y, ts[y]] for y in ys]
        elif g['state'] == 'SA' and key in sa and g['region'] == 'ADL':
            off['house'] = {**sa[key], 'period': PERIODS['SA'][0], 'source': 'SA'}
        elif g['state'] == 'NSW' and g['poa'] in nsw_s:
            s = nsw_s[g['poa']]
            if 'Non Strata' in s and (s['Non Strata']['sales'] or 0) >= 10:
                off['house'] = {**s['Non Strata'], 'period': PERIODS['NSW_sales'][0], 'source': 'NSW', 'postcode': True}
            if 'Strata' in s and (s['Strata']['sales'] or 0) >= 10:
                off['unit'] = {**s['Strata'], 'period': PERIODS['NSW_sales'][0], 'source': 'NSW', 'postcode': True}
        if g['state'] == 'NSW' and g['poa'] in nsw_r:
            rr = nsw_r[g['poa']]
            off['rent'] = {'all': rr.get('Total', {}).get('rent'), 'house': rr.get('House', {}).get('rent'),
                           'unit': rr.get('Flat/Unit', {}).get('rent'), 'bonds': rr.get('Total', {}).get('bonds'),
                           'period': PERIODS['NSW_rent'][0], 'source': 'NSW', 'postcode': True}
        r['official'] = off
        recs.append(r)
    log('kept suburbs:', len(recs))

    df = pd.DataFrame(recs)
    # --- relative-to-region features (population-weighted medians of the region)
    def wmed(v, w):
        m = ~(v.isna() | w.isna())
        v, w = v[m].values, w[m].values
        if not len(v):
            return np.nan
        o = np.argsort(v); v, w = v[o], w[o]
        cw = np.cumsum(w)
        return v[np.searchsorted(cw, cw[-1] / 2)]

    reg = {}
    for code, grp in df.groupby('region'):
        # typical private market only: remote communities with mostly social housing drag medians down
        mkt = grp[(grp['socialHousing'].fillna(0) < 0.3) & (grp['pop'] >= 200)]
        reg[code] = {k: wmed(mkt[k].where(mkt[k] > (100 if k == 'rent21' else 0)), mkt['pop']) for k in ['mort', 'rent21', 'hhinc']}
    for k in ['mort', 'rent21', 'hhinc']:
        df[k + '_rel'] = [np.log(v / reg[rg][k]) if v and v > 0 and reg[rg][k] else np.nan for v, rg in zip(df[k], df['region'])]
    df['dens'] = np.log((df['pop'] / df['area'].clip(lower=0.05)).clip(lower=1))
    reg_dens = df.groupby('region')['dens'].median()
    df['dens_rel'] = df['dens'] - df['region'].map(reg_dens)
    # distance to the capital's CBD (km): the single biggest price gradient inside a capital city
    def km(a, b, c, d):
        R = 6371; p1, p2 = math.radians(a), math.radians(c)
        dp, dl = p2 - p1, math.radians(d - b)
        return 2 * R * math.asin(math.sqrt(math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2))
    df['cbd_km'] = [km(la, lo, *CBD[rg]) if rg in CBD else np.nan for la, lo, rg in zip(df['lat'], df['lng'], df['region'])]
    df['cap'] = df['region'].map(lambda rg: 1.0 if rg in CBD else 0.0)
    df['logcbd'] = np.where(df['cap'] == 1, np.log(df['cbd_km'].clip(lower=1)) - np.log(15), 0.0)
    df['logcoast'] = np.log(df['coast_km'].clip(lower=0.3)) - np.log(20)
    for k, lab in [('ra_inner', 'Inner Regional'), ('ra_outer', 'Outer Regional'), ('ra_remote', 'Remote'), ('ra_vremote', 'Very Remote')]:
        df[k] = (df['ra'] == lab).astype(float)
    df['flats_cap'] = df['flats'] * df['cap']
    df['dens_cap'] = df['dens_rel'] * df['cap']
    df['mort_cap'] = df['mort_rel'] * df['cap']
    df['inc_cap'] = df['hhinc_rel'] * df['cap']

    # --- training target: official house median relative to its region's official median
    def off_house(o):
        h = o.get('house') if isinstance(o, dict) else None
        return h['median'] if h and h.get('median') else np.nan
    df['off_house'] = df['official'].map(off_house)
    reg_off = df.dropna(subset=['off_house']).groupby('region')['off_house'].median()
    df['y'] = np.log(df['off_house'] / df['region'].map(reg_off))
    feats = ['mort_rel', 'rent21_rel', 'hhinc_rel', 'ownOutright', 'flats_cap', 'dens_cap', 'logcbd', 'logcoast', 'mort_cap', 'inc_cap', 'ra_inner', 'ra_outer', 'ra_remote', 'ra_vremote']
    train = df.dropna(subset=['y'] + feats)
    # NSW postcode medians are shared by several suburbs; keep one row per postcode to avoid double counting
    train = pd.concat([train[train.state != 'NSW'], train[train.state == 'NSW'].drop_duplicates('poa')])
    X = np.column_stack([np.ones(len(train))] + [train[f].values for f in feats])
    y = train['y'].values
    beta, *_ = np.linalg.lstsq(X, y, rcond=None)
    pred_tr = X @ beta
    ss_res = ((y - pred_tr) ** 2).sum(); ss_tot = ((y - y.mean()) ** 2).sum()
    r2 = 1 - ss_res / ss_tot
    rmse = float(np.sqrt(ss_res / len(y)))
    # hold-out check: fit on two states, test on the third
    holdout = {}
    for st in ['VIC', 'SA', 'NSW']:
        tr, te = train[train.state != st], train[train.state == st]
        if len(te) < 20:
            continue
        Xtr = np.column_stack([np.ones(len(tr))] + [tr[f].values for f in feats])
        b, *_ = np.linalg.lstsq(Xtr, tr['y'].values, rcond=None)
        Xte = np.column_stack([np.ones(len(te))] + [te[f].values for f in feats])
        p = Xte @ b
        err = np.abs(np.exp(p - te['y'].values) - 1)
        holdout[st] = {'n': int(len(te)), 'medianAbsPctError': round(float(np.median(err)) * 100, 1),
                       'within20pct': round(float((err < 0.2).mean()) * 100, 1),
                       'r2': round(float(1 - ((te['y'].values - p) ** 2).sum() / ((te['y'].values - te['y'].values.mean()) ** 2).sum()), 3)}
    log('model r2', round(r2, 3), 'rmse', round(rmse, 3), 'holdout', holdout)

    # --- unit model: same features, trained on official unit medians (VIC by suburb, NSW strata by postcode)
    def off_unit(o):
        u = o.get('unit') if isinstance(o, dict) else None
        return u['median'] if u and u.get('median') else np.nan
    df['off_unit'] = df['official'].map(off_unit)
    reg_off_u = df.dropna(subset=['off_unit']).groupby('region')['off_unit'].median()
    df['yu'] = np.log(df['off_unit'] / df['region'].map(reg_off_u))
    tru = df.dropna(subset=['yu'] + feats)
    tru = pd.concat([tru[tru.state != 'NSW'], tru[tru.state == 'NSW'].drop_duplicates('poa')])
    Xu = np.column_stack([np.ones(len(tru))] + [tru[f].values for f in feats])
    beta_u, *_ = np.linalg.lstsq(Xu, tru['yu'].values, rcond=None)
    pu = Xu @ beta_u
    r2u = 1 - ((tru['yu'].values - pu) ** 2).sum() / ((tru['yu'].values - tru['yu'].values.mean()) ** 2).sum()
    log('unit model r2', round(float(r2u), 3), 'n', len(tru))

    # --- region anchors (current, Aug 2026)
    def anchor_house(rg):
        m = regions[rg]
        if m.get('medianHouse'):
            return m['medianHouse']
        return m['medianDwelling'] * 1.04  # regional stock is mostly houses; houses sit ~4% above dwellings
    def anchor_unit(rg):
        m = regions[rg]
        return m.get('medianUnit') or m['medianDwelling'] * 0.72

    # Official medians are rolled forward to Aug 2026 with the region's movement since their period.
    # Quarter-lag factors from Cotality (quarterPct = last 3 months). Periods: VIC Q4-2025, SA to Jun-2026, NSW Q1-2026.
    def roll(region, period_months_ago):
        m = regions[region]
        annual = m['annualPct'] / 100
        return (1 + annual) ** (period_months_ago / 12)
    # months from the middle of each official data period to the index anchor (Cotality month-end)
    anchor = MARKET.get('indexMonth') or '31 August 2026'
    am = re.search(r'(\w+) (\d{4})$', anchor)
    ay, amon = int(am.group(2)), MONTHS.index(am.group(1)[:3]) + 1
    lag = {k: max(0, months_between(PERIODS[pk][1], PERIODS[pk][2], ay, amon)) for k, pk in (('VIC', 'VIC'), ('SA', 'SA'), ('NSW', 'NSW_sales'))}
    log('periods', PERIODS, 'lag months', lag)

    # New-dwelling pipeline: council approvals last financial year as % of the council's dwelling stock
    appr = {}
    ap_path = os.path.join(OUT, 'approvals.json')
    if os.path.exists(ap_path):
        appr = json.load(open(ap_path)).get('lga', {})
    stock = df.groupby('lgc')['dwellings'].sum().to_dict()
    def supply(lgc):
        a = appr.get(str(lgc))
        if not a or not a.get('fy') or not stock.get(lgc):
            return None
        return round(a['fy']['total'] / stock[lgc] * 100, 2)

    out = []
    Xall = df[feats]
    est = {}
    for idx, r in df.iterrows():
        f = Xall.loc[idx]
        if not f.isna().any():
            est[idx] = float(np.dot(beta, np.r_[1, f.values]))
        elif not pd.isna(r['mort_rel']) or not pd.isna(r['hhinc_rel']):
            # thin data: fall back to the income/mortgage terms only
            parts = [(r['mort_rel'], 0.6), (r['hhinc_rel'], 0.4)]
            parts = [(v, w) for v, w in parts if not pd.isna(v)]
            est[idx] = sum(v * w for v, w in parts) / sum(w for _, w in parts)
    # The anchor IS the region's median, so re-centre each region's predictions on it
    # (dwelling-weighted median ratio = 1). Stops remote/coastal effects double counting.
    est_u = {}
    for idx, r in df.iterrows():
        f = Xall.loc[idx]
        if not f.isna().any():
            est_u[idx] = float(np.dot(beta_u, np.r_[1, f.values]))
    df['est_u'] = pd.Series(est_u)
    centre_u = {rg: wmed(g['est_u'], g['dwellings'].clip(lower=1)) for rg, g in df.groupby('region')}
    df['est_rel'] = pd.Series(est)
    centre = {rg: wmed(g['est_rel'], g['dwellings'].clip(lower=1)) for rg, g in df.groupby('region')}
    for idx, r in df.iterrows():
        rg = r['region']; M = regions[rg]
        est_rel = est.get(idx)
        if est_rel is not None:
            est_rel = min(1.6, max(-1.4, est_rel - (centre.get(rg) or 0)))
        house_model = anchor_house(rg) * math.exp(est_rel) if est_rel is not None else None
        unit_ratio = anchor_unit(rg) / anchor_house(rg)
        o = r['official'] or {}
        house = unit = None
        src_house = src_unit = 'model'
        if o.get('house'):
            house = o['house']['median'] * roll(rg, lag[o['house']['source']])
            src_house = o['house']['source'] + (' postcode' if o['house'].get('postcode') else '')
        elif house_model:
            house = house_model
        if o.get('unit'):
            unit = o['unit']['median'] * roll(rg, lag[o['unit']['source']])
            src_unit = o['unit']['source'] + (' postcode' if o['unit'].get('postcode') else '')
        elif est_u.get(idx) is not None:
            unit = anchor_unit(rg) * math.exp(min(1.2, max(-1.2, est_u[idx] - (centre_u.get(rg) or 0))))
        elif house:
            # unit prices move ~0.45x as much as house prices across suburbs (fitted on VIC + NSW official medians)
            unit = anchor_unit(rg) * math.exp(UNIT_ELASTICITY * math.log(house / anchor_house(rg)))
        # --- rents: official bonds (NSW) else Census 2021 rent scaled to today's regional rent level
        rent_region_all = M.get('rentAll') or (M['yield'] / 100 * M['medianDwelling'] / 52)
        rent_house_ratio = (M.get('rentHouse') / M['rentAll']) if M.get('rentHouse') and M.get('rentAll') else 1.08
        rent_unit_ratio = (M.get('rentUnit') / M['rentAll']) if M.get('rentUnit') and M.get('rentAll') else 0.82
        rent_all = None; src_rent = 'model'
        if o.get('rent') and o['rent'].get('all'):
            rent_all = o['rent']['all']; src_rent = 'NSW postcode'
        elif r['rent21'] and r['rent21'] > 0 and reg[rg]['rent21']:
            ratio = min(2.0, max(0.5, r['rent21'] / reg[rg]['rent21']))
            rent_all = rent_region_all * ratio ** 0.85
        rent_house = (o.get('rent') or {}).get('house') or (rent_all * rent_house_ratio if rent_all else None)
        rent_unit = (o.get('rent') or {}).get('unit') or (rent_all * rent_unit_ratio if rent_all else None)
        # --- growth
        g1 = None; g1src = 'region'
        if o.get('house') and o['house'].get('annualPct') is not None:
            g1 = o['house']['annualPct']; g1src = o['house']['source']
        elif o.get('house') and o['house'].get('medianYearAgo'):
            g1 = (o['house']['median'] / o['house']['medianYearAgo'] - 1) * 100; g1src = o['house']['source']
        if g1 is None or abs(g1) > 60:
            g1 = M['annualPct']; g1src = 'region'
        conf = 'high' if src_house != 'model' and 'postcode' not in src_house else ('medium' if src_house != 'model' else ('low' if r['pop'] < 1500 else 'medium-low'))
        yld = (rent_house * 52 / house * 100) if house and rent_house else None
        out.append({
            'id': r['code'][3:], 'n': r['name'], 's': r['state'], 'pc': r['poa'], 'rg': rg, 'lga': r['lga'], 'lgc': r['lgc'], 'sa2': r['sa2'], 'ra': r['ra'],
            'lat': r['lat'], 'lng': r['lng'], 'pop': int(r['pop']),
            'h': rnd(house, -3), 'u': rnd(unit, -3), 'hs': src_house, 'us': src_unit,
            'rh': rnd(rent_house, 0), 'ru': rnd(rent_unit, 0), 'rs': src_rent,
            'y': rnd(yld, 2), 'g1': rnd(g1, 1), 'g1s': g1src, 'cagr': rnd(o.get('cagr'), 1), 'cagrY': o.get('cagrYears'),
            'pg5': rnd(r.get('popGrowth5'), 1), 'ig5': rnd(r.get('incGrowth5'), 1), 'rg5': rnd(r.get('rentGrowth5'), 1),
            'inc': rnd(r['hhinc'], 0), 'age': r['age'], 'une': rnd(r['unemp'], 1), 'rent%': rnd(pct(r['renters']), 1),
            'own%': rnd(pct(r['ownOutright']), 1), 'soc%': rnd(pct(r['socialHousing']), 1),
            'hou%': rnd(pct(r['houses']), 1), 'fla%': rnd(pct(r['flats']), 1), 'dw': int(r['dwellings'] or 0),
            'sup': supply(r['lgc']),
            'conf': conf, 'pt': 'u' if (r['flats'] or 0) >= 0.5 else 'h',
            'hist': o.get('history'),
            'off': {k: v for k, v in (o or {}).items() if k in ('house', 'unit', 'rent')} or None,
        })
    scored = score(out)
    meta = {
        'built': pd.Timestamp.now('UTC').isoformat(),
        'count': len(scored),
        'model': {'features': feats, 'coef': [round(float(b), 4) for b in beta], 'r2': round(float(r2), 3), 'rmseLog': round(rmse, 3),
                  'unitCoef': [round(float(b), 4) for b in beta_u], 'unitR2': round(float(r2u), 3), 'unitTrainN': int(len(tru)),
                  'trainN': int(len(train)), 'holdout': holdout,
                  'trainedOn': f"Official suburb medians: VIC Valuer-General ({PERIODS['VIC'][0]}), SA Land Services ({PERIODS['SA'][0]}), NSW DCJ by postcode ({PERIODS['NSW_sales'][0]})"},
        'sources': [
            {'title': 'ABS Census 2021 General Community Profile, Suburbs and Localities', 'url': 'https://www.abs.gov.au/census/find-census-data/datapacks'},
            {'title': 'ABS ASGS Edition 3 digital boundaries (SAL, POA, GCCSA, LGA 2025, Remoteness)', 'url': 'https://www.abs.gov.au/statistics/standards/australian-statistical-geography-standard-asgs-edition-3'},
            {'title': 'Victorian Property Sales Report, Valuer-General Victoria', 'url': 'https://discover.data.vic.gov.au/dataset/victorian-property-sales-report-median-house-by-suburb'},
            {'title': 'Metropolitan Median House Sales, Land Services SA', 'url': 'https://data.sa.gov.au/data/dataset/metro-median-house-sales'},
            {'title': 'Rent and Sales Report, NSW Department of Communities and Justice', 'url': 'https://dcj.nsw.gov.au/about-us/families-and-communities-statistics/housing-rent-and-sales/rent-and-sales-report.html'},
            {'title': 'Cotality Home Value Index (regional anchors)', 'url': 'https://www.cotality.com/au/our-data/indices/home-value-index'},
            {'title': 'SQM Research asking rents and vacancy rates', 'url': 'https://sqmresearch.com.au/'},
        ],
    }
    os.makedirs(OUT, exist_ok=True)
    # Index: what the explorer, map and ranker need for every suburb (loaded once).
    index_cols = ['id', 'n', 's', 'pc', 'rg', 'lga', 'lgc', 'sup', 'lat', 'lng', 'pop', 'h', 'u', 'rh', 'ru', 'y', 'g1', 'g1s', 'pt', 'conf', 'hs', 'us', 'pti', 'pg5']
    comp = ['cash', 'momentum', 'growth', 'demand', 'afford', 'stability']
    rows = [[s_[c] for c in index_cols] + [s_['sc'][k] for k in comp] for s_ in scored]
    with open(os.path.join(OUT, 'suburbs.json'), 'w') as fh:
        json.dump({'meta': meta, 'cols': index_cols + ['sc_' + k for k in comp], 'rows': rows}, fh, separators=(',', ':'))
    # Detail: one file per state, fetched when a suburb page opens.
    by_state = defaultdict(dict)
    for s_ in scored:
        by_state[s_['s']][s_['id']] = {k: v for k, v in s_.items() if k not in index_cols and k != 'sc' and v is not None}
    for st, d in by_state.items():
        with open(os.path.join(OUT, f'suburbs-{st}.json'), 'w') as fh:
            json.dump(d, fh, separators=(',', ':'))
    log('wrote', len(scored), 'suburbs')


def pct(x):
    return None if x is None or (isinstance(x, float) and math.isnan(x)) else x * 100


def rnd(x, d):
    if x is None or (isinstance(x, float) and (math.isnan(x) or math.isinf(x))):
        return None
    v = round(float(x), d)
    return int(v) if d <= 0 else v


def score(rows):
    """Percentile components (0-100) that the site weights into the Keystone Score.
    Higher is always better for the investor."""
    import bisect
    def ranker(key, invert=False, filt=lambda r: True):
        vals = sorted(r[key] for r in rows if r[key] is not None and filt(r))
        def f(v):
            if v is None or not vals:
                return None
            p = bisect.bisect_left(vals, v) / max(1, len(vals) - 1) * 100
            return round(100 - p if invert else p)
        return f
    ry = ranker('y'); rg1 = ranker('g1'); rpg = ranker('pg5'); rig = ranker('ig5'); rrg = ranker('rg5')
    rune = ranker('une', invert=True); rsoc = ranker('soc%', invert=True)
    afford = []
    for r in rows:
        r['pti'] = round(r['h'] / (r['inc'] * 52), 1) if r['h'] and r['inc'] else None
    raff = ranker('pti', invert=True)
    for r in rows:
        from_market = MARKET['regions'][r['rg']]
        vac = from_market.get('vacancy')
        dom = from_market.get('dom')
        comps = {
            'cash': ry(r['y']),
            'momentum': rg1(r['g1']),
            'growth': avg([rpg(r['pg5']), rig(r['ig5']), rrg(r['rg5'])]),
            'demand': avg([vac_score(vac), dom_score(dom), rune(r['une'])]),
            'afford': raff(r['pti']),
            'stability': avg([rune(r['une']), rsoc(r['soc%']), size_score(r['pop'])]),
        }
        r['sc'] = comps
    return rows


def avg(xs):
    xs = [x for x in xs if x is not None]
    return round(sum(xs) / len(xs)) if xs else None


def vac_score(v):
    if v is None:
        return None
    return round(max(0, min(100, (3.0 - v) / 2.6 * 100)))  # 0.4% -> 100, 3% -> 0


def dom_score(d):
    if d is None:
        return None
    return round(max(0, min(100, (90 - d) / 70 * 100)))  # 20 days -> 100, 90 -> 0


def size_score(p):
    return round(max(0, min(100, (math.log10(max(p, 50)) - 2) / 2.5 * 100)))  # 100 people -> 0, 30k+ -> 100


if __name__ == '__main__':
    main()
