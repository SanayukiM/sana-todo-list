# 進捗レポート作成ツール（そろばん教室・保護者向け）

生徒ごとに変わる項目だけを入力すると、パステルカラーの縦長レポート画像がプレビューに自動で反映され、
そのまま **PNG画像として保存 → LINEで保護者に送信** できるツールです。

- ツール本体: [`student-report/index.html`](student-report/index.html)
- サーバー不要・インストール不要（HTMLファイルをブラウザで開くだけ）
- 入力した内容はブラウザ内だけで処理され、外部には送信されません

## 入力する項目

| 項目 | 入力方法 |
| --- | --- |
| 生徒名 | 自由入力＋敬称（さん／くん／ちゃん／なし）＋イラスト（男の子／女の子） |
| 現在の学習 | 自由入力（「珠算 8級」などの候補から選択も可） |
| 次の目標 | 「時期（例：11月に）」＋「目標（例：7級合格！）」 |
| 先生からのコメント | **定型文プルダウン＋自由入力**（選ぶと追記され、あとから自由に書き換え可） |
| お家の方へのお願い・アドバイス | **定型文プルダウン＋自由入力** |

教室名は「教室の設定」から変更でき、ブラウザに保存されます。
入力途中の内容も自動で保存されるので、ページを閉じても消えません。

## 使い方

1. `student-report/index.html` をブラウザ（Chrome / Safari / Edge）で開く
2. 左の入力欄を埋める。右のプレビューにその場で反映されます
3. 保存・送信
   - **パソコン**: 「画像をコピー」→ LINEのトーク画面に貼り付け、または「PNGで保存」
   - **スマホ**: 「共有（LINEなど）」→ LINEを選んで送信、または「PNGで保存」
4. 次の生徒は「入力をクリアして次の生徒へ」を押す（教室名は残ります）

保存される画像は横1520pxの高解像度PNGです（ファイル名例: `進捗レポート_山田太郎_20260929.png`）。

### 先生たちにURLで配る場合（GitHub Pages）

リポジトリの Settings → Pages で `main` ブランチ / `/(root)` を公開すると、
`https://<ユーザー名>.github.io/sana-todo-list/student-report/` で誰でも開けるようになります。
（※ 非公開リポジトリで Pages を使うには GitHub の有料プランが必要です）

## 定型文・候補を編集したいとき

[`student-report/js/config.js`](student-report/js/config.js) だけを編集すればOKです。

- `teacherCommentTemplates` … 先生からのコメントの定型文（グループごと）
- `parentAdviceTemplates` … お家の方へのアドバイスの定型文
- `studySuggestions` / `goalWhenSuggestions` / `goalWhatSuggestions` … 入力候補
- `defaultSchoolName` … 教室名の初期値
- `sample` … 初回表示時の記入例

## ファイル構成

```
student-report/
├── index.html            入力フォーム＋レポートの固定デザイン（あいさつ文などの固定文言もここ）
├── css/app.css           入力画面のスタイル
├── css/report.css        レポート画像のデザイン（幅760px固定）
├── js/config.js          定型文・候補リスト・記入例
├── js/illustrations.js   イラスト（すべてSVG。画像ファイル不要）
├── js/app.js             入力→プレビュー反映、PNG保存・コピー・共有
└── vendor/html2canvas.min.js  画面をPNG化するライブラリ（MIT License）
```

フォントは Google Fonts の「M PLUS Rounded 1c」を読み込んでいます（インターネット接続時）。
