import { useState, useRef, useEffect } from 'react';

export default function App() {
  const [naam, setNaam] = useState('');
  const [bedrijf, setBedrijf] = useState('');
  const [context, setContext] = useState('');
  const [model, setModel] = useState('claude-opus-4-5');
  const [bezig, setBezig] = useState(false);
  const [resultaat, setResultaat] = useState('');
  const [foutmelding, setFoutmelding] = useState('');
  const [duur, setDuur] = useState(null);
  const [secondenLopend, setSecondenLopend] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (bezig) {
      const start = Date.now();
      intervalRef.current = setInterval(() => {
        setSecondenLopend(((Date.now() - start) / 1000).toFixed(1));
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [bezig]);

  const research = async () => {
    if (!naam.trim() || !bedrijf.trim()) {
      setFoutmelding('Naam én bedrijf zijn nodig.');
      return;
    }
    setFoutmelding('');
    setResultaat('');
    setDuur(null);
    setSecondenLopend(0);
    setBezig(true);
    const startTijd = Date.now();

    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          naam: naam.trim(),
          bedrijf: bedrijf.trim(),
          context: context.trim(),
          model,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Serverfout (${response.status})`);
      }

      if (!data.rapport) {
        throw new Error('Geen rapport ontvangen.');
      }

      setResultaat(data.rapport);
      setDuur(((Date.now() - startTijd) / 1000).toFixed(1));
    } catch (err) {
      setFoutmelding(err.message || 'Onbekende fout.');
    } finally {
      setBezig(false);
    }
  };

  const wis = () => {
    setNaam('');
    setBedrijf('');
    setContext('');
    setResultaat('');
    setFoutmelding('');
    setDuur(null);
    setSecondenLopend(0);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      research();
    }
  };

  const renderInline = (tekst) => {
    const delen = tekst.split(/(\*\*[^*]+\*\*)/g);
    return delen.map((deel, i) => {
      if (/^\*\*[^*]+\*\*$/.test(deel)) {
        return <strong key={i}>{deel.replace(/\*\*/g, '')}</strong>;
      }
      return <span key={i}>{deel}</span>;
    });
  };

  const isBulletList = (tekst) => {
    const regels = tekst.split('\n').map((r) => r.trim()).filter(Boolean);
    if (regels.length === 0) return false;
    return regels.every((r) => /^[-•]\s+\S/.test(r));
  };

  const isNumberedList = (tekst) => {
    const regels = tekst.split('\n');
    const startRegels = regels.filter((r) => /^\s*\d+\.\s+/.test(r));
    return startRegels.length >= 2;
  };

  const renderBullets = (tekst, key) => {
    const items = tekst
      .split('\n')
      .map((r) => r.trim())
      .filter((r) => /^[-•]\s+/.test(r))
      .map((r) => r.replace(/^[-•]\s+/, ''));
    return (
      <ul key={key} className="daan-lijst">
        {items.map((it, j) => (
          <li key={j}>{renderInline(it)}</li>
        ))}
      </ul>
    );
  };

  const renderNumbered = (tekst, key) => {
    const regels = tekst.split('\n');
    const items = [];
    let huidig = '';

    for (const regel of regels) {
      if (/^\s*\d+\.\s+/.test(regel)) {
        if (huidig.trim()) items.push(huidig.trim());
        huidig = regel.replace(/^\s*\d+\.\s+/, '');
      } else {
        huidig += '\n' + regel;
      }
    }
    if (huidig.trim()) items.push(huidig.trim());

    return (
      <ol key={key} className="daan-genummerd">
        {items.map((it, j) => (
          <li key={j}>
            <div className="daan-haakje">{renderInline(it)}</div>
          </li>
        ))}
      </ol>
    );
  };

  const renderOutput = (tekst) => {
    const ruweBlokken = tekst.split(/\n{2,}/);
    const elementen = [];
    let teller = 0;

    for (const ruw of ruweBlokken) {
      const trim = ruw.trim();
      if (!trim) continue;

      if (/^\*\*[^*]+\*\*$/.test(trim)) {
        elementen.push(
          <h3 key={teller++} className="daan-h3">
            {trim.replace(/\*\*/g, '')}
          </h3>
        );
        continue;
      }

      const headingMatch = trim.match(/^\*\*([^*]+)\*\*\s*\n([\s\S]+)$/);
      if (headingMatch) {
        const [, heading, rest] = headingMatch;
        elementen.push(
          <h3 key={teller++} className="daan-h3">
            {heading}
          </h3>
        );
        const restBlok = rest.trim();
        if (isBulletList(restBlok)) {
          elementen.push(renderBullets(restBlok, teller++));
        } else if (isNumberedList(restBlok)) {
          elementen.push(renderNumbered(restBlok, teller++));
        } else {
          elementen.push(
            <p key={teller++} className="daan-p">
              {renderInline(restBlok)}
            </p>
          );
        }
        continue;
      }

      if (isBulletList(trim)) {
        elementen.push(renderBullets(trim, teller++));
        continue;
      }

      if (isNumberedList(trim)) {
        elementen.push(renderNumbered(trim, teller++));
        continue;
      }

      elementen.push(
        <p key={teller++} className="daan-p">
          {renderInline(trim)}
        </p>
      );
    }

    return elementen;
  };

  return (
    <div className="daan-root">
      <div className="daan-wrap">
        <div className="daan-header">
          <h1 className="daan-titel">
            Daan<span className="accent">.</span>
          </h1>
          <span className="daan-sub">research voor jeremy · outvie</span>
        </div>

        <div className="daan-form">
          <div className="daan-row">
            <div className="daan-veld">
              <label className="daan-label">Naam</label>
              <input
                className="daan-input"
                type="text"
                value={naam}
                onChange={(e) => setNaam(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Sophie van der Meer"
                disabled={bezig}
              />
            </div>
            <div className="daan-veld">
              <label className="daan-label">Bedrijf</label>
              <input
                className="daan-input"
                type="text"
                value={bedrijf}
                onChange={(e) => setBedrijf(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Achmea"
                disabled={bezig}
              />
            </div>
          </div>
          <div className="daan-veld">
            <label className="daan-label">Context (optioneel)</label>
            <textarea
              className="daan-textarea"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Bijv: gisteren AI Governance whitepaper gedownload"
              disabled={bezig}
            />
          </div>

          <div className="daan-controls">
            <div className="daan-modelkeuze">
              <label>Model</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                disabled={bezig}
              >
                <option value="claude-opus-4-5">Opus 4.5 — scherper</option>
                <option value="claude-sonnet-4-5">Sonnet 4.5 — sneller</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {(resultaat || foutmelding) && !bezig && (
                <button className="daan-knop-secundair" onClick={wis}>
                  Wis
                </button>
              )}
              <button className="daan-knop" onClick={research} disabled={bezig}>
                {bezig ? 'Bezig…' : 'Research starten'}
              </button>
            </div>
          </div>
        </div>

        {bezig && (
          <div className="daan-status">
            <span className="daan-puls" />
            <span>Daan zoekt — {secondenLopend}s</span>
          </div>
        )}

        {foutmelding && !bezig && <div className="daan-fout">{foutmelding}</div>}

        {resultaat && !bezig && (
          <div className="daan-rapport">
            <div className="daan-rapport-header">
              <span>Rapport</span>
              {duur && <span className="daan-rapport-tijd">{duur}s</span>}
            </div>
            <div>{renderOutput(resultaat)}</div>
          </div>
        )}

        <div className="daan-voet">PHNK Media &amp; Design — voor Outvie</div>
      </div>
    </div>
  );
}
