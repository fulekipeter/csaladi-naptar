// Lásd: README.md
window.APP_CONFIG = {
  // A Google Cloud Console-ban létrehozott OAuth kliensazonosító.
  CLIENT_ID: "303428450960-jah79mgsbn1fffralc38dv0jk3dan5fj.apps.googleusercontent.com",

  // Az engedélyezett e-mail-címek ujjlenyomatai (SHA-256). Csak ezekkel a fiókokkal használható az app.
  // Új cím ujjlenyomatát az app címén a /hash.html oldal számolja ki; soronként egyet kell ide beírni.
  ALLOWED_EMAIL_HASHES: [
    "f9b5534f95d0af459982a9f2eb1452565681ae0cdc999ec2aa154d98fc397a09",
    "3e98911d015722bb578c6fdcebd7a41f330d2af13df09ec0b577571c295cf5e6",
  ],

  // Ezek a naptárak egyáltalán nem jelennek meg az appban (a lista kapcsolói között sem).
  EXCLUDED_CALENDAR_IDS: [
    "de.german#holiday@group.v.calendar.google.com", // Feiertage in Deutschland
  ],

  // Nem kötelező: a családi naptár azonosítója.
  // Üresen hagyva az app magától a Google családi ("Család") naptárát használja.
  DEFAULT_CALENDAR_ID: "",
};
