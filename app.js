"use strict";

const SCOPES = "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.calendarlist.readonly";
const API = "https://www.googleapis.com/calendar/v3";
const CLIENT_ID = (window.APP_CONFIG || {}).CLIENT_ID || "";
const DEFAULT_CALENDAR_ID = (window.APP_CONFIG || {}).DEFAULT_CALENDAR_ID || "";
const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Budapest";
const MONTHS = ["január", "február", "március", "április", "május", "június", "július", "augusztus", "szeptember", "október", "november", "december"];
const DURATIONS = [[15, "15 perc"], [30, "30 perc"], [45, "45 perc"], [60, "1 óra"], [90, "1,5 óra"], [120, "2 óra"], [180, "3 óra"], [240, "4 óra"], [480, "8 óra"]];

const $ = (id) => document.getElementById(id);
const pad = (n) => String(n).padStart(2, "0");
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} },
};

let tokenClient = null;
let accessToken = null;
let editing = null; // a szerkesztett esemény azonosítója, vagy null
let events = [];

/* ---------- Értesítés ---------- */
let toastTimer;
function toast(msg, isError) {
  const t = $("toast");
  t.textContent = msg;
  t.className = "show" + (isError ? " error" : "");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.className = ""), isError ? 5000 : 2500);
}

/* ---------- Bejelentkezés ---------- */
function show(view) {
  for (const v of ["setupView", "loginView", "appView"]) $(v).hidden = v !== view;
  $("logoutBtn").hidden = view !== "appView";
}

function loadSavedToken() {
  const exp = Number(store.get("tokenExpiry") || 0);
  const tok = store.get("token");
  if (tok && Date.now() < exp - 60000) { accessToken = tok; return true; }
  return false;
}

function onToken(resp) {
  if (resp.error || !resp.access_token) { toast("A bejelentkezés nem sikerült.", true); show("loginView"); return; }
  accessToken = resp.access_token;
  store.set("token", accessToken);
  store.set("tokenExpiry", String(Date.now() + (Number(resp.expires_in) || 3600) * 1000));
  store.set("signedIn", "1");
  startApp();
}

window.onGisLoaded = function () {
  if (!configured() || tokenClient || !window.google) return;
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID, scope: SCOPES, callback: onToken,
    error_callback: () => { if (!accessToken) show("loginView"); },
  });
  $("loginBtn").disabled = false;
};

function login() {
  if (!tokenClient) { toast("A Google bejelentkezés még töltődik, próbáld újra.", true); return; }
  // Aki már adott engedélyt, annak nem kérdez rá újra.
  tokenClient.requestAccessToken({ prompt: store.get("signedIn") ? "" : "consent" });
}

function logout() {
  if (accessToken && window.google) google.accounts.oauth2.revoke(accessToken, () => {});
  accessToken = null;
  for (const k of ["token", "tokenExpiry", "signedIn"]) store.del(k);
  show("loginView");
}

function sessionExpired() {
  accessToken = null;
  store.del("token"); store.del("tokenExpiry");
  show("loginView");
  toast("Lejárt a bejelentkezés, lépj be újra.", true);
}

/* ---------- Google Naptár API ---------- */
async function api(path, options = {}) {
  let res;
  try {
    res = await fetch(API + path, {
      ...options,
      headers: { Authorization: "Bearer " + accessToken, ...(options.body ? { "Content-Type": "application/json" } : {}) },
    });
  } catch {
    throw new Error("Nincs internetkapcsolat.");
  }
  if (res.status === 401) { sessionExpired(); throw new Error("Lejárt a bejelentkezés."); }
  if (!res.ok) {
    let msg = "Hiba történt (" + res.status + ").";
    try { msg = (await res.json()).error.message || msg; } catch {}
    if (res.status === 403) msg = "Ehhez a naptárhoz nincs írási jogod. (" + msg + ")";
    throw new Error(msg);
  }
  return res.status === 204 ? null : res.json();
}

const calPath = () => "/calendars/" + encodeURIComponent($("calendarSel").value) + "/events";

async function loadCalendars() {
  const data = await api("/users/me/calendarList?minAccessRole=writer&maxResults=250");
  const sel = $("calendarSel");
  sel.textContent = "";
  for (const c of data.items || []) {
    const o = new Option((c.summaryOverride || c.summary) + (c.primary ? " (saját)" : ""), c.id);
    sel.add(o);
  }
  const saved = store.get("calendarId");
  if (saved && [...sel.options].some((o) => o.value === saved)) sel.value = saved;
  else {
    // Alapértelmezés: a config.js-ben megadott naptár, ennek hiányában a Google családi naptára ("family…" azonosító).
    const ids = [...sel.options].map((o) => o.value);
    const def = ids.find((id) => id === DEFAULT_CALENDAR_ID) || ids.find((id) => id.startsWith("family"));
    if (def) sel.value = def;
  }
}

