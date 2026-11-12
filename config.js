// Lásd: README.md
window.APP_CONFIG = {
  // A Google Cloud Console-ban létrehozott OAuth kliensazonosító.
  CLIENT_ID: "IDE_JON_A_KLIENSAZONOSITO.apps.googleusercontent.com",

  // Az engedélyezett e-mail-címek ujjlenyomatai (SHA-256). Csak ezekkel a fiókokkal használható az app.
  // Új cím ujjlenyomatát az app címén a /hash.html oldal számolja ki; soronként egyet kell ide beírni.
  ALLOWED_EMAIL_HASHES: [
    "f9b5534f95d0af459982a9f2eb1452565681ae0cdc999ec2aa154d98fc397a09",
  ],

  // Nem kötelező: a családi naptár azonosítója.
  // Üresen hagyva az app magától a Google családi ("Család") naptárát használja.
  DEFAULT_CALENDAR_ID: "",
};
