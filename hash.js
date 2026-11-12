"use strict";
const email = document.getElementById("email"), out = document.getElementById("out");
email.oninput = async () => {
  const v = email.value.trim().toLowerCase();
  if (!v.includes("@")) { out.value = ""; return; }
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(v));
  const hex = [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  if (email.value.trim().toLowerCase() === v) out.value = '"' + hex + '",';
};
out.onfocus = () => out.select();
