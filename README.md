# Füleki család naptár

Telefonra telepíthető webalkalmazás (PWA), amellyel a család tagjai a saját Google-fiókjukkal eseményeket vehetnek fel a közös „Család” Google-naptárba, illetve módosíthatják és törölhetik a közelgő eseményeket.

Az alkalmazásnak nincs saját szervere: a telefon böngészője közvetlenül a Google Naptárral beszél, adat máshová nem kerül.

## Üzembe helyezés (egyszer kell megcsinálni)

### 1. Tárhely: hol lesz elérhető az app

Az appnak egy `https://` kezdetű címen kell futnia. A legegyszerűbb ingyenes megoldás a GitHub Pages:

1. Hozz létre egy új, nyilvános repót a github.com-on (pl. `csaladi-naptar`), és töltsd fel bele ennek a mappának a tartalmát.
2. A repóban: **Settings → Pages → Source: Deploy from a branch → Branch: main / (root) → Save**.
3. Pár perc múlva az app címe: `https://FELHASZNALONEV.github.io/csaladi-naptar/`

### 2. Google kliensazonosító létrehozása

1. Nyisd meg: <https://console.cloud.google.com/> , és hozz létre egy új projektet (pl. „Füleki család naptár”).
2. **APIs & Services → Library** → keresd meg a **Google Calendar API**-t → **Enable**.
3. **APIs & Services → OAuth consent screen** (Google Auth Platform):
   - User type / Audience: **External**
   - App neve: Füleki család naptár, a kapcsolattartó e-mail a sajátod.
   - **Test users**: add hozzá minden családtag Gmail-címét, aki használni fogja az appot.
4. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**
   - **Authorized JavaScript origins**: `https://FELHASZNALONEV.github.io` (csak a domain, útvonal és záró perjel nélkül)
   - **Create**, majd másold ki a kapott **Client ID**-t (`…apps.googleusercontent.com` végű).
5. Írd be a Client ID-t a `config.js` fájlba a `CLIENT_ID` helyére, és töltsd fel a módosított fájlt.

A Client ID nem titok, nyugodtan lehet nyilvános repóban.

### 3. Engedélyezett e-mail-címek megadása

Az appot csak azok a Google-fiókok használhatják, amelyeknek az ujjlenyomata szerepel a `config.js` fájl `ALLOWED_EMAIL_HASHES` listájában. A címek így nem olvashatók ki a nyilvános repóból.

1. Nyisd meg az app címén a `hash.html` oldalt (pl. `https://FELHASZNALONEV.github.io/csaladi-naptar/hash.html`).
2. Írd be a családtag Gmail-címét, és a kapott sort másold be a listába (soronként egy cím).
3. Töltsd fel a módosított `config.js` fájlt.

Ugyanezeket a címeket a 2/3. pontban tesztfelhasználóként is fel kell venni.

### 4. Telepítés a telefonokra

1. Androidon nyisd meg az app címét **Chrome**-ban.
2. Menü (⋮) → **Hozzáadás a kezdőképernyőhöz / Alkalmazás telepítése**.
3. Indítsd el az ikonról, és koppints a **Bejelentkezés Google-fiókkal** gombra.

Az első belépéskor a Google figyelmeztet, hogy az alkalmazást „a Google nem ellenőrizte”. Ez saját, tesztmódban futó appnál normális: **Speciális → Tovább a(z) Füleki család naptár oldalra**, majd engedélyezd a naptárhozzáférést.

## Biztonság

- **Naptármegosztás (Google ellenőrzi):** a családi naptárba csak az tud írni, akinek ott írási joga van. Ez a fő védelem, az appból nem kerülhető meg.
- **Tesztfelhasználók (Google ellenőrzi):** az appba csak a Cloud Console-ban felvett címekkel lehet belépni.
- **E-mail-engedélylista (az app ellenőrzi):** belépés után az app megnézi a fiók címét; ha nincs a listán, visszavonja a hozzáférést és kilépteti. Ez második védvonal: a telefonon fut, ezért önmagában nem helyettesíti a fenti kettőt.
- **Új esemény csak a családi naptárba:** új eseményt az app kizárólag a Google családi naptárába vesz fel (vagy a `config.js` → `DEFAULT_CALENDAR_ID` naptárba, ha meg van adva); másik naptár nem választható.
- **Belépett fiók kijelzése:** a fejlécben látszik, melyik címmel vagy bent.
- **Tartalombiztonsági szabály (CSP):** az oldal csak a saját fájljait és a Google bejelentkezési, illetve naptárszolgáltatását érheti el.

## Tudnivalók

- A lista a fiók minden naptárát mutathatja. Alapból a családi naptár, a családtagok saját naptárai és a Google Naptárban bepipált naptárak látszanak; a lista fölötti kapcsolókkal naptáranként ki-be kapcsolhatók. Módosítani és törölni a családi naptár és a belépett fiók saját naptárának eseményeit lehet (ismétlődő eseménynél csak az adott alkalmat); a többi csak olvasható.
- A lista 60 napra előre mutat; a „Későbbi események betöltése” gomb további 60 nappal bővíti.

- A Google egy órára ad belépést. Ha lejár, az app újra a bejelentkező gombot mutatja; egy koppintás, és jelszó nélkül visszalép.
- Az oldal alján látszik az app verziószáma; ebből ellenőrizhető, hogy a telefon már a friss változatot futtatja-e.
- Az időpontok a telefon időzónájában (Magyarországon: Europe/Budapest) kerülnek a naptárba.
