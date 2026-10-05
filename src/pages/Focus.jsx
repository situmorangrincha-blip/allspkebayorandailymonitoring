import { useMemo, useState } from 'react';
import { DEFAULT_FOCUS, catAgg, focusAgg, focusCatsOf, focusToText, fmt, pace, paceCls, parseFocusText, sizeRows, status } from '../lib/calc.js';
import { Bar, Panel, Seg, useSorted } from '../components/ui.jsx';
import SalFilter from '../components/SalFilter.jsx';

const SUBS = [
  { v: 'principal', label: 'Principal' },
  { v: 'kategori', label: 'Kategori' },
  { v: 'fokus', label: 'Kategori Fokus' },
  { v: 'ukuran', label: 'Ukuran Toko' },
];

export default function Focus({ D, data, time, mode, sub, setSub, sal, setSal, onSaveFocus }) {
  const stores = useMemo(() => (sal === 'ALL' ? data.stores : data.stores.filter((s) => s.sales === sal)), [data, sal]);
  return (
    <>
      <div className="tabs-row">
        <Seg value={sub} onChange={setSub} options={SUBS} />
        <SalFilter data={data} value={sal} onChange={setSal} />
      </div>
      {sub === 'principal' && <PrincipalView D={D} time={time} mode={mode} sal={sal} />}
      {sub === 'kategori' && <CategoryView data={data} stores={stores} time={time} />}
      {sub === 'fokus' && <FocusView data={data} stores={stores} time={time} sal={sal} onSaveFocus={onSaveFocus} />}
      {sub === 'ukuran' && <SizeView stores={stores} time={time} hasTgt={data.meta.storeTgt} />}
    </>
  );
}

