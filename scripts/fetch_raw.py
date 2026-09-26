"""
Download the raw inputs for scripts/build_suburbs.py, always picking the latest published files.
Big static files (Census, boundaries) are cached; sales/rent files are re-checked every run.

Run: python3 scripts/fetch_raw.py   (writes to data/raw/)
"""
import json, os, re, sys, urllib.request, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.environ.get('KEYSTONE_RAW', os.path.join(ROOT, 'data', 'raw'))
UA = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126 KeystoneBot'}
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


def save(name, data):
    p = os.path.join(RAW, name)
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

    print('SA: last four quarters of metro median house sales')
    res = ckan('https://data.sa.gov.au/data', 'metro-median-house-sales')['resources']
    quarterly = []
    for r in res:
        m = re.search(r'Q(\d) (\d{4})', r['name'])
        if m and r['url'].endswith(('.xlsx', '.xls')):
            quarterly.append((int(m.group(2)), int(m.group(1)), r['url']))
    for f in os.listdir(RAW):
        if f.startswith('sa_') and f.endswith('.xlsx'):
            os.remove(os.path.join(RAW, f))
    for y, q, url in sorted(quarterly)[-4:]:
        save(f'sa_{y}q{q}.xlsx', get(url))

    print('VIC: latest quarterly house and unit medians + house time series')
    for pkg, out in [('victorian-property-sales-report-median-house-by-suburb', 'vic_house_q4_2025.xls'),
                     ('victorian-property-sales-report-median-unit-by-suburb', 'vic_unit_q4_2025.xls'),
                     ('victorian-property-sales-report-median-house-by-suburb-time-series', 'vic_house_ts_wb.xlsx')]:
        res = ckan('https://discover.data.vic.gov.au', pkg)['resources']
        url = res[-1]['url'].split('/https://')[-1]
        url = url if url.startswith('http') else 'https://' + url
        # file names are kept stable so the build script doesn't change each quarter
        save(out, get_with_archive(url))

    print('NSW: DCJ rent and sales tables (by postcode)')
    page = get('https://dcj.nsw.gov.au/about-us/families-and-communities-statistics/housing-rent-and-sales/rent-and-sales-report.html').decode('utf-8', 'ignore')
    for kind in ('rent', 'sales'):
        m = re.search(rf'href="([^"]*{kind}-tables-[^"]+\.xlsx)"', page)
        if not m:
            raise RuntimeError(f'NSW {kind} table link not found')
        url = m.group(1) if m.group(1).startswith('http') else 'https://dcj.nsw.gov.au' + m.group(1)
        save(f'nsw_{kind}.xlsx', get(url))
    print('done')


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print('fetch_raw failed:', e)
        sys.exit(1)
