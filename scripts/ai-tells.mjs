// Scans page content for AI tells (content guide, sections 4 and 4א).
// Usage:
//   node scripts/ai-tells.mjs                 -> files changed or new in git (default)
//   node scripts/ai-tells.mjs path/a.md ...   -> only these files
//   node scripts/ai-tells.mjs --all           -> every page (report only, never fails)
// Exit code 1 when a checked file has an error. Warnings never fail.
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const CONTENT_DIRS = ["content", "src/content"];
const EXT = /\.(md|mdx)$/;
const HE = "א-ת";
const word = (w) => new RegExp(`(?<![${HE}])[ובלהשכמ]{0,2}${w}(?:ות|ים|ית|י|ה)?(?![${HE}])`, "g");

const PHRASES = [
  "בעולם המהיר", "בעידן הדיגיטלי", "בעולם שמשתנה", "בעולם המשתנה", "כולנו מכירים",
  "חשוב לציין", "ראוי לציין", "חשוב להבין ש", "חשוב לזכור ש", "כדאי לדעת ש",
  "בואו נצלול", "בלי הקדמות", "נעשה סדר",
  "התוצאה?", "ובכנות?", "החלק הכי טוב?", "החלק הכי גרוע?", "הסוד?", "למה זה חשוב?",
  "תהיתם פעם", "רוב האנשים טועים", "מה שאף אחד לא מספר",
  "מקווים שעזרנו", "מקווה שעזרנו", "אל תהססו", "אנחנו כאן בשבילכם", "שאלה מצוינת", "בחירה חכמה",
  "יתרה מזאת", "יתרה מזו", "בנוסף לכך", "לאחר שהבנו", "מעבר לכך", "לסיכום", "מה דעתכם?",
  "משנה משחק", "משנה את כללי המשחק", "פורץ דרך", "פורצת דרך", "ללא פשרות", "הסטנדרטים הגבוהים ביותר",
  "בראש סדרי העדיפויות", "שילוב מנצח", "פתרון מקיף",
];
const PATTERNS = [
  [/(?<![א-ת])(זה|זו|זאת)\s+לא\s+[^.?!:\n]{1,40},\s*(זה|זו|זאת)\s/g, "היפוך 'זה לא X, זה Y'"],
  [/לא\s+עניין\s+של\s+[^.?!\n]{1,40}(אלא|,\s*זה)/g, "היפוך 'לא עניין של X אלא Y'"],
  [/לא\s+רק\s[^.?!\n]{0,80}אלא/g, "'לא רק... אלא'"],
  [/(?<![א-ת])הנה\s+(\d+|כמה|מספר|שלוש|שלושה|ארבע|חמש|הדברים)\s/g, "הכרזה 'הנה X...'"],
  [/\s[-–—]\s/g, "מקף עם רווחים כהפסקה"],
  [/[—–]/g, "מקף ארוך או בינוני"],
];
const WARN_PATTERNS = [
  [/,\s*(תוך\s|מה\s+שמאפשר|מה\s+שהופך|מה\s+שמבטיח|כאשר\s)/g, "משפט שנגרר אחרי פסיק"],
];
const AI_WORDS = ["מהפכני", "חדשני", "חוויית", "מסע", "הוליסטי", "סינרגיה", "למנף", "לרתום", "להעצים", "לייעל",
  "באופן חלק", "ללא מאמץ", "בצורה מושלמת", "אבן דרך", "עדות ל", "מדגיש את", "שקט נפשי", "רב ממדי", "רב-ממדי"];
const AI_WORD_RE = AI_WORDS.map((w) => [w, w.includes(" ") ? new RegExp(w, "g") : word(w)]);
const NUM_HEADING = /^#{1,6}\s+(\d|(שתי|שני|שלוש|שלושה|ארבע|ארבעה|חמש|חמישה|שש|שישה|שבע|שבעה|שמונה|תשע|תשעה|עשר|עשרה)(?=\s))/;

// New files are checked in full. In existing files only added or changed lines are checked,
// because the rules apply to new text and older pages were written before them.
function changedFiles() {
  let out = "";
  try { out = execSync("git -c core.quotepath=off status --porcelain -uall", { encoding: "utf8" }); } catch { return []; }
  return out.split("\n").filter(Boolean)
    .map((l) => ({ st: l.slice(0, 2), f: l.slice(3).replace(/^"|"$/g, "").split(" -> ").pop() }))
    .filter(({ f }) => EXT.test(f) && CONTENT_DIRS.some((d) => f.startsWith(d + "/")) && fs.existsSync(f))
    .map(({ st, f }) => {
      if (st.includes("?") || st.includes("A")) return { f, only: null };
      const only = new Set();
      try {
        const d = execSync(`git diff -U0 HEAD -- "${f}"`, { encoding: "utf8" });
        for (const m of d.matchAll(/^@@ -\S+ \+(\d+)(?:,(\d+))? @@/gm)) {
          const s = +m[1], c = m[2] === undefined ? 1 : +m[2];
          for (let k = s; k < s + c; k++) only.add(k);
        }
      } catch { return { f, only: null }; }
      return { f, only };
    });
}
function allFiles() {
  const res = [];
  const walk = (d) => { if (!fs.existsSync(d)) return; for (const f of fs.readdirSync(d)) { const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p) : EXT.test(f) && res.push(p); } };
  CONTENT_DIRS.forEach(walk);
  return res.filter((f) => !/TEMPLATE/i.test(f));
}

