import csv, math, json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT / "analysis"
OUT.mkdir(exist_ok=True)
rows=list(csv.DictReader((ROOT/'data/financials.csv').open()))
for r in rows:
    for k in r:
        if k not in ['company','ticker','currency','unit','period_end']:
            r[k]=float(r[k]) if r[k] else None
metrics={'operating_margin':('operating_income','revenue'),'net_margin':('net_income','revenue'),'roa':('net_income','total_assets'),'roe':('net_income','equity'),'ocf_to_assets':('operating_cash_flow','total_assets'),'current_ratio':('current_assets','current_liabilities'),'goodwill_to_assets':('goodwill','total_assets')}
for r in rows:
    for m,(n,d) in metrics.items():
        r[m]=r[n]/r[d] if r[n] is not None and r[d] else None
    r['operating_margin_ex_impairment']=(r['operating_income']+(r['goodwill_impairment'] or 0))/r['revenue'] if r['operating_income'] is not None else None
def mean(vals):
    v=[x for x in vals if x is not None]
    return sum(v)/len(v) if v else None
def calc(t,pre,post):
    a=[r for r in rows if r['ticker']==t and r['fiscal_year'] in pre]
    b=[r for r in rows if r['ticker']==t and r['fiscal_year'] in post]
    assert len(a)==3 and len(b)==3
    result={m:{'pre':mean([r[m] for r in a]) if all(r[m] is not None for r in a) else None,'post':mean([r[m] for r in b]) if all(r[m] is not None for r in b) else None} for m in list(metrics)+['operating_margin_ex_impairment']}
    gap=mean([r['fiscal_year'] for r in b])-mean([r['fiscal_year'] for r in a])
    result['revenue_cagr']={'pre':mean([r['revenue'] for r in a]),'post':mean([r['revenue'] for r in b])}
    for m,v in result.items():
        v['change']=(v['post']/v['pre'])**(1/gap)-1 if m=='revenue_cagr' else v['post']-v['pre'] if v['pre'] is not None and v['post'] is not None else None
    return result
base={d['ticker']:calc(d['ticker'],range(int(d['pre_years'][:4]),int(d['pre_years'][-4:])+1),range(int(d['post_years'][:4]),int(d['post_years'][-4:])+1)) for d in csv.DictReader((ROOT/'data/deals.csv').open())}
checks=0
for r in csv.DictReader((ROOT/'data/pre_post.csv').open()):
    for k in ['pre','post','change']:
        actual=base[r['ticker']][r['metric']][k]
        assert (not r[k] and actual is None) or (r[k] and abs(float(r[k])-actual)<=0.000051),(r,actual)
        checks+=1
sens={'EA_clean_pre':calc('EA',range(2018,2021),range(2023,2026)),'TTWO_earlier_post':calc('TTWO',range(2020,2023),range(2023,2026))}
(OUT/'verified-calculations.json').write_text(json.dumps({'snapshot':'8ba7b066ae3de88e58c29269ee6537f3d144604e','checks_passed':checks,'baseline':base,'sensitivity':sens},indent=2))
print(json.dumps({'checks_passed':checks,'baseline':base,'sensitivity':sens},indent=2))
