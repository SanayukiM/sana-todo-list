# 進捗レポート作成ツール（こどもスクール・保護者向け）

生徒ごとに変わる項目だけを入力すると、パステルカラーの縦長レポート画像がプレビューに自動で反映され、
そのまま **PNG画像として保存 → LINEで保護者に送信** できるツールです。
**そろばん** と **かきかた書道** の2コースに対応しています。

| 使い方 | 場所 |
| --- | --- |
| 先生が1人ずつ作る（Claude の Artifact） | そろばん：https://claude.ai/artifact/12T76uME2ifBZMW1qGLNB5<br>かきかた書道：https://claude.ai/artifact/MyZpca6HXSvnVRjUSNBSwK |
| 先生が1人ずつ作る（ブラウザで直接開く） | [`student-report/index.html`](student-report/index.html)（末尾に `#shodo` を付けると書道で開く） |
| 何百人分をまとめて作る | [`student-report/batch/make-reports.mjs`](student-report/batch/make-reports.mjs)（下の「一括作成」） |

入力した内容はブラウザ内（または手元のPC内）だけで処理され、外部には送信されません。

## 入力する項目

| 項目 | 入力方法 |
| --- | --- |
| コース | そろばん／かきかた書道（イラスト・しめくくりの文・定型文・入力候補が切り替わる） |
| 生徒名 | 自由入力＋敬称（さん／くん／ちゃん／なし）＋イラスト（男の子／女の子）。長い名前は敬称を2行目に回して表示 |
| 現在の学習 | 自由入力（「ちびそろ3」「硬筆 8級」などの候補から選択も可） |
| 次の目標 | 「時期（例：11月に）」＋「目標（例：7級合格！）」 |
| 先生からのコメント | **定型文プルダウン＋自由入力** |
| お家の方へのお願い・アドバイス | **定型文プルダウン＋自由入力** |

教室名は「教室の設定」から変更でき、コースごとにブラウザに保存されます。入力途中の内容も自動で保存されます。

## 1人ずつ作る

1. Artifact のリンク、または `student-report/index.html` を開く
2. 上の切り替えでコースを選び、入力欄を埋める（右のプレビューにその場で反映）
3. 保存・送信
   - **パソコン**：「画像をコピー」→ LINEのトーク画面に貼り付け、または「PNGで保存」
   - **スマホ**：「共有（LINEなど）」→ LINE を選んで送信、または「PNGで保存」
     （Artifact 版は「PNGで保存」。iPhone の Claude アプリでは共有画面が開きます）
4. 次の生徒は「入力をクリアして次の生徒へ」

保存される画像は横1520pxの高解像度PNGです（ファイル名例：`進捗レポート_山田太郎_20260929.png`）。

## 一括作成（何百人分をまとめて）

生徒の一覧を CSV にして、スクリプトで全員分の画像を作ります。画面のツールをそのまま使うので、見た目は手作業で保存したものと同じです。

1. [`student-report/batch/template.csv`](student-report/batch/template.csv) を Excel／Googleスプレッドシートで開き、1人1行で記入

   | 列 | 内容 |
   | --- | --- |
   | 教室名 | 例：十軒そろばん教室（空欄ならコースの初期値） |
   | コース | そろばん／かきかた書道（空欄ならそろばん） |
   | 名前・敬称・イラスト | 敬称が空欄なら「さん」、イラストが空欄なら「ちゃん」は女の子・それ以外は男の子 |
   | 現在の学習 | 例：ちびそろ3、ドリル1、硬筆 8級 |
   | 目標の時期・目標 | 例：「小2の6月に」「10級受験！」 |
   | 現在の状況・今後の目標 | 2つをつなげて「先生からのコメント」になる（「先生からのコメント」列を作ればそちらを優先） |
   | ご家庭へのお願い | 「お家の方へのお願い・アドバイス」になる |

2. CSV で保存して `student-report/batch/input/` に置く（Excel の「CSV UTF-8」「CSV」どちらでも可）
3. 実行

   ```sh
   node student-report/batch/make-reports.mjs student-report/batch/input/生徒一覧.csv
   ```

4. `student-report/batch/out/日付/教室名/` に全員分の PNG ができる
   - `_一覧_1.png` …… 教室ごとの確認用の一覧（12人ずつ）
   - `確認リスト.csv` …… 未入力の項目、名前や目標が長くて文字が小さくなった生徒など、見直してほしい点

目安は 8人で約25秒（300人で約15分）。
必要なもの：Node.js 18 以上と Playwright（`npm install -g playwright` → `npx playwright install chromium`）。

> **個人情報の扱い**：`batch/input/`（生徒一覧）と `batch/out/`（画像）は `.gitignore` 済みで、GitHub には入りません。

## 定型文・候補を編集したいとき

- そろばん：[`student-report/js/config-soroban.js`](student-report/js/config-soroban.js)
- かきかた書道：[`student-report/js/config-shodo.js`](student-report/js/config-shodo.js)

どちらも同じ形で、定型文（`teacherCommentTemplates` / `parentAdviceTemplates`）、入力候補、記入例、教室名の初期値、しめくくりの文を持っています。

## Artifact 版の更新

`index.html` と `css/`・`js/` を変更したら、Artifact 用の1ファイルHTMLを作り直して公開します。

```sh
node student-report/artifact/build.mjs
# → student-report/artifact/dist/soroban.html（そろばん版）と shodo.html（書道版）
```

できたファイルを、上の Artifact の URL に公開し直します（Claude に「Artifact を更新して」と頼めばOK）。

## ファイル構成

```
student-report/
├── index.html               入力フォーム＋レポートの固定デザイン（あいさつ文などの固定文言もここ）
├── css/app.css              入力画面のスタイル（ライト／ダーク対応）
├── css/report.css           レポート画像のデザイン（幅760px固定）
├── js/config-soroban.js     そろばんの定型文・候補・記入例・しめくくりの文
├── js/config-shodo.js       かきかた書道の定型文・候補・記入例・しめくくりの文
├── js/illustrations.js      イラスト（すべてSVG。画像ファイル不要）
├── js/logo.js               こどもスクールのロゴ（PNGをデータとして埋め込み）
├── js/app.js                共通部分：入力→プレビュー反映、コース切り替え、画像化
├── js/actions-web.js        保存・共有・コピーボタン（直接開く／GitHub Pages 用）
├── artifact/
│   ├── actions-artifact.js  保存・コピーボタン（Artifact 用）
│   └── build.mjs            Artifact 用HTMLを作るスクリプト
├── batch/
│   ├── make-reports.mjs     CSV から全員分の画像をまとめて作るスクリプト
│   └── template.csv         生徒一覧のひな形
└── vendor/html2canvas.min.js  画面をPNG化するライブラリ（MIT License）
```

フォントは Google Fonts の「M PLUS Rounded 1c」を読み込んでいます（インターネット接続時）。
