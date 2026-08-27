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
3. Jos käytössä on monikäyttäjämalli, lisää myös `VITE_FIREBASE_OWNER_UID` (sen käyttäjän UID, jonka `gigs` näytetään sivulla)

#### Suositeltu kestävä korjaus (ohittaa client-rules-ongelmat)

Tuotanto hakee keikat ensisijaisesti Netlify-funktiosta `/.netlify/functions/gigs`, joka käyttää Firebase Admin SDK:ta.

1. Firebase Console → **Project settings** → **Service accounts** → **Generate new private key**
2. Netlify → Environment variables → lisää:
   - Key: `FIREBASE_SERVICE_ACCOUNT_JSON`
   - Value: koko JSON yhdellä rivillä (koko service account -tiedoston sisältö)
3. Varmista että `VITE_FIREBASE_OWNER_UID` on asetettu
4. **Clear cache and deploy**

Ilman tätä client-puolen Firestore kaatuu, jos:
- rules eivät salli julkista lukua `ownerId`:lle, tai
- Google API key estää referrerin `harrimuikkula.netlify.app`

Firebase Console / Google Cloud:

1. **Authentication** → **Settings** → **Authorized domains** → lisää `harrimuikkula.netlify.app` (ja oma domain)
2. **Authentication** → **Sign-in method** → **Anonymous** → **Enable**
3. **Firestore** → **Rules** (varavaihtoehto clientille):

```
match /gigs/{id} {
  allow read: if resource.data.ownerId == "YOUR_FIREBASE_OWNER_UID"
    || (signedIn() && canAccessOwner(resource.data.ownerId));
  allow create: if signedIn() && createOwnerOk();
  allow update: if signedIn() && canAccessOwner(resource.data.ownerId) && ownerUnchanged();
  allow delete: if signedIn() && canAccessOwner(resource.data.ownerId);
}
```

4. Google Cloud → **APIs & Credentials** → Firebase API key → HTTP referrers → lisää:
   - `https://harrimuikkula.netlify.app/*`
   - `https://*.netlify.app/*`
   - `http://localhost:5173/*`

### Keikkojen vikansieto ja hälytys

- Kalenteri tallentaa selaimen `localStorage`en viimeisimmän onnistuneen keikkadatan.
- Jos synkronointi epäonnistuu, sivu näyttää automaattisesti tämän viimeisimmän toimineen datan.
- Discord-hälytys lähtee Netlify-funktion kautta (`/.netlify/functions/discord-alert`) oikeasta synkkivirheestä (cooldown 12h).

```
# Netlify Environment variables (server-only, Secret)
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
DISCORD_MENTION=<@123456789012345678>
```

Älä käytä `VITE_`-etuliitettä webhookille — se päätyisi julkiseen JavaScript-bundlen.

### Kävijäilmoitukset Discordiin

- Jokainen uusi selainistunto lähettää Discordiin ilmoituksen.
- Viestissä on juokseva kävijälaskuri (`Kävijöitä yhteensä`).
- Localhostia ei lasketa (ei spammiä kehityksessä).

### Yhteydenottolomake

- Ensisijainen kanava: Web3Forms (`VITE_WEB3FORMS_ACCESS_KEY`).
- **Jokainen** tarjouspyyntö lähetetään myös Discordiin (server-side `DISCORD_WEBHOOK_URL`), jotta lead ei katoa vaikka sähköposti pettäisi.
- Jos sekä sähköposti että Discord epäonnistuvat, käyttäjälle näytetään ohje lähettää suoraan `harri.muikkula@gmail.com`.

## GitHub

https://github.com/harrimuikkula-creator/yrityskoomikko-sivusto
