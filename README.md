# Harri Muikkula — yrityskoomikko-sivusto

Markkinointisivusto (React + Vite). Sisältää keikkakalenterin (Firestore), kaksikielisen sisällön (FI/EN), median ja yhteydenottolomakkeen.

## Kehitys

```bash
npm install
cp .env.example .env   # täytä Firebase- ja Web3Forms-avaimet
npm run dev
```

## Tuotantoversio

```bash
npm run build
npm run preview
```

## Ympäristömuuttujat

Katso `.env.example`. **Älä commitoi** `.env`-tiedostoa (sisältää salaisuuksia).

## Julkaisu Netlifyyn (GitHub-repo)

1. Mene [app.netlify.com](https://app.netlify.com) ja kirjaudu sisään.
2. **Add new site** → **Import an existing project** → **GitHub**.
3. Valitse repo: `harrimuikkula-creator/yrityskoomikko-sivusto`.
4. Build-asetukset tulevat tiedostosta `netlify.toml` (`npm run build` → `dist`).
5. Ennen ensimmäistä deployta: **Site configuration** → **Environment variables** — kopioi `.env`-tiedoston arvot:
   - `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`
   - `VITE_WEB3FORMS_ACCESS_KEY` (jos lomake käytössä)
6. **Deploy site** — saat osoitteen tyyliin `https://jotain.netlify.app`.

Oman domainin liität kohdasta **Domain management**.

### Kalenteri ei toimi Netlifyssä?

Vite upottaa `VITE_*`-muuttujat **buildin aikana**. Jos lisäsit muuttujat vasta deployn jälkeen:

1. **Site configuration** → **Environment variables** (kaikki `VITE_FIREBASE_*` arvot `.env`-tiedostosta)
2. **Deploys** → **Trigger deploy** → **Clear cache and deploy site**

Firebase Console ([console.firebase.google.com](https://console.firebase.google.com)):

1. **Authentication** → **Settings** → **Authorized domains** → lisää `sinun-sivu.netlify.app` (ja oma domain)
2. **Authentication** → **Sign-in method** → **Anonymous** → **Enable**
3. **Firestore** → **Rules** → salli `gigs`-kokoelman **read** (esim. anonyymille tai kaikille):

```
match /gigs/{gigId} {
  allow read: if true;
  allow write: if request.auth != null;
}
```

Jos API-avaimella on referrer-rajoituksia Google Cloudissa, lisää myös `*.netlify.app`.

## GitHub

https://github.com/harrimuikkula-creator/yrityskoomikko-sivusto
