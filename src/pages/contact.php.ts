import type { APIRoute } from 'astro';
import { business } from '../config/business';

// מטפל טופס פנייה (PHP בהוסטינגר). עובד בלי JavaScript: POST -> מייל -> הפניה לעמוד תודה.
// הגנה: honeypot (שדה website), הגבלת קצב לפי IP, בדיקת טלפון בסיסית.
export const GET: APIRoute = () => {
  const to = business.email;
  const php = `<?php
// נוצר אוטומטית מ-src/pages/contact.php.ts - לא לערוך כאן
header('X-Robots-Tag: noindex');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { header('Location: /contact/', true, 303); exit; }
$back = '/contact/';
function clean($v, $max) { $v = trim(strip_tags((string)$v)); $v = str_replace(["\\r", "\\n"], ' ', $v); return mb_substr($v, 0, $max); }
// honeypot: בוט ממלא את השדה הנסתר
if (!empty($_POST['website'])) { header('Location: /thanks/', true, 303); exit; }
$name = clean($_POST['name'] ?? '', 80);
$phone = clean($_POST['phone'] ?? '', 30);
$msg = trim(strip_tags((string)($_POST['message'] ?? '')));
$msg = mb_substr($msg, 0, 2000);
$page = clean($_POST['page'] ?? '', 200);
$digits = preg_replace('/\\D/', '', $phone);
if ($name === '' || strlen($digits) < 9 || strlen($digits) > 13) { header('Location: ' . $back . '?error=1#form', true, 303); exit; }
// הגבלת קצב: עד 5 פניות ב-10 דקות לכל IP
$ip = $_SERVER['REMOTE_ADDR'] ?? '0';
$f = sys_get_temp_dir() . '/bh_rate_' . md5($ip);
$now = time(); $hits = [];
if (is_file($f)) { $hits = array_filter(explode(',', (string)file_get_contents($f)), fn($t) => $now - (int)$t < 600); }
if (count($hits) >= 5) { header('Location: ' . $back . '?error=2#form', true, 303); exit; }
$hits[] = $now; @file_put_contents($f, implode(',', $hits));
$host = preg_replace('/[^a-z0-9.\\-]/i', '', $_SERVER['HTTP_HOST'] ?? 'localhost');
$to = ${JSON.stringify(to)};
$subject = '=?UTF-8?B?' . base64_encode('פנייה חדשה מהאתר: ' . $name) . '?=';
$body = "פנייה חדשה מאתר בית האיטום\\n\\nשם: $name\\nטלפון: $phone\\nעמוד: $page\\n\\nהודעה:\\n$msg\\n";
$headers = "From: =?UTF-8?B?" . base64_encode('בית האיטום - אתר') . "?= <no-reply@$host>\\r\\nContent-Type: text/plain; charset=UTF-8\\r\\nContent-Transfer-Encoding: 8bit\\r\\nMIME-Version: 1.0\\r\\n";
$ok = @mail($to, $subject, $body, $headers);
header('Location: ' . ($ok ? '/thanks/' : $back . '?error=3#form'), true, 303);
`;
  return new Response(php, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
