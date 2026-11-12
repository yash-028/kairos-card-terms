#!/usr/bin/env node
/*
 * Checks cards.json against the rules the Kairos app applies before it accepts the file.
 * The app runs the same checks (function checkTerms in its page); a file that fails here is ignored there.
 *
 *   node validate.js            checks ./cards.json
 *   node validate.js other.json checks another file
 */
"use strict";
const fs = require("fs");

const CATS = ["dining", "groceries", "travel", "gas", "transit", "streaming", "online", "drugstore", "other"];
const PERIODS = ["monthly", "quarterly", "semiannual", "annual"];
// Matchers find a benefit's statement credit by its description. Only plain words, "|" and "\b" are allowed,
// so a matcher can never be slow or match everything.
const MATCHER = /^[a-z0-9 |'+.\-\\]{1,120}$/i;

function checkTerms(feed) {
  const errors = [];
  const fail = (where, what) => errors.push(where + ": " + what);
  const str = (v, max) => typeof v === "string" && v.trim().length > 0 && v.length <= max;
  const num = (v, lo, hi) => typeof v === "number" && Number.isFinite(v) && v >= lo && v <= hi;
  const optStr = (v, max) => v === undefined || (typeof v === "string" && v.length <= max);

  if (!feed || typeof feed !== "object" || Array.isArray(feed)) return ["file: not a JSON object"];
  if (feed.format !== "kairos-card-terms") fail("file", 'format must be "kairos-card-terms"');
  if (feed.version !== 1) fail("file", "version must be 1");
  if (!Number.isInteger(feed.rev) || feed.rev < 1 || feed.rev > 1e6) fail("file", "rev must be a whole number from 1 up");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(feed.updated))) fail("file", "updated must be a date like 2026-11-11");
  if (!Array.isArray(feed.cards) || feed.cards.length === 0 || feed.cards.length > 100) {
    fail("file", "cards must be a list of 1 to 100 cards");
    return errors;
  }

  const keys = new Set();
  feed.cards.forEach((c, i) => {
    const at = "cards[" + i + "]" + (c && c.k ? " (" + c.k + ")" : "");
    if (!c || typeof c !== "object") return fail(at, "not an object");
    if (!/^[a-z0-9]{1,20}$/.test(String(c.k))) fail(at, "k must be 1 to 20 lowercase letters or digits");
    if (keys.has(c.k)) fail(at, "k is used twice");
    keys.add(c.k);
    if (!Number.isInteger(c.rev) || c.rev < 1 || c.rev > 1e6) fail(at, "rev must be a whole number from 1 up");
    if (!str(c.name, 80)) fail(at, "name is required, up to 80 characters");
    if (!str(c.issuer, 60)) fail(at, "issuer is required, up to 60 characters");
    if (!num(c.fee, 0, 5000)) fail(at, "fee must be 0 to 5000");
    if (!["cash", "points"].includes(c.unit)) fail(at, 'unit must be "cash" or "points"');
    if (!optStr(c.program, 60)) fail(at, "program is up to 60 characters");
    if (c.unit === "points" && !str(c.program, 60)) fail(at, "points cards need a program");
    if (!c.rates || typeof c.rates !== "object") fail(at, "rates are required");
    else {
      for (const [k, v] of Object.entries(c.rates)) {
        if (!CATS.includes(k)) fail(at, "rates: unknown category " + k);
        if (!num(v, 0, 20)) fail(at, "rates." + k + " must be 0 to 20");
      }
      if (c.rates.other === undefined) fail(at, "rates.other is required");
    }
    if (c.caps !== undefined) {
      if (typeof c.caps !== "object" || Array.isArray(c.caps)) fail(at, "caps must be an object");
      else for (const [k, v] of Object.entries(c.caps)) {
        if (!CATS.includes(k)) fail(at, "caps: unknown category " + k);
        if (!num(v, 0, 1e7)) fail(at, "caps." + k + " must be 0 to 10,000,000");
      }
    }
    if (!Array.isArray(c.credits) || c.credits.length > 30) fail(at, "credits must be a list of up to 30");
    else c.credits.forEach((x, j) => {
      const w = at + " credits[" + j + "]";
      if (!str(x.name, 100)) fail(w, "name is required, up to 100 characters");
      if (!num(x.amount, 0.01, 2000)) fail(w, "amount must be 0.01 to 2000");
      if (!PERIODS.includes(x.period)) fail(w, "period must be one of " + PERIODS.join(", "));
      if (x.enroll !== undefined && typeof x.enroll !== "boolean") fail(w, "enroll must be true or false");
      if (!optStr(x.how, 300)) fail(w, "how is up to 300 characters");
      if (x.m !== undefined) {
        if (!MATCHER.test(String(x.m))) fail(w, "m may hold only letters, digits, spaces, | ' + . - and \\b");
        else try { new RegExp(x.m, "i"); } catch (e) { fail(w, "m is not a valid pattern"); }
      }
    });
    if (c.perks !== undefined) {
      if (!Array.isArray(c.perks) || c.perks.length > 30) fail(at, "perks must be a list of up to 30");
      else c.perks.forEach((p, j) => {
        const w = at + " perks[" + j + "]";
        if (!str(p.name, 120)) fail(w, "name is required, up to 120 characters");
        if (!optStr(p.how, 300)) fail(w, "how is up to 300 characters");
        if (p.enroll !== undefined && typeof p.enroll !== "boolean") fail(w, "enroll must be true or false");
      });
    }
    if (c.protect !== undefined) {
      if (!c.protect || typeof c.protect !== "object" || Array.isArray(c.protect)) fail(at, "protect must be an object");
      else {
        if (c.protect.purchase !== undefined && !num(c.protect.purchase, 0, 365)) fail(at, "protect.purchase must be 0 to 365 days");
        if (c.protect.return !== undefined && !num(c.protect.return, 0, 365)) fail(at, "protect.return must be 0 to 365 days");
        if (c.protect.warranty !== undefined && !num(c.protect.warranty, 0, 5)) fail(at, "protect.warranty must be 0 to 5 years");
      }
    }
    if (!optStr(c.seen, 60)) fail(at, "seen is up to 60 characters");
    if (!optStr(c.note, 600)) fail(at, "note is up to 600 characters");
    if (c.sources !== undefined && (!Array.isArray(c.sources) || c.sources.some(u => !/^https:\/\/[^\s]{4,300}$/.test(String(u)))))
      fail(at, "sources must be a list of https links");
  });
  return errors;
}

if (require.main === module) {
  const path = process.argv[2] || "cards.json";
  let feed;
  try {
    feed = JSON.parse(fs.readFileSync(path, "utf8"));
  } catch (e) {
    console.error(path + ": not valid JSON (" + e.message + ")");
    process.exit(1);
  }
  const errors = checkTerms(feed);
  if (errors.length) {
    console.error(errors.length + " problem" + (errors.length === 1 ? "" : "s") + " in " + path + ":\n  " + errors.join("\n  "));
    process.exit(1);
  }
  console.log(path + ": OK, " + feed.cards.length + " cards, rev " + feed.rev);
}

module.exports = { checkTerms };
