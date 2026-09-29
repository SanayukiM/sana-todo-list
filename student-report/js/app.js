/*
 * 進捗レポート作成ツール（共通部分）
 * 入力 → プレビュー反映、コース切り替え、下書き保存、画像化までを担当します。
 * 「保存」「コピー」ボタンの動きは環境ごとに別ファイルです：
 *   ・js/actions-web.js … index.html を直接開く／GitHub Pages
 *   ・artifact/actions-artifact.js … Claude の Artifact
 */
(function () {
  'use strict';

  const COURSES = window.REPORT_COURSES;
  const IL = window.ILLUST;
  const REPORT_WIDTH = 760;
  const EXPORT_SCALE = 2;
  const COURSE_KEY = 'studentReport.course';
  const LEGACY_DRAFT_KEY = 'studentReport.v1'; // コース追加前の下書き（そろばん）
  const draftKey = (course) => 'studentReport.v2.' + course;

  const $ = (id) => document.getElementById(id);
  const form = $('form');
  const report = $('report');

  const FIELDS = ['schoolName', 'studentName', 'honorific', 'avatar', 'currentStudy', 'goalWhen', 'goalWhat', 'teacherComment', 'parentAdvice'];
  const EMPTY_STUDENT = { studentName: '', honorific: 'さん', avatar: 'boy', currentStudy: '', goalWhen: '', goalWhat: '', teacherComment: '', parentAdvice: '' };

  const store = {
    get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* 保存できない環境では無視 */ } },
  };

  /* ---------- コースに関係なく同じイラスト ---------- */
  const staticIllust = {
    ...IL.icons,
    teacher: IL.teacher,
    avatarBoy: IL.avatar.boy,
    avatarGirl: IL.avatar.girl,
    logo: `<img src="${window.REPORT_LOGO}" alt="こどもスクール">`,
  };
  document.querySelectorAll('[data-illust]').forEach((el) => {
    el.innerHTML = staticIllust[el.dataset.illust] || '';
  });

  /* ---------- コース（そろばん／かきかた書道） ---------- */
  let course = null;
  const C = () => COURSES[course];

  function fillDatalist(id, items) {
    const list = $(id);
    list.replaceChildren(...items.map((v) => new Option(v)));
  }

  function fillTemplates() {
    const sets = { teacherComment: C().teacherCommentTemplates, parentAdvice: C().parentAdviceTemplates };
    document.querySelectorAll('.tpl-select').forEach((sel) => {
      sel.replaceChildren(new Option('＋ 定型文を追加', ''));
      sets[sel.dataset.target].forEach((group) => {
        const og = document.createElement('optgroup');
        og.label = group.group;
        group.items.forEach((text) => og.appendChild(new Option(text, text)));
        sel.appendChild(og);
      });
    });
  }

  // コースに合わせて、イラスト・しめくくりの文・候補・定型文を差し替える
  function applyCourse(key) {
    course = COURSES[key] ? key : 'soroban';
    const c = C();
    document.querySelectorAll('[data-slot]').forEach((el) => {
      el.innerHTML = IL[c.illustrations[el.dataset.slot]] || '';
    });
    $('rMessageMain').innerHTML = c.closing.main;
    $('rMessageSub').textContent = c.closing.sub;
    fillDatalist('studyList', c.studySuggestions);
    fillDatalist('goalWhenList', c.goalWhenSuggestions);
    fillDatalist('goalWhatList', c.goalWhatSuggestions);
    fillTemplates();
    const title = $('toolTitle');
    if (title) title.textContent = c.toolTitle;
    document.querySelectorAll('input[name="course"]').forEach((r) => { r.checked = r.value === course; });
    document.documentElement.dataset.course = course;
  }

  function initialData(key) {
    return { schoolName: COURSES[key].defaultSchoolName, ...COURSES[key].sample };
  }

  function loadDraft(key) {
    const raw = store.get(draftKey(key)) || (key === 'soroban' ? store.get(LEGACY_DRAFT_KEY) : null);
    try { return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  }

  function switchCourse(key) {
    if (!COURSES[key] || key === course) return;
    if (course) store.set(draftKey(course), JSON.stringify(readForm()));
    applyCourse(key);
    store.set(COURSE_KEY, course);
    writeForm(loadDraft(course) || initialData(course));
    if (!form.elements.schoolName.value.trim()) form.elements.schoolName.value = C().defaultSchoolName;
    render();
  }

  document.querySelectorAll('input[name="course"]').forEach((r) => {
    r.addEventListener('change', () => { if (r.checked) switchCourse(r.value); });
  });

  // リンクの末尾に #shodo / #soroban を付けると、そのコースで開く
  const hashCourse = () => (COURSES[location.hash.slice(1)] ? location.hash.slice(1) : null);
  window.addEventListener('hashchange', () => { if (hashCourse()) switchCourse(hashCourse()); });

  /* ---------- 定型文の追加・クリア ---------- */
  document.querySelectorAll('.tpl-select').forEach((sel) => {
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
      line1.textContent = study.trim() || C().label;
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

  // 名前：1割以上縮めないと入らないときは、敬称を2行目に回してから縮める
  function fitName() {
    const box = $('rNameBox');
    const shrunk = parseFloat(box.style.fontSize) < 25;
    if (!shrunk && !box.classList.contains('wrap')) return;
    box.classList.add('stack');
    fitText(box);
  }

  function render() {
    const d = readForm();
    setText($('rSchool'), d.schoolName, '教室名');
    setText($('rName'), d.studentName, '生徒名');
    $('rNameBox').classList.remove('stack');
    $('rHonorific').textContent = d.honorific;
    $('rAvatar').innerHTML = IL.avatar[d.avatar] || IL.avatar.boy;
    setText($('rStudy'), d.currentStudy, C().sample.currentStudy.replace(/[0-9０-９]+/, '〇'));
    renderBook(d.currentStudy);
    setText($('rGoalWhen'), d.goalWhen, '');
    $('rGoalWhen').hidden = !d.goalWhen.trim();
    setText($('rGoalWhat'), d.goalWhat, '目標を入力');
    setText($('rComment'), d.teacherComment, '先生からのコメントを入力してください');
    setText($('rAdvice'), d.parentAdvice, 'お家の方へのお願い・アドバイスを入力してください');

    report.querySelectorAll('.fit').forEach(fitText);
    fitName();
    updateCounters(d);
    updateScale();
    store.set(draftKey(course), JSON.stringify(d));
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

  /* ---------- ダイアログ（ブラウザ標準の confirm の代わり） ---------- */
  const modal = $('modal');
  let closeModal = null;

  // actions: [{ label, kind, value, onClick }] → 押されたボタンの value（閉じたら null）で解決
  function ask({ title, body, actions, wide }) {
    if (closeModal) closeModal(null);
    return new Promise((resolve) => {
      const lastFocus = document.activeElement;
      $('modalTitle').textContent = title;
      const bodyEl = $('modalBody');
      bodyEl.replaceChildren();
      if (typeof body === 'string') bodyEl.textContent = body;
      else if (body) bodyEl.append(body);
      $('modalCard').classList.toggle('wide', !!wide);
      const bar = $('modalActions');
      bar.replaceChildren();
      actions.forEach((a) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'btn ' + (a.kind || 'ghost');
        b.textContent = a.label;
        b.addEventListener('click', () => {
          if (a.onClick) a.onClick();
          done(a.value);
        });
        bar.append(b);
      });
      function onKey(e) { if (e.key === 'Escape') done(null); }
      function onBackdrop(e) { if (e.target === modal) done(null); }
      function done(value) {
        modal.hidden = true;
        document.removeEventListener('keydown', onKey);
        modal.removeEventListener('click', onBackdrop);
        closeModal = null;
        if (lastFocus && lastFocus.focus) lastFocus.focus();
        resolve(value);
      }
      closeModal = done;
      document.addEventListener('keydown', onKey);
      modal.addEventListener('click', onBackdrop);
      modal.hidden = false;
      const primary = bar.querySelector('.btn.primary, .btn.danger') || bar.querySelector('.btn');
      if (primary) primary.focus();
    });
  }

  function missingFields() {
    const d = readForm();
    const labels = { studentName: '生徒名', currentStudy: '現在の学習', goalWhat: '次の目標', teacherComment: '先生からのコメント', parentAdvice: 'お家の方へのお願い・アドバイス' };
    return Object.keys(labels).filter((k) => !d[k].trim()).map((k) => labels[k]);
  }

  // 未入力があれば確認。onProceed はボタンのクリック中に呼ぶ（コピーは操作直後でないと許可されないため）
  function whenReady(onProceed) {
    const missing = missingFields();
    if (!missing.length) return onProceed();
    const body = document.createElement('div');
    body.append('次の項目が未入力です。');
    const ul = document.createElement('ul');
    missing.forEach((m) => { const li = document.createElement('li'); li.textContent = m; ul.append(li); });
    body.append(ul);
    ask({
      title: 'このまま画像を作成しますか？',
      body,
      actions: [
        { label: '入力に戻る', kind: 'ghost', value: false },
        { label: 'このまま作成', kind: 'primary', value: true, onClick: onProceed },
      ],
    });
  }

  /* ---------- 画像の書き出し ---------- */
  function fileName() {
    const name = form.elements.studentName.value.trim().replace(/[\s\\/:*?"<>|]+/g, '') || '生徒';
    const now = new Date();
    const ymd = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('');
    return `進捗レポート_${name}_${ymd}.png`;
  }

  async function renderCanvas() {
    if (!window.html2canvas) throw new Error('html2canvas が読み込まれていません');
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    return window.html2canvas(report, {
      scale: EXPORT_SCALE,
      backgroundColor: '#fffdf8',
      logging: false,
      windowWidth: 1200,
      // 縮小表示の影響を受けないよう、複製したページではレポートだけを原寸で配置する
      onclone(doc) {
        const el = doc.getElementById('report');
        // Artifact ではスタイルが body 内にあるので、先に head へ移してから中身を差し替える
        doc.querySelectorAll('body style, body link[rel="stylesheet"]').forEach((node) => doc.head.append(node));
        doc.body.replaceChildren(el);
        doc.body.style.margin = '0';
        doc.body.style.padding = '0';
        doc.body.style.background = '#fffdf8';
        doc.documentElement.style.padding = '0';
      },
    });
  }

  async function renderBlob() {
    const canvas = await renderCanvas();
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('画像の作成に失敗しました'))), 'image/png');
    });
  }

  /* ---------- 通知 ---------- */
  let toastTimer = 0;
  function toast(message, isError) {
    const el = $('toast');
    el.textContent = message;
    el.classList.toggle('error', !!isError);
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3600);
  }

  /* ---------- クリア・記入例 ---------- */
  $('clearBtn').addEventListener('click', async () => {
    const ok = await ask({
      title: '入力内容をクリアしますか？',
      body: '次の生徒のレポートを作成できるよう、入力欄を空にします。教室名はそのまま残ります。',
      actions: [
        { label: 'キャンセル', kind: 'ghost', value: false },
        { label: 'クリアする', kind: 'danger', value: true },
      ],
    });
    if (!ok) return;
    writeForm(EMPTY_STUDENT);
    render();
    form.elements.studentName.focus();
  });

  $('sampleBtn').addEventListener('click', () => {
    writeForm(C().sample);
    render();
  });

  /* ---------- 初期化 ---------- */
  const startCourse = hashCourse() || store.get(COURSE_KEY) || window.REPORT_DEFAULT_COURSE || 'soroban';
  applyCourse(startCourse);
  writeForm(loadDraft(course) || initialData(course));
  if (!form.elements.schoolName.value.trim()) form.elements.schoolName.value = C().defaultSchoolName;

  form.addEventListener('input', (e) => { if (e.target.name !== 'course') render(); });
  form.addEventListener('change', (e) => { if (e.target.name !== 'course') render(); });
  form.addEventListener('submit', (e) => e.preventDefault());
  render();

  // Webフォントの読み込み完了後に文字幅が変わるので再計算
  if (document.fonts) {
    document.fonts.ready.then(render);
    if (document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', render);
  }

  /* ---------- 保存ボタン用・一括作成スクリプト用の入口 ---------- */
  window.ReportTool = {
    courses: Object.keys(COURSES),
    getCourse: () => course,
    setCourse: switchCourse,
    // 1人分のデータを入れてプレビューを更新（省略した項目は空欄）
    fill(data) {
      writeForm({ ...EMPTY_STUDENT, ...data });
      render();
    },
    read: readForm,
    render,
    // 文字の縮小・折り返し状況（一括作成時のチェック用）
    inspect() {
      return [...report.querySelectorAll('.fit')].filter((e) => !e.hidden).map((e) => ({
        id: e.id,
        fontSize: parseFloat(getComputedStyle(e).fontSize),
        wrapped: e.classList.contains('wrap'),
        stacked: e.classList.contains('stack'),
        text: e.textContent,
      }));
    },
    missingFields,
    whenReady,
    fileName,
    renderBlob,
    async exportDataUrl() {
      const canvas = await renderCanvas();
      return canvas.toDataURL('image/png');
    },
    ask,
    toast,
  };
})();