function PrincipalView({ D, time, mode, sal }) {
  const ps = D.principals.filter((p) => D.total.pr[p].tgt > 0 || D.total.pr[p].act > 0);
  const list = sal === 'ALL' ? D.sales : D.sales.filter((s) => s.name === sal);
  return (
    <div className="grid g2">
      {ps.map((p) => {
        const tot = D.total.pr[p];
        return (
          <Panel key={p} title={`${p} VS ${mode === 'bti' ? 'BTI' : 'MILESTONE'}`} right={`${fmt.pct(tot.acv)} · ${fmt.jt(tot.act)}/${fmt.jt(tot.tgt)} jt`} flush>
            <div className="scroll">
              <table className="t">
                <thead><tr><th>Salesman</th><th>TGT</th><th>ACT</th><th>ACV</th><th>GAP</th></tr></thead>
                <tbody>
                  {[...list].sort((a, b) => b.pr[p].acv - a.pr[p].acv).map((s) => {
                    const x = s.pr[p];
                    return (
                      <tr key={s.name}>
                        <td className="nm">{s.name}</td>
                        <td>{fmt.jt(x.tgt)}</td>
                        <td>{fmt.jt(x.act)}</td>
                        <td className="bc"><div className="barlbl"><Bar value={x.acv} mark={time.tg} tg={time.tg} /><span className={status(x.acv, time.tg)}>{x.tgt ? fmt.pct(x.acv) : '-'}</span></div></td>
                        <td className={x.gap < 0 ? 'neg' : ''}>{fmt.jt(x.gap)}</td>
                      </tr>
                    );
                  })}
                  {sal === 'ALL' && (
                    <tr className="tot"><td>TOTAL</td><td>{fmt.jt(tot.tgt)}</td><td>{fmt.jt(tot.act)}</td><td>{fmt.pct(tot.acv)}</td><td className={tot.gap < 0 ? 'neg' : ''}>{fmt.jt(tot.gap)}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        );
      })}
    </div>
  );
}

function CategoryView({ data, stores, time }) {
  const agg = useMemo(() => catAgg(data, stores).filter((r) => r.cur || r.lm || r.l3m), [data, stores]);
  const total = agg.reduce((a, r) => a + r.cur, 0);
  const brands = useMemo(() => {
    const m = new Map();
    for (const r of agg) m.set(r.b, (m.get(r.b) || 0) + r.cur);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [agg]);
  const { rows, th } = useSorted(agg, 'cur', -1);
  const n = stores.length;
  if (!data.subs.length) return <Panel title="KATEGORI"><div className="empty">Sheet OLAP FOCUS CATEGORY belum terbaca di data ini.</div></Panel>;
  return (
    <div className="grid">
      <Panel title="SHARE BRAND BULAN INI" right={`${fmt.jt(total)} jt · ${n} toko`}>
        <div className="mini" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
          {brands.map(([b, v]) => (
            <div className="it" key={b}>
              <div className="h"><span>{b}</span><span>{fmt.pct(total ? v / total : 0, 0)}</span></div>
              <Bar value={total ? v / total : 0} color="bg-mp" />
              <div className="sub">{fmt.jt(v)} jt</div>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="SUB BRAND (KATEGORI) PER PERIODE" right="jt · L3M = rata-rata/bulan" flush>
        <div className="scroll">
          <table className="t">
            <thead>
              <tr>
                {th('n', 'Kategori', 'l')}
                {th('p', 'Prin.', 'l')}
                {th('cur', 'OKT')}
                {th('lm', 'SEP')}
                {th('l3m', 'L3M')}
                {th((r) => pace(r.cur, r.lm, time.tg) ?? -1, '% SEP')}
                {th((r) => pace(r.cur, r.l3m, time.tg) ?? -1, '% L3M')}
                {th('buyers', 'Toko beli')}
                {th((r) => (total ? r.cur / total : 0), 'Share')}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const a = pace(r.cur, r.lm, time.tg);
                const b = pace(r.cur, r.l3m, time.tg);
                return (
                  <tr key={r.i}>
                    <td className="nm">{r.n}</td>
                    <td className="l mut">{r.p}</td>
                    <td>{fmt.jt(r.cur, 2)}</td>
                    <td>{fmt.jt(r.lm, 2)}</td>
                    <td>{fmt.jt(r.l3m, 2)}</td>
                    <td className={paceCls(a)}>{fmt.pace(a)}</td>
                    <td className={paceCls(b)}>{fmt.pace(b)}</td>
                    <td>{r.buyers} <span className="mut">({fmt.pct(n ? r.buyers / n : 0, 0)})</span></td>
                    <td>{fmt.pct(total ? r.cur / total : 0)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="note">% SEP / % L3M = nilai bulan ini ÷ (pembanding × timegone). 100% = laju sama.</div>
      </Panel>
    </div>
  );
}

function FocusView({ data, stores, time, sal, onSaveFocus }) {
  const cats = focusCatsOf(data);
  const [edit, setEdit] = useState(false);
  const agg = useMemo(() => focusAgg(data, stores, cats, time.tg), [data, stores, cats, time.tg]);
  const bySales = useMemo(
    () => (sal === 'ALL' ? data.salesmen : [sal]).map((s) => ({ name: s, ...focusAgg(data, data.stores.filter((x) => x.sales === s), cats, time.tg) })),
    [data, cats, time.tg, sal]
  );
  const { rows, th } = useSorted(agg.rows, 'cur', -1);
  if (!data.subs.length) return <Panel title="KATEGORI FOKUS"><div className="empty">Sheet OLAP FOCUS CATEGORY belum terbaca di data ini.</div></Panel>;
  return (
    <div className="grid">
      <Panel
        title="KATEGORI FOKUS"
        right={<button className="btn sm" onClick={() => setEdit(true)}>Atur daftar</button>}
        flush
      >
        <div className="scroll">
          <table className="t">
            <thead>
              <tr>
                {th('name', 'Kategori', 'l')}
                {th('cur', 'OKT')}
                {th('lm', 'SEP')}
                {th('l3m', 'L3M')}
                {th((r) => r.vsLm ?? -1, '% SEP')}
                {th((r) => r.vsL3m ?? -1, '% L3M')}
                {th('buyers', 'Toko beli')}
                {th('penJks', 'Pen. JKS')}
                {th('penCa', 'Pen. CA')}
                {th('share', 'Share')}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.name}>
                  <td className="nm" title={r.subs.join(', ')}>
                    {r.name}
                    {!r.subs.length && <span className="tag r" style={{ marginLeft: 6 }}>TIDAK ADA DATA</span>}
                  </td>
                  <td>{fmt.jt(r.cur, 2)}</td>
                  <td>{fmt.jt(r.lm, 2)}</td>
                  <td>{fmt.jt(r.l3m, 2)}</td>
                  <td className={paceCls(r.vsLm)}>{fmt.pace(r.vsLm)}</td>
                  <td className={paceCls(r.vsL3m)}>{fmt.pace(r.vsL3m)}</td>
                  <td>{r.buyers}</td>
                  <td className="bc"><div className="barlbl"><Bar value={r.penJks} color="bg-mp" /><span>{fmt.pct(r.penJks, 0)}</span></div></td>
                  <td>{fmt.pct(r.penCa, 0)}</td>
                  <td>{fmt.pct(r.share, 0)}</td>
                </tr>
              ))}
              <tr className="tot">
                <td>TOTAL KATEGORI FOKUS</td>
                <td>{fmt.jt(agg.total, 2)}</td>
                <td>{fmt.jt(agg.rows.reduce((a, r) => a + r.lm, 0), 2)}</td>
                <td>{fmt.jt(agg.rows.reduce((a, r) => a + r.l3m, 0), 2)}</td>
                <td colSpan={6} className="mut" style={{ textAlign: 'left' }}>{agg.n} toko JKS · {agg.ca} toko CA</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="note">Pen. JKS = % toko JKS yang beli kategori ini. Pen. CA = % dari toko yang sudah CA. % SEP / % L3M = nilai bulan ini ÷ (pembanding × timegone); 100% berarti laju sama. Arahkan kursor ke nama kategori untuk melihat sub brand yang ikut dihitung.</div>
      </Panel>

      <Panel title="PER SALESMAN" right="ACT jt (jumlah toko beli)" flush>
        <div className="scroll">
          <table className="t">
            <thead>
              <tr>
                <th>Salesman</th>
                {cats.map((c) => <th key={c.name}>{c.name}</th>)}
              </tr>
            </thead>
            <tbody>
              {bySales.map((s) => (
                <tr key={s.name}>
                  <td className="nm">{s.name}</td>
                  {s.rows.map((r) => (
                    <td key={r.name}>{fmt.jt(r.cur, 2)} <span className="mut">({r.buyers})</span></td>
                  ))}
                </tr>
              ))}
              {sal === 'ALL' && (
                <tr className="tot">
                  <td>TOTAL</td>
                  {agg.rows.map((r) => <td key={r.name}>{fmt.jt(r.cur, 2)} <span className="mut">({r.buyers})</span></td>)}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
      {edit && (
        <FocusEditor
          cats={cats}
          onClose={() => setEdit(false)}
          onSave={(c) => { onSaveFocus(c); setEdit(false); }}
        />
      )}
    </div>
  );
}

function FocusEditor({ cats, onClose, onSave }) {
  const [txt, setTxt] = useState(focusToText(cats));
  const parsed = parseFocusText(txt);
  return (
    <div className="veil" onClick={onClose} data-sfx="back">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <Panel title="ATUR KATEGORI FOKUS" right={<button className="btn sm" data-sfx="back" onClick={onClose}>Tutup</button>}>
          <p style={{ marginTop: 0 }}>Satu kategori per baris. Nama sub brand yang mengandung kata kunci akan dihitung.</p>
          <textarea className="input" value={txt} onChange={(e) => setTxt(e.target.value)} spellCheck={false} />
          <div className="mut" style={{ fontSize: 13, margin: '8px 0' }}>
            Contoh: <code>Dilan</code> (kata kunci = nama), atau <code>Wafer = Wafer Stick, Wafer Cream</code> (beberapa kata kunci dipisah koma).
          </div>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <button className="btn" onClick={() => setTxt(focusToText(DEFAULT_FOCUS))}>Kembalikan standar</button>
            <div className="row">
              <button className="btn" data-sfx="back" onClick={onClose}>Batal</button>
              <button className="btn hp" disabled={!parsed.length} data-sfx="pick" onClick={() => onSave(parsed)}>Simpan ({parsed.length})</button>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function SizeView({ stores, time, hasTgt }) {
  const rows = useMemo(() => sizeRows(stores), [stores]);
  const { rows: r, th } = useSorted(rows, (x) => rows.indexOf(x), 1);
  const tot = useMemo(() => {
    const t = { n: 0, ca: 0, caProd: 0, act: 0, tgt: 0, lm: 0, l3m: 0 };
    for (const x of rows) for (const k of Object.keys(t)) t[k] += x[k];
    return t;
  }, [rows]);
  return (
    <Panel title="UKURAN TOKO (CC5)" right="SMALL · MEDIUM · BIG · SUPERBIG" flush>
      <div className="scroll">
        <table className="t">
          <thead>
            <tr>
              {th((x) => rows.indexOf(x), 'Ukuran', 'l')}
              {th('n', 'Toko')}
              {th('ca', 'CA')}
              {th('caPct', 'CA%')}
              {th('caProd', 'Prod')}
              {th('act', 'ACT')}
              {hasTgt && th('tgt', 'TGT toko')}
              {hasTgt && th('acv', 'ACV')}
              {th('lm', 'SEP')}
              {th((x) => pace(x.act, x.lm, time.tg) ?? -1, '% SEP')}
              {th('l3m', 'L3M')}
            </tr>
          </thead>
          <tbody>
            {r.map((x) => {
              const p = pace(x.act, x.lm, time.tg);
              return (
                <tr key={x.k}>
                  <td className="l"><span className="tag b">{x.k}</span></td>
                  <td>{x.n}</td>
                  <td>{x.ca}</td>
                  <td className="bc"><div className="barlbl"><Bar value={x.caPct} color="bg-mp" /><span>{fmt.pct(x.caPct, 0)}</span></div></td>
                  <td>{x.caProd}</td>
                  <td>{fmt.jt(x.act)}</td>
                  {hasTgt && <td>{fmt.jt(x.tgt)}</td>}
                  {hasTgt && <td className={x.tgt ? status(x.acv, time.tg) : 'mut'}>{x.tgt ? fmt.pct(x.acv, 0) : '-'}</td>}
                  <td>{fmt.jt(x.lm)}</td>
                  <td className={paceCls(p)}>{fmt.pace(p)}</td>
                  <td>{fmt.jt(x.l3m)}</td>
                </tr>
              );
            })}
            <tr className="tot">
              <td>TOTAL</td><td>{tot.n}</td><td>{tot.ca}</td><td>{fmt.pct(tot.n ? tot.ca / tot.n : 0, 0)}</td><td>{tot.caProd}</td>
              <td>{fmt.jt(tot.act)}</td>{hasTgt && <td>{fmt.jt(tot.tgt)}</td>}{hasTgt && <td>{fmt.pct(tot.tgt ? tot.act / tot.tgt : 0, 0)}</td>}<td>{fmt.jt(tot.lm)}</td>
              <td>{fmt.pace(pace(tot.act, tot.lm, time.tg))}</td><td>{fmt.jt(tot.l3m)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="note">Ukuran diambil dari kata SMALL / MEDIUM / BIG / SUPERBIG di kolom CC5 sheet JKS. % SEP = ACT ÷ (Sep × timegone).</div>
    </Panel>
  );
}