// Text to check: frontmatter title/description + body, without code, tags, URLs, tables' pipes.
function lines(src) {
  const out = [];
  const all = src.split(/\r?\n/);
  let i = 0, inFm = false, inCode = false;
  if (all[0]?.trim() === "---") { inFm = true; i = 1; }
  for (; i < all.length; i++) {
    let l = all[i];
    if (inFm) {
      if (l.trim() === "---") { inFm = false; continue; }
      const m = l.match(/^(title|description|metaTitle|metaDescription|seoTitle|h1|excerpt|answer|lead)\s*:\s*(.*)$/);
      if (m) out.push({ n: i + 1, t: m[2].replace(/^['"]|['"]$/g, ""), fm: true });
      continue;
    }
    if (/^\s*```/.test(l)) { inCode = !inCode; continue; }
    if (inCode || /^\s*(import|export)\s/.test(l)) continue;
    l = l.replace(/<[^>]*>/g, " ").replace(/https?:\/\/\S+/g, " ").replace(/\{[^}]*\}/g, " ");
    out.push({ n: i + 1, t: l });
  }
  return out;
}

function check(file, only = null) {
  const errors = [], warns = [];
  const L = lines(fs.readFileSync(file, "utf8"));
  const hit = (arr, n, rule, s) => { if (!only || only.has(n)) arr.push({ n, rule, s: s.trim().slice(0, 90) }); };
  let para = [], afterHeading = true, firstBody = true;
  const flushPara = () => {
    if (!para.length) return;
    const text = para.map((p) => p.t).join(" ");
    const found = [];
    for (const [w, re] of AI_WORD_RE) { re.lastIndex = 0; if (re.test(text)) found.push(w); }
    const n0 = only ? (para.find((p) => only.has(p.n)) || para[0]).n : para[0].n;
    if (found.length >= 3) hit(errors, n0, `3+ מילים שמסגירות AI בפסקה: ${found.join(", ")}`, text);
    else if (found.length === 2) hit(warns, n0, `2 מילים שמסגירות AI בפסקה: ${found.join(", ")}`, text);
    para = [];
  };
  for (const { n, t, fm } of L) {
    for (const p of PHRASES) if (t.includes(p)) hit(errors, n, `ביטוי אסור: "${p}"`, t);
    for (const [re, rule] of PATTERNS) { re.lastIndex = 0; if (re.test(t)) hit(errors, n, rule, t); }
    for (const [re, rule] of WARN_PATTERNS) { re.lastIndex = 0; if (re.test(t)) hit(warns, n, rule, t); }
    if (fm) continue;
    if (/^\s*#{1,6}\s/.test(t)) {
      flushPara();
      if (NUM_HEADING.test(t.trim())) hit(errors, n, "כותרת שמתחילה במספר", t);
      afterHeading = true;
      continue;
    }
    if (/^\s*[-*]\s+\*\*[^*]+[.:]\*\*/.test(t)) hit(errors, n, "תבליט שנפתח במונח מודגש ונקודה", t);
    if (!t.trim()) { flushPara(); continue; }
    if (afterHeading || firstBody) {
      const first = t.trim().split(/(?<=[.!?])\s/)[0];
      if (first.endsWith("?") && !/^[-*\d|]/.test(t.trim())) hit(warns, n, "פסקה שנפתחת בשאלה (רטורית? מותר רק ב-FAQ)", t);
      afterHeading = false; firstBody = false;
    }
    para.push({ n, t });
  }
  flushPara();
  return { errors, warns };
}

const args = process.argv.slice(2);
const all = args.includes("--all");
const named = args.filter((a) => !a.startsWith("--"));
const files = all ? allFiles().map((f) => ({ f, only: null }))
  : named.length ? named.map((f) => ({ f, only: null })) : changedFiles();
if (!files.length) { console.log("ai-tells: אין עמודים חדשים או ששונו לבדיקה."); process.exit(0); }

let nErr = 0, nWarn = 0, dirty = 0;
for (const { f, only } of files) {
  const { errors, warns } = check(f, only);
  nErr += errors.length; nWarn += warns.length;
  if (!errors.length && !warns.length) continue;
  dirty++;
  if (all) { console.log(`${f}: ${errors.length} שגיאות, ${warns.length} אזהרות`); continue; }
  console.log(`\n${f}${only ? " (רק שורות שנוספו או שונו)" : ""}`);
  for (const e of errors) console.log(`  שגיאה  שורה ${e.n}: ${e.rule}\n         ${e.s}`);
  for (const w of warns) console.log(`  אזהרה  שורה ${w.n}: ${w.rule}\n         ${w.s}`);
}
console.log(`\nai-tells: ${files.length} קבצים נבדקו, ${dirty} עם ממצאים. ${nErr} שגיאות, ${nWarn} אזהרות.`);
if (!all && nErr) { console.log("יש לתקן את כל השגיאות לפני פרסום (מדריך התוכן, סעיפים 4 ו-4א)."); process.exit(1); }
