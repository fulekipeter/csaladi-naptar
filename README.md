# Családi naptár

Telefonra telepíthető webalkalmazás (PWA), amellyel a család tagjai a saját Google-fiókjukkal eseményeket vehetnek fel a közös „Család” Google-naptárba, illetve módosíthatják és törölhetik a közelgő eseményeket.

Az alkalmazásnak nincs saját szervere: a telefon böngészője közvetlenül a Google Naptárral beszél, adat máshová nem kerül.

## Üzembe helyezés (egyszer kell megcsinálni)

### 1. Tárhely: hol lesz elérhető az app

Az appnak egy `https://` kezdetű címen kell futnia. A legegyszerűbb ingyenes megoldás a GitHub Pages:

1. Hozz létre egy új, nyilvános repót a github.com-on (pl. `csaladi-naptar`), és töltsd fel bele ennek a mappának a tartalmát.
2. A repóban: **Settings → Pages → Source: Deploy from a branch → Branch: main / (root) → Save**.
3. Pár perc múlva az app címe: `https://FELHASZNALONEV.github.io/csaladi-naptar/`

### 2. Google kliensazonosító létrehozása

1. Nyisd meg: <https://console.cloud.google.com/> , és hozz létre egy új projektet (pl. „Családi naptár”).
2. **APIs & Services → Library** → keresd meg a **Google Calendar API**-t → **Enable**.
3. **APIs & Services → OAuth consent screen** (Google Auth Platform):
   - User type / Audience: **External**
   - App neve: Családi naptár, a kapcsolattartó e-mail a sajátod.
   - **Test users**: add hozzá minden családtag Gmail-címét, aki használni fogja az appot.
4. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**
   - **Authorized JavaScript origins**: `https://FELHASZNALONEV.github.io` (csak a domain, útvonal és záró perjel nélkül)
   - **Create**, majd másold ki a kapott **Client ID**-t (`…apps.googleusercontent.com` végű).
5. Írd be a Client ID-t a `config.js` fájlba a `CLIENT_ID` helyére, és töltsd fel a módosított fájlt.

A Client ID nem titok, nyugodtan lehet nyilvános repóban.

### 3. Telepítés a telefonokra

1. Androidon nyisd meg az app címét **Chrome**-ban.
2. Menü (⋮) → **Hozzáadás a kezdőképernyőhöz / Alkalmazás telepítése**.
3. Indítsd el az ikonról, és koppints a **Bejelentkezés Google-fiókkal** gombra.

Az első belépéskor a Google figyelmeztet, hogy az alkalmazást „a Google nem ellenőrizte”. Ez saját, tesztmódban futó appnál normális: **Speciális → Tovább a(z) Családi naptár oldalra**, majd engedélyezd a naptárhozzáférést.

## Tudnivalók

- Alapból a Google családi („Család”) naptára van kiválasztva (felülírható: `config.js` → `DEFAULT_CALENDAR_ID`); a legördülő listában bármely olyan naptár választható, amelybe az adott családtagnak írási joga van.
- A Google egy órára ad belépést. Ha lejár, az app újra a bejelentkező gombot mutatja; egy koppintás, és jelszó nélkül visszalép.
- Csak azok tudnak belépni, akik a 2/3. pontban tesztfelhasználóként szerepelnek.
- Az időpontok a telefon időzónájában (Magyarországon: Europe/Budapest) kerülnek a naptárba.
