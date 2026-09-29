/*
 * Artifact 用の1ファイルHTMLを作るスクリプト
 *   node student-report/artifact/build.mjs
 * → student-report/artifact/dist/soroban.html（そろばん版）と shodo.html（かきかた書道版）
 *
 * index.html と css/・js/ をそのまま使い、Artifact の決まりに合わせて変換します：
 *   ・<html>/<head>/<body> は付けない（Artifact 側が付ける）
 *   ・CSS と JS は埋め込み。html2canvas だけ cdnjs から読み込む
 *   ・保存ボタンは artifact/actions-artifact.js（Artifact のダウンロード機能を使う）
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

const BUILDS = [
  { out: 'soroban.html', course: 'soroban', title: 'そろばん進捗レポート' },
  { out: 'shodo.html', course: 'shodo', title: 'かきかた書道 進捗レポート' },
];

const index = read('index.html');
const body = index.match(/<body>\n([\s\S]*?)\n<script src=/)[1];
const scriptSrcs = [...index.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);

const inlineScript = (code) => {
  if (/<\/script/i.test(code)) throw new Error('script に </script> が含まれています');
  return `<script>\n${code.trim()}\n</script>`;
};

fs.mkdirSync(path.join(HERE, 'dist'), { recursive: true });
for (const b of BUILDS) {
  const scripts = scriptSrcs.map((src) => {
    if (src === 'vendor/html2canvas.min.js') {
      return '<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>';
    }
    if (src === 'js/actions-web.js') return inlineScript(fs.readFileSync(path.join(HERE, 'actions-artifact.js'), 'utf8'));
    if (src === 'js/app.js') return inlineScript(`window.REPORT_DEFAULT_COURSE = '${b.course}';`) + '\n' + inlineScript(read(src));
    return inlineScript(read(src));
  });

  const html = [
    `<title>${b.title}</title>`,
    '<link rel="preconnect" href="https://fonts.googleapis.com">',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;500;700;800&display=swap">',
    `<style>\n${read('css/app.css').trim()}\n\n${read('css/report.css').trim()}\n</style>`,
    body.replace('<h1 class="app-title" id="toolTitle">進捗レポート</h1>', `<h1 class="app-title" id="toolTitle">${b.title}</h1>`),
    ...scripts,
    '',
  ].join('\n');

  if (/<(html|head|body)[\s>]/i.test(html)) throw new Error('<html>/<head>/<body> タグが残っています');
  fs.writeFileSync(path.join(HERE, 'dist', b.out), html);
  console.log(`${path.join('student-report/artifact/dist', b.out)}  ${(Buffer.byteLength(html) / 1024).toFixed(1)} KB`);
}
