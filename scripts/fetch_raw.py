"""
Download the raw inputs for scripts/build_suburbs.py, always picking the latest published files.
Big static files (Census, boundaries) are cached; sales/rent files are re-checked every run.

Run: python3 scripts/fetch_raw.py   (writes to data/raw/)
"""
import json, os, re, sys, urllib.request, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.environ.get('OWNAROO_RAW', os.path.join(ROOT, 'data', 'raw'))
OFFICIAL = os.path.join(ROOT, 'data', 'official')
UA = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126 OwnarooBot'}
ASGS = 'https://www.abs.gov.au/statistics/standards/australian-statistical-geography-standard-asgs/edition-3-july-2021-june-2026/access-and-downloads/digital-boundary-files/'
STATIC = {
    '2021_GCP_SAL_for_AUS_short-header.zip': ('https://www.abs.gov.au/census/find-census-data/datapacks/download/2021_GCP_SAL_for_AUS_short-header.zip', 'c21'),
    '2016_GCP_SSC_for_AUS_short-header.zip': ('https://www.abs.gov.au/census/find-census-data/datapacks/download/2016_GCP_SSC_for_AUS_short-header.zip', 'c16'),
    'SAL_2021_AUST_GDA2020_SHP.zip': (ASGS + 'SAL_2021_AUST_GDA2020_SHP.zip', 'b_SAL'),
    'POA_2021_AUST_GDA2020_SHP.zip': (ASGS + 'POA_2021_AUST_GDA2020_SHP.zip', 'b_POA'),
    'GCCSA_2021_AUST_SHP_GDA2020.zip': (ASGS + 'GCCSA_2021_AUST_SHP_GDA2020.zip', 'b_GCCSA'),
    'LGA_2025_AUST_GDA2020.zip': (ASGS + 'LGA_2025_AUST_GDA2020.zip', 'b_LGA_2025'),
    'RA_2021_AUST_GDA2020.zip': (ASGS + 'RA_2021_AUST_GDA2020.zip', 'b_RA'),
    'SA2_2021_AUST_SHP_GDA2020.zip': (ASGS + 'SA2_2021_AUST_SHP_GDA2020.zip', 'b_SA2'),
}


def get(url, timeout=300):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def save(name, data, folder=None):
    p = os.path.join(folder or RAW, name)
    with open(p, 'wb') as fh:
        fh.write(data)
    print(f'  {name}: {len(data) / 1e6:.1f} MB')
    return p


def ckan(base, pkg):
    return json.loads(get(f'{base}/api/3/action/package_show?id={pkg}'))['result']


def get_with_archive(url):
    """land.vic.gov.au blocks some cloud IPs; fall back to the Internet Archive copy."""
    for u in (url, f'https://web.archive.org/web/2026/{url}'):
        try:
            data = get(u)
            if data[:4] in (b'\xd0\xcf\x11\xe0', b'PK\x03\x04'):
                return data
        except Exception as e:  # noqa
            print('   ', u[:80], e)
    raise RuntimeError(f'could not download {url}')


def main():
    os.makedirs(RAW, exist_ok=True)
    print('static inputs')
    for name, (url, folder) in STATIC.items():
        dest = os.path.join(RAW, folder)
        if os.path.isdir(dest) and os.listdir(dest):
            continue
        p = save(name, get(url, 900))
        zipfile.ZipFile(p).extractall(dest)
        os.remove(p)

    # open-ocean coastline (Natural Earth, public domain) for 'near the beach' distances
    for ext in ('shp', 'shx', 'dbf'):
        dest = os.path.join(RAW, f'ne_10m_coastline.{ext}')
        if not os.path.exists(dest):
            save(f'ne_10m_coastline.{ext}', get(f'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/10m_physical/ne_10m_coastline.{ext}'))
    # ABS Regional Population: SA2 estimated resident population time series (latest release)
    try:
        page = get('https://www.abs.gov.au/statistics/people/population/regional-population/latest-release').decode('utf-8', 'ignore')
        m = re.search(r'href="([^"]*32180DS0003_2001-\d\d\.xlsx)"', page)
        if m:
            name = 'abs_regpop_ds3_' + os.path.basename(m.group(1))
            if not os.path.exists(os.path.join(RAW, name)):
                save(name, get('https://www.abs.gov.au' + m.group(1)))
    except Exception as e:  # keep going with Census population growth
        print('  ABS regional population unavailable:', e)

    os.makedirs(OFFICIAL, exist_ok=True)
    ok = 0

    def attempt(label, fn):
        nonlocal ok
        print(label)
        try:
            fn()
            ok += 1
        except Exception as e:  # keep the previous committed file
            print('  kept previous files:', e)

    def sa():
        res = ckan('https://data.sa.gov.au/data', 'metro-median-house-sales')['resources']
        quarterly = []
        for r in res:
            m = re.search(r'Q(\d) (\d{4})', r['name'])
            if m and r['url'].endswith(('.xlsx', '.xls')):
                quarterly.append((int(m.group(2)), int(m.group(1)), r['url']))
        files = [(f'sa_{y}q{q}.xlsx', get(url)) for y, q, url in sorted(quarterly)[-4:]]
        if len(files) < 4 or any(d[:2] != b'PK' for _, d in files):
            raise RuntimeError('SA files incomplete')
        for f in os.listdir(OFFICIAL):
            if f.startswith('sa_'):
                os.remove(os.path.join(OFFICIAL, f))
        for name, d in files:
            save(name, d, OFFICIAL)

    def vic():
        for pkg, out in [('victorian-property-sales-report-median-house-by-suburb', 'vic_house_q4_2025.xls'),
                         ('victorian-property-sales-report-median-unit-by-suburb', 'vic_unit_q4_2025.xls'),
                         ('victorian-property-sales-report-median-house-by-suburb-time-series', 'vic_house_ts_wb.xlsx')]:
            res = ckan('https://discover.data.vic.gov.au', pkg)['resources']
            url = res[-1]['url'].split('/https://')[-1]
            url = url if url.startswith('http') else 'https://' + url
            save(out, get_with_archive(url), OFFICIAL)  # stable file names across quarters

    def nsw():
        page = get('https://dcj.nsw.gov.au/about-us/families-and-communities-statistics/housing-rent-and-sales/rent-and-sales-report.html').decode('utf-8', 'ignore')
        for kind in ('rent', 'sales'):
            m = re.search(rf'href="([^"]*{kind}-tables-[^"]+\.xlsx)"', page)
            if not m:
                raise RuntimeError(f'NSW {kind} table link not found')
            url = m.group(1) if m.group(1).startswith('http') else 'https://dcj.nsw.gov.au' + m.group(1)
            d = get(url)
            if d[:2] != b'PK':
                raise RuntimeError(f'NSW {kind} not an xlsx')
            save(f'nsw_{kind}.xlsx', d, OFFICIAL)

    attempt('SA: last four quarters of metro median house sales', sa)
    attempt('VIC: latest quarterly house and unit medians + house time series', vic)
    attempt('NSW: DCJ rent and sales tables (by postcode)', nsw)
    print(f'official sources refreshed: {ok}/3')
    print('done')


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print('fetch_raw failed:', e)
        sys.exit(1)