async function loadEvents() {
  if (!$("calendarSel").value) { renderEvents([]); return; }
  const q = new URLSearchParams({ timeMin: new Date().toISOString(), singleEvents: "true", orderBy: "startTime", maxResults: "50" });
  const data = await api(calPath() + "?" + q);
  renderEvents(data.items || []);
}

/* ---------- Eseménylista ---------- */
function parseLocalDate(s) { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); }
const evStart = (ev) => (ev.start.dateTime ? new Date(ev.start.dateTime) : parseLocalDate(ev.start.date));
const hm = (d) => pad(d.getHours()) + ":" + pad(d.getMinutes());

function renderEvents(items) {
  events = items;
  const ul = $("eventList");
  ul.textContent = "";
  $("emptyMsg").hidden = items.length > 0;
  let lastDay = "";
  for (const ev of items) {
    const start = evStart(ev);
    const dayLabel = start.toLocaleDateString("hu-HU", { year: "numeric", month: "long", day: "numeric", weekday: "long" });
    if (dayLabel !== lastDay) {
      const sep = document.createElement("li");
      sep.className = "daySep";
      sep.textContent = dayLabel;
      ul.append(sep);
      lastDay = dayLabel;
    }
    const li = document.createElement("li");
    const row = document.createElement("div"); row.className = "ev";
    const when = document.createElement("div"); when.className = "when";
    when.textContent = ev.start.dateTime ? hm(start) + "–" + hm(new Date(ev.end.dateTime)) : "egész nap";
    const what = document.createElement("div"); what.className = "what";
    what.textContent = ev.summary || "(cím nélkül)";
    row.append(when, what);
    const btns = document.createElement("div"); btns.className = "evbtns";
    const edit = document.createElement("button"); edit.type = "button"; edit.textContent = "Módosítás";
    edit.onclick = () => startEdit(ev);
    const del = document.createElement("button"); del.type = "button"; del.className = "danger"; del.textContent = "Törlés";
    del.onclick = () => deleteEvent(ev, del);
    btns.append(edit, del);
    li.append(row, btns);
    ul.append(li);
  }
}

async function deleteEvent(ev, btn) {
  if (!confirm('Biztosan törlöd?\n\n"' + (ev.summary || "(cím nélkül)") + '"')) return;
  btn.disabled = true;
  try {
    await api(calPath() + "/" + encodeURIComponent(ev.id), { method: "DELETE" });
    if (editing === ev.id) resetForm();
    toast("Esemény törölve.");
    await loadEvents();
  } catch (e) { toast(e.message, true); btn.disabled = false; }
}

/* ---------- Űrlap ---------- */
function fillSelect(sel, pairs) {
  sel.textContent = "";
  for (const [value, label] of pairs) sel.add(new Option(label, value));
}

function fillYears(include) {
  const now = new Date().getFullYear();
  const from = Math.min(now, include || now), to = Math.max(now + 5, include || now);
  const years = [];
  for (let y = from; y <= to; y++) years.push([y, y]);
  fillSelect($("year"), years);
}

function fillDays() {
  const y = Number($("year").value), m = Number($("month").value);
  const count = new Date(y, m, 0).getDate();
  const keep = Math.min(Number($("day").value) || 1, count);
  const days = [];
  for (let d = 1; d <= count; d++) {
    const wd = new Date(y, m - 1, d).toLocaleDateString("hu-HU", { weekday: "short" });
    days.push([d, d + ". (" + wd + ")"]);
  }
  fillSelect($("day"), days);
  $("day").value = keep;
}

function setDuration(minutes) {
  const sel = $("duration");
  fillSelect(sel, DURATIONS);
  if (!DURATIONS.some(([v]) => v === minutes)) {
    const h = Math.floor(minutes / 60), m = minutes % 60;
    sel.add(new Option((h ? h + " óra " : "") + (m ? m + " perc" : ""), minutes));
  }
  sel.value = minutes;
}

function setFormDate(d, minutes) {
  fillYears(d.getFullYear());
  $("year").value = d.getFullYear();
  $("month").value = d.getMonth() + 1;
  fillDays();
  $("day").value = d.getDate();
  $("hour").value = d.getHours();
  $("minute").value = d.getMinutes();
  setDuration(minutes);
}

