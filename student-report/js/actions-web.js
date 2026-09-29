/*
 * 保存・共有・コピーボタン（index.html を直接開く／GitHub Pages 用）
 * Artifact 用は artifact/actions-artifact.js です。
 */
(function () {
  'use strict';

  const T = window.ReportTool;
  const $ = (id) => document.getElementById(id);
  const buttons = [$('saveBtn'), $('shareBtn'), $('copyBtn')];

  async function withBusy(btn, busyLabel, task) {
    const label = btn.textContent;
    buttons.forEach((b) => { b.disabled = true; });
    btn.textContent = busyLabel;
    try {
      await task();
    } catch (err) {
      if (err && err.name === 'AbortError') return; // 共有をキャンセルした場合
      console.error(err);
      T.toast('画像の作成に失敗しました。もう一度お試しください。', true);
    } finally {
      btn.textContent = label;
      buttons.forEach((b) => { b.disabled = false; });
    }
  }

  function startSave() {
    withBusy($('saveBtn'), '画像を作成中…', async () => {
      const blob = await T.renderBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = T.fileName();
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      T.toast('PNG画像を保存しました');
    });
  }

  // スマホ：共有シートからLINEを選んでそのまま送信できる
  const canShareFiles = (() => {
    try {
      return !!(navigator.canShare && navigator.canShare({ files: [new File([''], 'test.png', { type: 'image/png' })] }));
    } catch (e) {
      return false;
    }
  })();
  if (canShareFiles) $('shareBtn').hidden = false;

  function startShare() {
    withBusy($('shareBtn'), '画像を作成中…', async () => {
      const blob = await T.renderBlob();
      await navigator.share({ files: [new File([blob], T.fileName(), { type: 'image/png' })] });
    });
  }

  // パソコン：コピーしてLINEのトーク画面に貼り付け
  const canCopyImage = !!(navigator.clipboard && navigator.clipboard.write && window.ClipboardItem);
  if (canCopyImage) $('copyBtn').hidden = false;

  function startCopy() {
    withBusy($('copyBtn'), 'コピー中…', async () => {
      // Safari対策：クリック直後に ClipboardItem を作り、中身は Promise で渡す
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': T.renderBlob() })]);
      T.toast('画像をコピーしました。LINEのトーク画面に貼り付けてください');
    });
  }

  $('saveBtn').addEventListener('click', () => T.whenReady(startSave));
  $('shareBtn').addEventListener('click', () => T.whenReady(startShare));
  $('copyBtn').addEventListener('click', () => T.whenReady(startCopy));
})();
