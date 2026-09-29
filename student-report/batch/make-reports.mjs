/*
 * 生徒の一覧（CSV）から、進捗レポート画像をまとめて作るスクリプト
 *
 *   node student-report/batch/make-reports.mjs 生徒一覧.csv [--out 出力フォルダ] [--date 20261001]
 *
 * ・CSV の列は template.csv を参照（1行目が見出し。列の順番は自由）
 * ・画像は「出力フォルダ/教室名/進捗レポート_名前_日付.png」に保存
 * ・教室ごとに確認用の一覧画像（_一覧_1.png …）と、注意点をまとめた「確認リスト.csv」も作る
 * ・画面のツール（index.html）をそのまま使って画像化するので、見た目は手作業で保存したものと同じ
 *
 * 必要なもの：Node.js 18 以上、Playwright（npm install -g playwright → npx playwright install chromium）
 * 生徒の個人情報を含むので、CSV と出力フォルダは GitHub に入れないこと（.gitignore 済み：batch/input/ と batch/out/）
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

// プロキシ環境（HTTPS_PROXY）では、Node の fetch がプロキシを使うように自分自身を起動し直す
if (process.env.HTTPS_PROXY && !process.env.NODE_USE_ENV_PROXY) {
  const r = spawnSync(process.execPath, process.argv.slice(1), { stdio: 'inherit', env: { ...process.env, NODE_USE_ENV_PROXY: '1', NODE_NO_WARNINGS: '1' } });
  process.exit(r.status ?? 1);
}

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TOOL = path.resolve(HERE, '..', 'index.html');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

/* ---------- 引数 ---------- */
const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args.splice(i, 2)[1] : undefined; };
const today = new Date();
const DATE = opt('--date') || [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'), String(today.getDate()).padStart(2, '0')].join('');
const OUT = path.resolve(opt('--out') || path.join(HERE, 'out', DATE));
const INPUT = args[0];
if (!INPUT) {
  console.error('使い方: node student-report/batch/make-reports.mjs 生徒一覧.csv [--out 出力フォルダ] [--date 20261001]');
  process.exit(1);
}

/* ---------- Playwright の読み込み（ローカル → グローバルの順に探す） ---------- */
async function loadPlaywright() {
  try { return await import('playwright'); } catch (e) { /* 次へ */ }
  try {
    const root = execSync('npm root -g', { encoding: 'utf8' }).trim();
    return await import(pathToFileURL(path.join(root, 'playwright', 'index.mjs')).href);
  } catch (e) {
    console.error('Playwright が見つかりません。「npm install -g playwright」と「npx playwright install chromium」を実行してください。');
    process.exit(1);
  }
}

/* ---------- CSV の読み込み（UTF-8 / Shift_JIS 両対応） ---------- */
function decode(buf) {
  try { return new TextDecoder('utf-8', { fatal: true }).decode(buf).replace(/^﻿/, ''); } catch (e) { /* Excel の「CSV」形式 */ }
  return new TextDecoder('shift_jis').decode(buf);
}

function parseCsv(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += ch;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

// 見出しの言い換えも受け付ける
const HEADERS = {
  schoolName: ['教室名', '教室'],
  course: ['コース'],
  studentName: ['名前', '生徒名'],
  honorific: ['敬称'],
  avatar: ['イラスト'],
  currentStudy: ['現在の学習', '現在のテキスト'],
  goalWhen: ['目標の時期'],
  goalWhat: ['目標', '次の目標'],
  status: ['現在の状況'],
  plan: ['今後の目標'],
  teacherComment: ['先生からのコメント'],
  parentAdvice: ['ご家庭へのお願い', 'お家の方へのお願い', 'お家の方へのお願い・アドバイス'],
};

function toCourse(v) {
  const s = (v || '').trim();
  if (!s || /そろばん|珠算|soroban/i.test(s)) return 'soroban';
  if (/書道|かきかた|書写|硬筆|毛筆|shodo/i.test(s)) return 'shodo';
  return null;
}

function readStudents(file) {
  const raw = fs.readFileSync(file);
  if (file.toLowerCase().endsWith('.json')) return JSON.parse(decode(raw)).map((s, i) => ({ line: i + 1, ...s }));
  const [head, ...rows] = parseCsv(decode(raw));
  const col = {};
  head.forEach((h, i) => {
    const key = Object.keys(HEADERS).find((k) => HEADERS[k].includes(h.trim()));
    if (key) col[key] = i;
  });
  if (col.studentName === undefined) throw new Error('CSV に「名前」の列がありません。template.csv の見出しを使ってください。');
  return rows.map((r, i) => {
    const get = (k) => (col[k] === undefined ? '' : (r[col[k]] || '').trim());
    const honorific = get('honorific') === 'なし' ? '' : (get('honorific') || 'さん');
    const avatarText = get('avatar');
    const avatar = /女/.test(avatarText) || avatarText === 'girl' ? 'girl'
      : /男/.test(avatarText) || avatarText === 'boy' ? 'boy'
      : honorific === 'ちゃん' ? 'girl' : 'boy';
    return {
      line: i + 2,
      course: get('course'),
      schoolName: get('schoolName'),
      studentName: get('studentName'),
      honorific,
      avatar,
      currentStudy: get('currentStudy'),
      goalWhen: get('goalWhen'),
      goalWhat: get('goalWhat'),
      teacherComment: get('teacherComment') || [get('status'), get('plan')].filter(Boolean).join('\n'),
      parentAdvice: get('parentAdvice'),
    };
  }).filter((s) => s.studentName);
}

/* ---------- 確認用の一覧画像 ---------- */
async function contactSheets(browser, dir, files) {
  const PER = 12;
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const sheets = [];
  for (let i = 0; i < files.length; i += PER) {
    const items = files.slice(i, i + PER).map((f) =>
      `<figure><img src="data:image/png;base64,${fs.readFileSync(path.join(dir, f)).toString('base64')}"><figcaption>${f.replace(/^進捗レポート_|_\d{8}\.png$/g, '')}</figcaption></figure>`).join('');
    await page.setContent(`<style>body{margin:0;padding:16px;background:#ddd;font:20px sans-serif;display:grid;grid-template-columns:repeat(6,1fr);gap:14px;align-items:start}figure{margin:0}img{width:100%;display:block;background:#fff}figcaption{padding:4px 2px}</style>${items}`);
    await page.waitForFunction(() => [...document.images].every((im) => im.complete));
    const name = `_一覧_${sheets.length + 1}.png`;
    await page.screenshot({ path: path.join(dir, name), fullPage: true });
    sheets.push(name);
  }
  await page.close();
  return sheets;
}

/* ---------- メイン ---------- */
const students = readStudents(INPUT);
if (!students.length) { console.error('生徒のデータがありません。'); process.exit(1); }

const { chromium } = await loadPlaywright();
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, userAgent: UA });
// Google Fonts は Node 経由で取得（社内プロキシ等でブラウザから直接読めない環境でもフォントが崩れないように）
await context.route(/fonts\.(googleapis|gstatic)\.com/, async (route) => {
  try {
    const r = await fetch(route.request().url(), { headers: { 'user-agent': UA } });
    await route.fulfill({ status: r.status, body: Buffer.from(await r.arrayBuffer()), headers: { 'content-type': r.headers.get('content-type') || '', 'access-control-allow-origin': '*' } });
  } catch (e) { await route.abort(); }
});
const page = await context.newPage();
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(e.message));
await page.goto(pathToFileURL(TOOL).href, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
const fontOk = await page.evaluate(() => [...document.fonts].some((f) => f.family.includes('M PLUS Rounded 1c') && f.status === 'loaded'));
if (!fontOk) console.warn('⚠ フォント（M PLUS Rounded 1c）を読み込めませんでした。インターネット接続を確認してください。');

fs.mkdirSync(OUT, { recursive: true });
const results = [];
const usedNames = new Map();
for (const s of students) {
  const course = toCourse(s.course);
  const notes = [];
  if (!course) { notes.push(`コース「${s.course}」が不明なため、そろばんで作成`); }
  const { line, course: _c, ...data } = s;
  await page.evaluate(([c, d]) => {
    window.ReportTool.setCourse(c);
    // 教室名が空ならコースの初期値（例：十軒そろばん教室）
    window.ReportTool.fill({ ...d, schoolName: d.schoolName || window.REPORT_COURSES[c].defaultSchoolName });
  }, [course || 'soroban', data]);
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => window.ReportTool.render());
  const info = await page.evaluate(() => ({ fits: window.ReportTool.inspect(), missing: window.ReportTool.missingFields(), school: window.ReportTool.read().schoolName }));

  if (info.missing.length) notes.push('未入力: ' + info.missing.join('・'));
  for (const f of info.fits) {
    const label = { rSchool: '教室名', rNameBox: '名前', rStudy: '現在の学習', rGoalWhen: '目標の時期', rGoalWhatBox: '目標' }[f.id];
    if (!label) continue;
    if (f.wrapped) notes.push(`${label}が長く2行に折り返し`);
    else if ((f.id === 'rNameBox' && f.fontSize < 22) || (f.id !== 'rNameBox' && f.fontSize < 20)) notes.push(`${label}が長く文字が小さい（${f.fontSize}px）`);
  }
  if (data.teacherComment.replace(/\s/g, '').length > 220) notes.push('先生からのコメントがかなり長い');

  const school = (info.school || '教室名なし').replace(/[\\/:*?"<>|]/g, '');
  const dir = path.join(OUT, school);
  fs.mkdirSync(dir, { recursive: true });
  const base = data.studentName.replace(/[\s\\/:*?"<>|]+/g, '');
  const key = school + '/' + base;
  const n = (usedNames.get(key) || 0) + 1;
  usedNames.set(key, n);
  const file = `進捗レポート_${base}${n > 1 ? '_' + n : ''}_${DATE}.png`;
  if (n > 1) notes.push('同じ教室に同じ名前がいるため番号付きのファイル名');

  const dataUrl = await page.evaluate(() => window.ReportTool.exportDataUrl());
  fs.writeFileSync(path.join(dir, file), Buffer.from(dataUrl.split(',')[1], 'base64'));
  results.push({ line, school, name: data.studentName, file, notes });
  console.log(`${notes.length ? '⚠' : '✓'} ${school} / ${data.studentName}${notes.length ? '  … ' + notes.join('、') : ''}`);
}

// 教室ごとの一覧画像
for (const school of [...new Set(results.map((r) => r.school))]) {
  const dir = path.join(OUT, school);
  const files = results.filter((r) => r.school === school).map((r) => r.file);
  await contactSheets(browser, dir, files);
}

// 確認リスト（Excel で開けるよう BOM 付き UTF-8）
const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
const csv = ['行,教室名,名前,ファイル,注意', ...results.map((r) => [r.line, r.school, r.name, r.file, r.notes.join('／')].map(esc).join(','))].join('\r\n');
fs.writeFileSync(path.join(OUT, '確認リスト.csv'), '﻿' + csv + '\r\n');

await browser.close();
const warned = results.filter((r) => r.notes.length).length;
console.log(`\n${results.length}人分を作成しました（注意あり ${warned}人）→ ${OUT}`);
if (pageErrors.length) console.warn('ページのエラー:', pageErrors.join(' | '));
