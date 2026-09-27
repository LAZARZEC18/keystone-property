"""
ABS Building Approvals: the new-building pipeline.

Downloads the latest "Building Approvals, Australia" release and writes site/data/approvals.json:
  * monthly dwelling approvals by state (houses vs other dwellings, seasonally adjusted and trend) since 2005
  * approvals by council (LGA) and by SA2 for the last full financial year and the current year to date
Only re-downloads when the ABS publishes a new month (tracked in data/history/approvals-release.txt).

Run: python3 scripts/abs_approvals.py [--force]
"""
import io, json, os, re, sys, urllib.request
from datetime import datetime, timezone

import pandas as pd

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'site', 'data', 'approvals.json')
MARK = os.path.join(ROOT, 'data', 'history', 'approvals-release.txt')
BASE = 'https://www.abs.gov.au'
LATEST = BASE + '/statistics/industry/building-and-construction/building-approvals-australia/latest-release'
UA = {'User-Agent': 'Mozilla/5.0 (KeyzingBot; +https://github.com/LAZARZEC18/keystone-property)'}
STATE_TABLE = {'NSW': '8731001', 'VIC': '8731002', 'QLD': '8731003', 'SA': '8731004', 'WA': '8731005', 'AUS': '8731006'}
STATE_NAMES = {'New South Wales': 'NSW', 'Victoria': 'VIC', 'Queensland': 'QLD', 'South Australia': 'SA', 'Western Australia': 'WA',
               'Tasmania': 'TAS', 'Northern Territory': 'NT', 'Australian Capital Territory': 'ACT', 'Australia': 'AUS'}
ABBR = {'NSW': 'NSW', 'Vic': 'VIC', 'VIC': 'VIC', 'QLD': 'QLD', 'Qld': 'QLD', 'SA': 'SA', 'WA': 'WA', 'Tas': 'TAS', 'TAS': 'TAS', 'NT': 'NT', 'ACT': 'ACT'}


