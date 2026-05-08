# Daan — deploy-instructies

Research-assistent voor Outvie. Deze README leidt je in volgorde door lokaal testen, deployen naar Vercel en het koppelen van het subdomein `daan.phnkmedia.com` via TransIP.

Reken op 30-45 minuten als alles meezit.

---

## Wat je nodig hebt voor je begint

- Node.js versie 18 of hoger geïnstalleerd
- Een Anthropic API-key (zie hieronder als je 'm nog niet hebt)
- Een GitHub-account
- Een Vercel-account (gratis, kan met je GitHub-account)
- Toegang tot TransIP voor het DNS-beheer van phnkmedia.com

### API-key aanmaken (overslaan als je 'm al hebt)

1. Ga naar https://console.anthropic.com
2. Account aanmaken / inloggen
3. **Settings → Billing → Add credit** — zet een tientje op de account. Demo-volume kost je hier maximaal een paar euro van.
4. **Settings → API Keys → Create Key** — geef hem een naam zoals "Daan Outvie demo"
5. Kopieer de key direct. Je ziet hem maar één keer. Begint met `sk-ant-api03-...`

---

## Stap 1 — Lokaal opzetten

```bash
# Pak de zip uit en ga naar de map
cd daan-deploy

# Dependencies installeren
npm install

# .env aanmaken voor je API-key
cp .env.example .env
```

Open `.env` in een editor en vervang de placeholder door je echte API-key:

```
ANTHROPIC_API_KEY=sk-ant-api03-jouw-echte-key
```

**Belangrijk:** `.env` staat in `.gitignore` — wordt nooit naar Git gepushed. Daar moet hij ook blijven staan.

---

## Stap 2 — Lokaal testen (optioneel maar aangeraden)

De UI kun je lokaal draaien:

```bash
npm run dev
```

Open `http://localhost:5173` in je browser. Je ziet Daan staan.

**Let op:** een research-query werkt **niet** lokaal met `npm run dev`, omdat de serverless-functie in `api/research.js` alleen op Vercel draait. Je kunt dat omzeilen met de Vercel CLI:

```bash
npm install -g vercel
vercel dev
```

Dan draait alles op `http://localhost:3000` — inclusief de API-functie. Eerste keer vraagt hij je in te loggen op Vercel.

Of je slaat dit over en test pas na de deploy. Dat is sneller maar je hebt dan geen lokale testmogelijkheid.

---

## Stap 3 — Naar GitHub pushen

```bash
# Git initialiseren
git init
git add .
git commit -m "Eerste versie Daan"

# Maak op github.com een nieuwe (private) repo aan, naam bijvoorbeeld 'daan'
# Vervang de URL hieronder met die van jouw repo
git remote add origin https://github.com/JOUW-USERNAME/daan.git
git branch -M main
git push -u origin main
```

Check daarna in GitHub of je `.env` **niet** in de repo staat. Als hij er wel in staat: stop, verwijder hem, en wijzig je API-key in de Anthropic Console (de oude is gecompromitteerd zodra hij in een Git-repo heeft gestaan).

---

## Stap 4 — Deployen naar Vercel

1. Ga naar https://vercel.com en log in (mag met GitHub).
2. Klik **Add New → Project**.
3. Importeer de `daan`-repo van GitHub.
4. Bij **Configure Project** zie je framework auto-detectie als "Vite". Goed.
5. Klap **Environment Variables** open en voeg toe:
   - Naam: `ANTHROPIC_API_KEY`
   - Waarde: jouw echte API-key (`sk-ant-api03-...`)
   - Available in: Production, Preview, Development (alle drie aan)
6. Klik **Deploy**.

Wacht 1-2 minuten. Je krijgt een URL zoals `daan-xyz.vercel.app`. Open hem en doe een testquery (bijvoorbeeld Georgette Schlick / Fremantle). Werkt? Goed. Werkt niet? Zie troubleshooting onderaan.

---

## Stap 5 — Subdomein koppelen via TransIP

### In Vercel

1. In je Vercel-dashboard: open je project.
2. **Settings → Domains**.
3. Voer in: `daan.phnkmedia.com`. Klik **Add**.
4. Vercel toont een instructie: voeg een CNAME-record toe met waarde `cname.vercel-dns.com`. **Laat dit tabblad open staan** — je gaat daar zo terug.

### In TransIP

1. Log in op https://www.transip.nl
2. Ga naar **Domeinnamen → phnkmedia.com**.
3. Klik op het tabblad **DNS**.
4. Klik **Toevoegen**.
5. Vul in:
   - **Naam:** `daan`
   - **TTL:** standaard (`86400` of `1 uur`)
   - **Type:** `CNAME`
   - **Waarde:** `cname.vercel-dns.com.` *(let op: het puntje aan het einde mag soms wel, soms niet — TransIP voegt het automatisch toe als je het weglaat)*
6. **Opslaan**.

### Terug naar Vercel

1. Wacht 5-15 minuten. DNS-wijzigingen hebben tijd nodig.
2. Op het Vercel-domein-tabblad zie je een groen vinkje als de koppeling is verwerkt.
3. Vercel regelt automatisch een SSL-certificaat. Daarna is je site bereikbaar op `https://daan.phnkmedia.com`.

Test: open `https://daan.phnkmedia.com` en doe een query. Klaar.

---

## Wat te doen als iets niet werkt

### "API-fout (401)" bij research
Je API-key in Vercel klopt niet of is niet aangezet voor Production. Ga naar **Settings → Environment Variables** in Vercel, controleer de waarde, en doe een **Redeploy** vanuit het Deployments-tabblad.

### "API-fout (529)" bij research
De Anthropic API is overbelast. Probeer een minuut later opnieuw. Niet jouw probleem.

### CORS-fout in browser console
Mag niet voorkomen omdat de fetch naar `/api/research` op hetzelfde domein zit. Als je het wel ziet: je hebt waarschijnlijk de URL aangepast in `App.jsx`. Zet hem terug naar `/api/research`.

### Subdomein blijft "verifying" in Vercel
DNS-propagatie duurt soms langer. Tot 24 uur is normaal, meestal binnen een uur klaar. Check via https://dnschecker.org of `daan.phnkmedia.com` resolved.

### "Module not found" bij `npm run dev`
Run nogmaals `npm install`. Soms struikelt npm op iets klein.

### Vercel weigert deploy met "secret not found"
Je hebt vergeten de Environment Variable toe te voegen. Ga naar Settings → Environment Variables, voeg `ANTHROPIC_API_KEY` toe, en redeploy.

---

## Belangrijke veiligheidspunten

- **De `.env`-file mag NOOIT in Git.** Hij staat in `.gitignore`. Controleer altijd dat hij er niet inzit voor je pusht.
- Als je per ongeluk je API-key hebt gepusht: wijzig hem direct in de Anthropic Console.
- De API-key staat alleen in twee plekken: lokaal in `.env`, en in Vercel's Environment Variables. Browser-bezoekers zien hem nooit.
- Als je het project wil delen of doorgeven: zet de repo niet publiek, of haal alle history weg met een fresh repo.

---

## Kosten-indicatie

- **Vercel:** gratis op het Hobby-plan, ruim voldoende voor demo-volume
- **Anthropic API:** ongeveer 5-15 cent per research-query met Opus 4.5 + web search. Tien queries per dag = €1-2 per maand.
- **Domein:** je hebt phnkmedia.com al, geen extra kosten

---

## Onderhoud na maandag

Als je in de prompt iets wilt aanpassen (bijvoorbeeld de datum-discipline-fix die we hebben besproken):

1. Bewerk `api/research.js` lokaal — pas de SYSTEM_PROMPT-string aan
2. `git add . && git commit -m "Prompt update" && git push`
3. Vercel re-deploys automatisch binnen een minuut

UI-aanpassingen gaan via `src/App.jsx` of `src/styles.css`, hetzelfde flow.

---

Veel succes met de deploy. Als iets niet duidelijk is — vragen mag.
