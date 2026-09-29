(function () {
  'use strict';

  const cfg = window.REPORT_CONFIG;
  const IL = window.ILLUST;
  const STORAGE_KEY = 'studentReport.v1';
  const REPORT_WIDTH = 760;
  const EXPORT_SCALE = 2;

  const $ = (id) => document.getElementById(id);
  const form = $('form');
  const report = $('report');

  const FIELDS = ['schoolName', 'studentName', 'honorific', 'avatar', 'currentStudy', 'goalWhen', 'goalWhat', 'teacherComment', 'parentAdvice'];
  const EMPTY_STUDENT = { studentName: '', honorific: 'さん', avatar: 'boy', currentStudy: '', goalWhen: '', goalWhat: '', teacherComment: '', parentAdvice: '' };

  /* ---------- イラストの差し込み ---------- */
  const illustrations = {
    ...IL.icons,
    heroKid: IL.heroKid,
    teacher: IL.teacher,
    parentChild: IL.parentChild,
    abacus: IL.abacus(200, 112, 9),
    abacusSmall: IL.abacus(96, 60, 6),
    avatarBoy: IL.avatar.boy,
    avatarGirl: IL.avatar.girl,
    logo: `<img src="${window.REPORT_LOGO}" alt="こどもスクール">`,
  };
  document.querySelectorAll('[data-illust]').forEach((el) => {
    el.innerHTML = illustrations[el.dataset.illust] || '';
  });

  /* ---------- 候補リスト・定型文 ---------- */
  function fillDatalist(id, items) {
    const list = $(id);
    items.forEach((v) => list.appendChild(new Option(v)));
  }
  fillDatalist('studyList', cfg.studySuggestions);
  fillDatalist('goalWhenList', cfg.goalWhenSuggestions);
  fillDatalist('goalWhatList', cfg.goalWhatSuggestions);

  const templateSets = { teacherComment: cfg.teacherCommentTemplates, parentAdvice: cfg.parentAdviceTemplates };
  document.querySelectorAll('.tpl-select').forEach((sel) => {
    sel.appendChild(new Option('＋ 定型文を追加', ''));
    templateSets[sel.dataset.target].forEach((group) => {
      const og = document.createElement('optgroup');
      og.label = group.group;
      group.items.forEach((text) => og.appendChild(new Option(text, text)));
      sel.appendChild(og);
    });
    sel.addEventListener('change', () => {
      if (!sel.value) return;
      const ta = form.elements[sel.dataset.target];
      const current = ta.value.replace(/\s+$/, '');
      ta.value = current ? current + '\n' + sel.value : sel.value;
      sel.value = '';
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      ta.focus();
      ta.setSelectionRange(ta.value.length, ta.value.length);
    });
  });

  document.querySelectorAll('[data-clear]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const ta = form.elements[btn.dataset.clear];
      ta.value = '';
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      ta.focus();
    });
  });

  /* ---------- フォームの読み書き ---------- */
  function readForm() {
    const data = {};
    FIELDS.forEach((k) => { data[k] = form.elements[k].value; });
    return data;
  }

  function writeForm(data) {
    FIELDS.forEach((k) => {
      if (data[k] !== undefined) form.elements[k].value = data[k];
    });
  }

  function loadSaved() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function saveDraft(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) { /* 保存できない環境では無視 */ }
  }

  /* ---------- プレビューへの反映 ---------- */
  function setText(el, value, placeholder) {
    const v = value.trim();
    el.textContent = v || placeholder;
    el.classList.toggle('is-empty', !v);
  }

  // 「珠算 8級」→ 表紙に「珠算」「8級」と2段で表示
  function splitStudy(text) {
    const m = text.trim().match(/^(.*?)\s*((?:準)?[0-9０-９一二三四五六七八九十初]+)\s*(級|段)$/);
    if (m && m[1]) return { top: m[1], num: m[2], unit: m[3] };
    return null;
  }

  function renderBook(study) {
    const line1 = $('rBook1');
    const line2 = $('rBook2');
    line2.textContent = '';
    const parts = splitStudy(study);
    if (parts) {
      line1.textContent = parts.top;
      line1.classList.remove('small');
      line2.append(parts.num);
      const unit = document.createElement('span');
      unit.className = 'unit';
      unit.textContent = parts.unit;
      line2.append(unit);
    } else {
      line1.textContent = study.trim() || 'そろばん';
      line1.classList.add('small');
    }
  }

  // 1行に収まらない場合は文字を小さくし、それでも入らなければ折り返す
  function fitText(el) {
    el.classList.remove('wrap');
    el.style.fontSize = '';
    const max = parseFloat(getComputedStyle(el).fontSize);
    const min = Math.round(max * 0.62);
    let size = max;
    while (el.scrollWidth > el.clientWidth + 0.5 && size > min) {
      size -= 1;
      el.style.fontSize = size + 'px';
    }
    if (el.scrollWidth > el.clientWidth + 0.5) el.classList.add('wrap');
  }

  function render() {
    const d = readForm();
    setText($('rSchool'), d.schoolName, '教室名');
    setText($('rName'), d.studentName, '生徒名');
    $('rHonorific').textContent = d.honorific;
    $('rAvatar').innerHTML = IL.avatar[d.avatar] || IL.avatar.boy;
    setText($('rStudy'), d.currentStudy, '珠算 〇級');
    renderBook(d.currentStudy);
    setText($('rGoalWhen'), d.goalWhen, '');
    $('rGoalWhen').hidden = !d.goalWhen.trim();
    setText($('rGoalWhat'), d.goalWhat, '〇級合格！');
    setText($('rComment'), d.teacherComment, '先生からのコメントを入力してください');
    setText($('rAdvice'), d.parentAdvice, 'お家の方へのお願い・アドバイスを入力してください');

    report.querySelectorAll('.fit').forEach(fitText);
    updateCounters(d);
    updateScale();
    saveDraft(d);
  }

  function updateCounters(d) {
    document.querySelectorAll('.counter').forEach((c) => {
      const len = d[c.dataset.for].replace(/\s/g, '').length;
      const softMax = Number(c.dataset.softMax);
      c.textContent = len > softMax ? `${len}文字（長めです。画像が縦に伸びます）` : `${len}文字`;
      c.classList.toggle('over', len > softMax);
    });
  }

  /* ---------- プレビューの縮小表示 ---------- */
  const frame = $('previewFrame');
  const holder = $('previewHolder');
  const scaler = $('previewScaler');

  function updateScale() {
    const cs = getComputedStyle(frame);
    const available = frame.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const scale = Math.min(1, available / REPORT_WIDTH);
    scaler.style.transform = `scale(${scale})`;
    holder.style.width = REPORT_WIDTH * scale + 'px';
    holder.style.height = report.offsetHeight * scale + 'px';
  }

  if ('ResizeObserver' in window) {
    new ResizeObserver(updateScale).observe(frame);
  } else {
    window.addEventListener('resize', updateScale);
  }

  /* ---------- 画像の書き出し ---------- */
  function fileName() {
    const name = form.elements.studentName.value.trim().replace(/[\s\\/:*?"<>|]+/g, '') || '生徒';
    const now = new Date();
    const ymd = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('');
    return `進捗レポート_${name}_${ymd}.png`;
  }

  function missingFields() {
    const d = readForm();
    const labels = { studentName: '生徒名', currentStudy: '現在の学習', goalWhat: '次の目標', teacherComment: '先生からのコメント', parentAdvice: 'お家の方へのお願い・アドバイス' };
    return Object.keys(labels).filter((k) => !d[k].trim()).map((k) => labels[k]);
  }

  function confirmReady() {
    const missing = missingFields();
    if (!missing.length) return true;
    return window.confirm(`次の項目が未入力です。\n・${missing.join('\n・')}\n\nこのまま画像を作成しますか？`);
  }

  async function renderCanvas() {
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    return window.html2canvas(report, {
      scale: EXPORT_SCALE,
      backgroundColor: '#fffdf8',
      logging: false,
      windowWidth: 1200,
      // 縮小表示の影響を受けないよう、複製したページではレポートだけを原寸で配置する
      onclone(doc) {
        const el = doc.getElementById('report');
        doc.body.replaceChildren(el);
        doc.body.style.margin = '0';
        doc.body.style.background = '#fffdf8';
      },
    });
  }

  function canvasToBlob(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('画像の作成に失敗しました'))), 'image/png');
    });
  }

  async function makeBlob() {
    const canvas = await renderCanvas();
    return canvasToBlob(canvas);
  }

  const buttons = [$('saveBtn'), $('copyBtn'), $('shareBtn')];
  async function withBusy(btn, busyLabel, task) {
    const label = btn.textContent;
    buttons.forEach((b) => { b.disabled = true; });
    btn.textContent = busyLabel;
    try {
      await task();
    } catch (err) {
      if (err && err.name === 'AbortError') return; // 共有をキャンセルした場合
      console.error(err);
      toast('画像の作成に失敗しました。もう一度お試しください。', true);
    } finally {
      btn.textContent = label;
      buttons.forEach((b) => { b.disabled = false; });
    }
  }

  $('saveBtn').addEventListener('click', () => {
    if (!confirmReady()) return;
    withBusy($('saveBtn'), '画像を作成中…', async () => {
      const blob = await makeBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName();
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      toast('PNG画像を保存しました');
    });
  });

  // スマホ：共有シートからLINEを選んでそのまま送信できる
  const canShareFiles = (() => {
    try {
      return !!(navigator.canShare && navigator.canShare({ files: [new File([''], 'test.png', { type: 'image/png' })] }));
    } catch (e) {
      return false;
    }
  })();
  if (canShareFiles) $('shareBtn').hidden = false;

  $('shareBtn').addEventListener('click', () => {
    if (!confirmReady()) return;
    withBusy($('shareBtn'), '画像を作成中…', async () => {
      const blob = await makeBlob();
      const file = new File([blob], fileName(), { type: 'image/png' });
      await navigator.share({ files: [file] });
    });
  });

  // パソコン：コピーしてLINEのトーク画面に貼り付け
  const canCopyImage = !!(navigator.clipboard && navigator.clipboard.write && window.ClipboardItem);
  if (canCopyImage) $('copyBtn').hidden = false;

  $('copyBtn').addEventListener('click', () => {
    if (!confirmReady()) return;
    withBusy($('copyBtn'), 'コピー中…', async () => {
      // Safari対策：クリック直後に ClipboardItem を作り、中身は Promise で渡す
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': makeBlob() })]);
      toast('画像をコピーしました。LINEのトーク画面に貼り付けてください');
    });
  });

  /* ---------- クリア・記入例 ---------- */
  $('clearBtn').addEventListener('click', () => {
    if (!window.confirm('入力内容をクリアして、次の生徒のレポートを作成しますか？\n（教室名はそのまま残ります）')) return;
    writeForm(EMPTY_STUDENT);
    render();
    form.elements.studentName.focus();
  });

  $('sampleBtn').addEventListener('click', () => {
    writeForm(cfg.sample);
    render();
  });

  /* ---------- 通知 ---------- */
  let toastTimer = 0;
  function toast(message, isError) {
    const el = $('toast');
    el.textContent = message;
    el.classList.toggle('error', !!isError);
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
  }

  /* ---------- 初期化 ---------- */
  const saved = loadSaved();
  writeForm(saved || { schoolName: cfg.defaultSchoolName, ...cfg.sample });
  if (!form.elements.schoolName.value.trim()) form.elements.schoolName.value = cfg.defaultSchoolName;

  form.addEventListener('input', render);
  form.addEventListener('change', render);
  render();

  // Webフォントの読み込み完了後に文字幅が変わるので再計算
  if (document.fonts) {
    document.fonts.ready.then(render);
    document.fonts.addEventListener && document.fonts.addEventListener('loadingdone', render);
  }
})();
