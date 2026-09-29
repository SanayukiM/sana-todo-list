/*
 * 保存・コピーボタン（Claude の Artifact 用）
 * Artifact では通常のダウンロードや共有シートが使えないため、
 * Artifact の「ダウンロード」機能を使い、使えない場合は完成画像を表示して長押し／右クリックで保存してもらう。
 */
(function () {
  'use strict';

  const T = window.ReportTool;
  const $ = (id) => document.getElementById(id);
  const buttons = [$('saveBtn'), $('copyBtn')];
  $('copyBtn').hidden = false;

  // 完成画像を表示する（ダイアログを閉じるのを待たずに戻るので、ボタンはすぐ元に戻る）
  let resultUrl = '';
  function showResult(blob, lead) {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    resultUrl = URL.createObjectURL(blob);
    const body = document.createElement('div');
    if (lead) {
      const p = document.createElement('p');
      p.style.margin = '0 0 8px';
      p.textContent = lead;
      body.append(p);
    }
    const img = document.createElement('img');
    img.className = 'result-img';
    img.src = resultUrl;
    img.alt = T.fileName();
    body.append(img);
    const steps = document.createElement('ul');
    steps.className = 'result-steps';
    ['スマホ：画像を長押し →「画像を保存」または「共有」からLINEへ', 'パソコン：画像を右クリック →「画像をコピー」してLINEのトークに貼り付け']
      .forEach((t) => { const li = document.createElement('li'); li.textContent = t; steps.append(li); });
    body.append(steps);
    T.ask({ title: '画像ができました', body, wide: true, actions: [{ label: '閉じる', kind: 'primary', value: true }] });
  }

  async function withBusy(btn, busyLabel, task) {
    const label = btn.textContent;
    buttons.forEach((b) => { b.disabled = true; });
    btn.textContent = busyLabel;
    try {
      await task();
    } catch (err) {
      console.error(err);
      T.toast('画像を作成できませんでした。通信状況を確認して、もう一度お試しください。', true);
    } finally {
      btn.textContent = label;
      buttons.forEach((b) => { b.disabled = false; });
    }
  }

  // html2canvas（cdnjs）が読み込めなかったときの予備
  function ensureHtml2canvas() {
    if (window.html2canvas) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
      s.onload = resolve;
      s.onerror = () => reject(new Error('画像作成の部品を読み込めませんでした'));
      document.head.append(s);
    });
  }
  const renderBlob = () => ensureHtml2canvas().then(T.renderBlob);

  // Artifact の「ダウンロード」機能（使えない環境では null）
  const downloadsPromise = window.claude && typeof window.claude.use === 'function'
    ? window.claude.use('downloads').catch(() => null)
    : Promise.resolve(null);

  function startSave() {
    withBusy($('saveBtn'), '画像を作成中…', async () => {
      const [blob, downloads] = await Promise.all([renderBlob(), downloadsPromise]);
      if (!downloads) {
        showResult(blob);
        return;
      }
      try {
        const res = await downloads.save({ filename: T.fileName(), data: blob });
        if (res && res.status === 'saved') T.toast('PNG画像を保存しました');
      } catch (err) {
        const code = err && err.code;
        if (code === 'declined') return;
        if (code === 'rate_limited') {
          T.toast('保存の確認がすでに開いています。そちらを先に操作してください。', true);
          return;
        }
        showResult(blob, 'この画面では直接保存できませんでした。下の画像から保存してください。');
      }
    });
  }

  function startCopy() {
    const canWrite = !!(navigator.clipboard && navigator.clipboard.write && window.ClipboardItem);
    withBusy($('copyBtn'), 'コピー中…', async () => {
      const blobPromise = renderBlob();
      if (!canWrite) {
        showResult(await blobPromise, 'この画面ではコピーできないため、画像を表示しました。');
        return;
      }
      try {
        // クリック直後に書き込みを始め、画像は Promise で渡す（Safari 対策）
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blobPromise })]);
        T.toast('画像をコピーしました。LINEのトーク画面に貼り付けてください');
      } catch (err) {
        showResult(await blobPromise, 'この画面ではコピーできないため、画像を表示しました。');
      }
    });
  }

  $('saveBtn').addEventListener('click', () => T.whenReady(startSave));
  $('copyBtn').addEventListener('click', () => T.whenReady(startCopy));
})();
