# CLAUDE.md - בית האיטום

אתר שירות ותוכן בתחום האיטום בישראל. Astro 5 סטטי, RTL, עברית.

## מסמכי מקור (חובה לקרוא לפני עבודה)
- `docs/build-spec.md` - הפרומפט המלא לבניית האתר: מבנה, סילואים, URL, עיצוב, SEO, AI, ערים, בדיקות. **קובע בנושאי מבנה, טכנולוגיה ועיצוב.**
- `docs/content-guide.md` - מדריך התוכן. **קובע בכל נושא כתיבה.** כל עמוד עובר את צ'קליסט סעיף 14 שלו.
- `TASK-LOG.md` - יומן משימות. בסוף כל משימה מוסיפים רשומה. לא מוחקים רשומות.

## חוקי יסוד
- **אין קישורים חיצוניים ואין שמות מקורות בתוכן** (החלטת המשתמש 2026-11-10, גוברת על build-spec סעיף 7 ו-content-guide סעיף 3 בעניין ציטוט מקורות). עובדות נשארות, בלי "לפי X". המקור נשמר רק בשדות source/sourceUrl של המחירים ב-frontmatter (לא מוצג). נאכף ב-validate.ts (`SOURCE_NAMES`). תקנים (ת"י) וחוקים - מותר לציין בשמם, בלי קישור.
- **לא ממציאים נתונים**: שנות ניסיון, פרויקטים, לקוחות, המלצות, תעודות, תקנים, מחירים. פרט עסקי שלא נמסר = placeholder בסוגריים מרובעים ב-`src/config/business.ts`.
- **מחירים** רק עם מקור ותאריך בדיקה (`src/data/prices.ts`, כשייווצר). שורה לא מאומתת לא מוצגת.
- **סלאג שנקבע לא משתנה.** אם חייבים - הפניית 301.
- **מקפים**: רק `-`. אסור `–` / `—` בתוכן וב-UI.
- אין לקשר לעמוד שלא קיים. אין לפרסם עמוד ריק / "בקרוב" / עם placeholder בתוכן.
- כל פרטי העסק מגיעים מ-`src/config/business.ts` בלבד.

## מבנה
- `src/config/business.ts` - פרטי עסק, עזרי טלפון/וואטסאפ, זיהוי דומיין זמני.
- `src/layouts/BaseLayout.astro` - head, SEO, JSON-LD (Organization + WebSite), noindex בדומיין זמני.
- `src/components/` - Header, Footer, MobileBar, Logo, Icon (SVG בקו דק), RoofSection (חתך שכבות).
- `src/styles/global.css` - design tokens ("שכבות": אבן, ביטומן, בטון, נחושת), כפתורים, טבלת מפרט, FAQ.
- `src/pages/` - index, 404, robots.txt (דינמי לפי דומיין).
- **סטייל**: סגנונות scoped של Astro לא חלים על SVG מתוך `Icon` - להשתמש ב-`:global(svg)`.

## פקודות
- `npm run dev` / `npm run build` / `npm run preview`

## פריסה
- `git push origin main` -> GitHub Actions (`.github/workflows/deploy.yml`) בונה ומעלה ב-SSH/rsync להוסטינגר.
- Secrets נדרשים בריפו: `SSH_HOST`, `SSH_PORT`, `SSH_USERNAME`, `SSH_PRIVATE_KEY`, `SSH_REMOTE_DIR`.
- **דומיין זמני**: `orangered-goshawk-401694.hostingersite.com` (נוצר 2026-11-10). כל עוד האתר עליו: noindex (meta + X-Robots-Tag ב-.htaccess) ו-robots חוסם.
- **מעבר לדומיין אמיתי**: לעדכן `SITE_URL`/ברירת המחדל ב-`astro.config.mjs` וב-`business.ts`, ואת `SSH_REMOTE_DIR`.
- אינטגרציית ה-Git הנייטיבית של הוסטינגר חייבת להישאר מנותקת (היא דורסת את public_html בלי build).

## מצב נוכחי
- המשתמש בחר (2026-11-10) לדלג על שלבי האישור ולהעלות מהר בסיס + דף בית; התכנון (keyword-map, ערים, סילואים) רץ במקביל.
- ⏳ פרטי עסק חסרים - הכול placeholder. **החלטת המשתמש (2026-11-10): פרטי קשר יימסרו רק בסוף. עד אז מסיימים את כל האתר על הדומיין הזמני, והאתר נשאר חסום לגוגל.** לא לבקש פרטים בינתיים.
- ⏳ `docs/keyword-map.csv`, `src/data/cities.ts`, תבניות Hub/שירות/עיר, מנוע קישורים וסיידבר, טופס יצירת קשר.