function resetForm() {
  editing = null;
  $("formTitle").textContent = "Új esemény";
  $("saveBtn").textContent = "Mentés a naptárba";
  $("cancelEditBtn").hidden = true;
  $("title").value = "";
  $("allDay").checked = false;
  $("timeFields").hidden = false;
  // Alapérték: a következő egész óra.
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  setFormDate(d, 60);
}

function startEdit(ev) {
  editing = ev.id;
  $("formTitle").textContent = "Esemény módosítása";
  $("saveBtn").textContent = "Módosítás mentése";
  $("cancelEditBtn").hidden = false;
  $("title").value = ev.summary || "";
  const allDay = !ev.start.dateTime;
  $("allDay").checked = allDay;
  $("timeFields").hidden = allDay;
  const start = evStart(ev);
  if (allDay) { start.setHours(9); setFormDate(start, 60); }
  else setFormDate(start, Math.max(1, Math.round((new Date(ev.end.dateTime) - start) / 60000)));
  $("eventForm").scrollIntoView({ behavior: "smooth", block: "start" });
}

const ymd = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
const localIso = (d) => ymd(d) + "T" + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":00";

function buildEvent() {
  const y = Number($("year").value), mo = Number($("month").value) - 1, d = Number($("day").value);
  const body = { summary: $("title").value.trim() };
  if ($("allDay").checked) {
    body.start = { date: ymd(new Date(y, mo, d)), dateTime: null, timeZone: null };
    body.end = { date: ymd(new Date(y, mo, d + 1)), dateTime: null, timeZone: null };
  } else {
    const start = new Date(y, mo, d, Number($("hour").value), Number($("minute").value));
    const end = new Date(start.getTime() + Number($("duration").value) * 60000);
    body.start = { dateTime: localIso(start), timeZone: TZ, date: null };
    body.end = { dateTime: localIso(end), timeZone: TZ, date: null };
  }
  return body;
}

async function saveEvent(e) {
  e.preventDefault();
  if (!$("title").value.trim()) { toast("Adj címet az eseménynek.", true); return; }
  if (!$("calendarSel").value) { toast("Nincs kiválasztott naptár.", true); return; }
  const btn = $("saveBtn");
  btn.disabled = true;
  try {
    // Módosításnál a null mezők törlik a régi (egész napos / időpontos) értéket; új eseménynél nem kellenek.
    const body = JSON.stringify(buildEvent(), editing ? undefined : (k, v) => (v === null ? undefined : v));
    if (editing) await api(calPath() + "/" + encodeURIComponent(editing), { method: "PATCH", body });
    else await api(calPath(), { method: "POST", body });
    toast(editing ? "Módosítás elmentve." : "Esemény elmentve a naptárba.");
    resetForm();
    await loadEvents();
  } catch (err) { toast(err.message, true); }
  finally { btn.disabled = false; }
}

/* ---------- Indulás ---------- */
function configured() { return CLIENT_ID && !CLIENT_ID.startsWith("IDE_JON"); }

async function startApp() {
  show("appView");
  try {
    await loadCalendars();
    if (!$("calendarSel").value) toast("Nincs olyan naptárad, amelybe írhatsz.", true);
    await loadEvents();
  } catch (e) { toast(e.message, true); }
}

function init() {
  fillSelect($("month"), MONTHS.map((m, i) => [i + 1, m]));
  fillSelect($("hour"), Array.from({ length: 24 }, (_, i) => [i, pad(i)]));
  fillSelect($("minute"), Array.from({ length: 60 }, (_, i) => [i, pad(i)]));
  resetForm();

  $("year").onchange = fillDays;
  $("month").onchange = fillDays;
  $("allDay").onchange = () => ($("timeFields").hidden = $("allDay").checked);
  $("eventForm").onsubmit = saveEvent;
  $("cancelEditBtn").onclick = resetForm;
  $("loginBtn").onclick = login;
  $("logoutBtn").onclick = logout;
  $("refreshBtn").onclick = () => loadEvents().catch((e) => toast(e.message, true));
  $("calendarSel").onchange = () => {
    store.set("calendarId", $("calendarSel").value);
    resetForm();
    loadEvents().catch((e) => toast(e.message, true));
  };
  // Ha a háttérből visszatér az app, frissítjük a listát.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && accessToken && !$("appView").hidden) loadEvents().catch(() => {});
  });

  if (!configured()) { show("setupView"); return; }
  if (loadSavedToken()) startApp(); else show("loginView");
  window.onGisLoaded();

  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
}

init();