def get(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def series_table(content):
    """ABS time-series workbook -> {series title|type: [(YYYY-MM, value)]}"""
    df = pd.read_excel(io.BytesIO(content), sheet_name='Data1', header=None)
    out = {}
    for j in range(1, df.shape[1]):
        title = str(df.iloc[0, j]).strip()
        kind = str(df.iloc[2, j]).strip()
        vals = []
        for i in range(10, df.shape[0]):
            d, v = df.iloc[i, 0], df.iloc[i, j]
            if pd.isna(d) or pd.isna(v):
                continue
            vals.append((pd.Timestamp(d).strftime('%Y-%m'), float(v)))
        out[f'{title}|{kind}'] = vals
    return out


def pick(tab, building, kind):
    for k, v in tab.items():
        if building in k and 'Total Sectors' in k and k.endswith('|' + kind):
            return v
    return []


def cube(content):
    """SA2 / LGA data cube -> (title, rows[{code, name, houses, other, total, value}])"""
    xl = pd.ExcelFile(io.BytesIO(content))
    sheet = [s for s in xl.sheet_names if s.lower().startswith('table')][0]
    df = pd.read_excel(xl, sheet_name=sheet, header=None)
    title = str(df.iloc[3, 0])
    rows = []
    for i in range(6, df.shape[0]):
        code, name = df.iloc[i, 0], df.iloc[i, 1]
        if pd.isna(code) or pd.isna(name) or not re.fullmatch(r'[0-9A-Z]+', str(code).strip()):
            continue
        num = lambda j: None if pd.isna(df.iloc[i, j]) else float(df.iloc[i, j])
        rows.append({'code': str(code).strip(), 'name': str(name).strip(), 'houses': num(2), 'other': num(3), 'total': num(4), 'value': num(8)})
    return title, rows


def main(force=False):
    page = get(LATEST).decode('utf-8', 'ignore')
    m = re.search(r'building-approvals-australia/([a-z]{3}-\d{4})/8731006\.xlsx', page)
    if not m:
        raise SystemExit('Could not find the latest release')
    rel = m.group(1)
    if not force and os.path.exists(MARK) and open(MARK).read().strip() == rel and os.path.exists(OUT):
        print('approvals: already have', rel)
        return
    base = f'{BASE}/statistics/industry/building-and-construction/building-approvals-australia/{rel}/'
    states = {}
    for st, t in STATE_TABLE.items():
        tab = series_table(get(base + t + '.xlsx'))
        h, o, tot = (pick(tab, b, 'Seasonally Adjusted') for b in ('Houses', 'Dwellings excluding houses', 'Total (Type of Building)'))
        tr = pick(tab, 'Total (Type of Building)', 'Trend')
        keep = lambda s: [x for x in s if x[0] >= '2005-01']
        states[st] = {'houses': keep(h), 'other': keep(o), 'total': keep(tot), 'trend': keep(tr)}
    # TAS, NT, ACT only appear in Table 07 (totals)
    t7 = series_table(get(base + '8731007.xlsx'))
    for k, v in t7.items():
        title, kind = k.split('|')
        for full, ab in STATE_NAMES.items():
            if ab in ('TAS', 'NT', 'ACT') and full in title and 'Total' in title:
                key = {'Seasonally Adjusted': 'total', 'Trend': 'trend'}.get(kind)
                if key:
                    states.setdefault(ab, {'houses': [], 'other': []})[key] = [x for x in v if x[0] >= '2005-01']
    for ab in ('TAS', 'NT', 'ACT'):
        if ab in states and not states[ab].get('total'):
            states[ab]['total'] = states[ab].get('trend', [])  # no seasonally adjusted series published
    # Data cubes: SA2 and LGA, full financial year and year to date, for every state
    lga, sa2 = {}, {}
    links = sorted(set(re.findall(r'(87310do0\d\d_\d{6})\.xlsx', page)))
    for name in links:
        if name.endswith('do001_' + name[-6:]):
            continue
        try:
            title, rows = cube(get(base + name + '.xlsx'))
        except Exception as e:  # noqa
            print('skip', name, e)
            continue
        mt = re.search(r'Table 1\.\s*([A-Za-z]+),\s*(SA2|LGA) excel data cube,?\s*(\d{4}-\d{4})\s*(FYTD)?', title, re.I)
        if not mt:
            print('unrecognised cube', name, title)
            continue
        st = ABBR.get(mt.group(1), mt.group(1).upper())
        level, fy, ytd = mt.group(2).upper(), mt.group(3), bool(mt.group(4))
        key = 'ytd' if ytd else 'fy'
        target = lga if level == 'LGA' else sa2
        for r in rows:
            if level == 'LGA' and not re.fullmatch(r'\d{5}', r['code']):
                continue
            if level == 'SA2' and not re.fullmatch(r'\d{9}', r['code']):
                continue
            rec = target.setdefault(r['code'], {'name': r['name'], 's': st})
            rec[key] = {'period': fy + (' to date' if ytd else ''), 'houses': r['houses'], 'other': r['other'], 'total': r['total'], 'value': r['value']}
        print('cube', name, st, level, fy, 'FYTD' if ytd else '', len(rows))
    out = {
        'updated': datetime.now(timezone.utc).isoformat(),
        'release': rel,
        'latestMonth': states['AUS']['total'][-1][0] if states['AUS']['total'] else None,
        'source': 'ABS Building Approvals, Australia',
        'sourceUrl': LATEST,
        'states': states,
        'lga': lga,
        'sa2': sa2,
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w') as fh:
        json.dump(out, fh, separators=(',', ':'))
    os.makedirs(os.path.dirname(MARK), exist_ok=True)
    open(MARK, 'w').write(rel)
    print('approvals:', rel, 'LGAs', len(lga), 'SA2s', len(sa2))


if __name__ == '__main__':
    main(force='--force' in sys.argv)
