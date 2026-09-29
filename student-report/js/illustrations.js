/*
 * レポート内のイラスト（すべてインラインSVG）
 * 画像ファイルを使わないので、PNG保存時に崩れたり外部読み込みで失敗したりしません。
 */
(function () {
  const C = {
    line: '#4a3528',
    skin: '#ffe3cd',
    cheek: '#ff9eaa',
    mouth: '#d9505f',
    tongue: '#ff8e9b',
    hairDark: '#3b2a22',
    hairBrown: '#6b4430',
    wood: '#8a5a33',
    woodDark: '#6b4426',
    bead: '#f2b84b',
    beadDark: '#b8801f',
    abacusBg: '#fff3d6',
  };

  const svg = (viewBox, body, cls = '') =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" class="${cls}" aria-hidden="true">${body}</svg>`;

  /* ---------- 顔パーツ（200x200 のローカル座標） ---------- */

  const hair = {
    boyFront: `
      <path d="M41 114 C33 62 62 34 100 34 C138 34 167 62 159 114 C154 98 148 88 140 82 L136 94 L124 78 L116 92 L104 76 L94 90 L84 76 L72 92 L66 80 C54 88 46 100 41 114 Z"
        fill="${C.hairDark}" stroke="${C.line}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M98 37 C93 22 104 13 117 16 C109 20 107 27 109 35 Z" fill="${C.hairDark}" stroke="${C.line}" stroke-width="4" stroke-linejoin="round"/>`,

    girlBack: `
      <circle cx="30" cy="124" r="20" fill="${C.hairBrown}" stroke="${C.line}" stroke-width="4"/>
      <circle cx="170" cy="124" r="20" fill="${C.hairBrown}" stroke="${C.line}" stroke-width="4"/>
      <path d="M40 124 C30 62 64 28 100 28 C136 28 170 62 160 124 Z" fill="${C.hairBrown}" stroke="${C.line}" stroke-width="4" stroke-linejoin="round"/>`,
    girlFront: `
      <path d="M43 108 C40 60 66 36 100 36 C134 36 160 60 157 108 C151 88 141 77 128 72 C120 82 108 86 95 84 C99 80 101 76 101 72 C89 80 74 86 60 86 C52 92 46 100 43 108 Z"
        fill="${C.hairBrown}" stroke="${C.line}" stroke-width="4" stroke-linejoin="round"/>
      <circle cx="46" cy="104" r="7" fill="#ff7f9c" stroke="${C.line}" stroke-width="3"/>
      <circle cx="154" cy="104" r="7" fill="#ff7f9c" stroke="${C.line}" stroke-width="3"/>`,

    teacherBack: `
      <path d="M52 78 C14 72 4 116 16 150 C21 164 30 172 38 174 C31 152 36 122 58 102 Z" fill="${C.hairBrown}" stroke="${C.line}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M40 120 C30 62 64 28 100 28 C136 28 170 62 160 120 Z" fill="${C.hairBrown}" stroke="${C.line}" stroke-width="4" stroke-linejoin="round"/>`,
    teacherFront: `
      <path d="M43 108 C40 58 68 36 102 36 C136 36 160 60 157 106 C148 84 132 70 110 66 C98 80 76 96 43 108 Z"
        fill="${C.hairBrown}" stroke="${C.line}" stroke-width="4" stroke-linejoin="round"/>
      <circle cx="48" cy="82" r="8" fill="#ff8fa3" stroke="${C.line}" stroke-width="3"/>`,

    momBack: `
      <path d="M36 150 C18 70 60 28 100 28 C140 28 182 70 164 150 C160 176 150 192 136 196 L64 196 C50 192 40 176 36 150 Z"
        fill="#7a4a33" stroke="${C.line}" stroke-width="4" stroke-linejoin="round"/>`,
    momFront: `
      <path d="M43 110 C40 58 70 36 104 36 C138 36 160 60 157 108 C146 82 126 66 98 64 C86 80 66 96 43 110 Z"
        fill="#7a4a33" stroke="${C.line}" stroke-width="4" stroke-linejoin="round"/>`,
  };

  const HAIR_BACK = { girl: hair.girlBack, teacher: hair.teacherBack, mom: hair.momBack };
  const HAIR_FRONT = { boy: hair.boyFront, girl: hair.girlFront, teacher: hair.teacherFront, mom: hair.momFront };

  // 耳・顔・前髪・表情（後ろ髪は含まない）
  function faceCore(kind) {
    return `
      <circle cx="44" cy="110" r="12" fill="${C.skin}" stroke="${C.line}" stroke-width="4"/>
      <circle cx="156" cy="110" r="12" fill="${C.skin}" stroke="${C.line}" stroke-width="4"/>
      <ellipse cx="100" cy="106" rx="57" ry="53" fill="${C.skin}" stroke="${C.line}" stroke-width="4"/>
      ${HAIR_FRONT[kind] || ''}
      <path d="M69 110 Q78 99 87 110" fill="none" stroke="${C.line}" stroke-width="5" stroke-linecap="round"/>
      <path d="M113 110 Q122 99 131 110" fill="none" stroke="${C.line}" stroke-width="5" stroke-linecap="round"/>
      <ellipse cx="64" cy="126" rx="11" ry="7" fill="${C.cheek}" opacity="0.75"/>
      <ellipse cx="136" cy="126" rx="11" ry="7" fill="${C.cheek}" opacity="0.75"/>
      <path d="M85 126 Q100 150 115 126 Q100 131 85 126 Z" fill="${C.mouth}" stroke="${C.line}" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M92 137 Q100 144 108 137 Q100 133 92 137 Z" fill="${C.tongue}"/>`;
  }

  // 上半身（ローカル座標 200x240。重なり順：後ろ髪 → 首 → 服 → 顔）
  function person(kind, shirt, details = '') {
    return `
      ${HAIR_BACK[kind] || ''}
      <rect x="86" y="140" width="28" height="44" rx="8" fill="${C.skin}" stroke="${C.line}" stroke-width="4"/>
      <path d="M18 240 C20 200 52 176 100 176 C148 176 180 200 182 240 Z" fill="${shirt}" stroke="${C.line}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M82 177 Q100 196 118 177 Z" fill="${C.skin}" stroke="${C.line}" stroke-width="3.5" stroke-linejoin="round"/>
      ${details}
      ${faceCore(kind)}`;
  }

  // そろばんの上の縁をつかむ手（指先だけ見える）
  const grip = (x, y) => `
    <g transform="translate(${x} ${y})">
      <rect x="-15" y="-10" width="30" height="24" rx="10" fill="${C.skin}" stroke="${C.line}" stroke-width="3.5"/>
      <path d="M-6 3 L-6 12 M1 3 L1 12 M8 3 L8 11" stroke="${C.line}" stroke-width="2.4" stroke-linecap="round"/>
    </g>`;

  /* ---------- そろばん ---------- */

  function abacusBody(w, h, rods, pattern) {
    const t = 10;
    const innerW = w - t * 2;
    const beamY = t + (h - t * 2) * 0.32;
    const sp = innerW / rods;
    const brx = sp * 0.44;
    const bry = Math.min(6.5, (h - t * 2) * 0.062);
    let out = `
      <rect x="2" y="2" width="${w - 4}" height="${h - 4}" rx="10" fill="${C.wood}" stroke="${C.line}" stroke-width="4"/>
      <rect x="${t}" y="${t}" width="${innerW}" height="${h - t * 2}" rx="3" fill="${C.abacusBg}"/>`;
    for (let i = 0; i < rods; i++) {
      const x = t + sp * (i + 0.5);
      out += `<line x1="${x}" y1="${t}" x2="${x}" y2="${h - t}" stroke="${C.woodDark}" stroke-width="2"/>`;
    }
    out += `<rect x="${t}" y="${beamY - 3.5}" width="${innerW}" height="7" fill="${C.wood}"/>`;
    const bead = (x, y) =>
      `<ellipse cx="${x}" cy="${y}" rx="${brx}" ry="${bry}" fill="${C.bead}" stroke="${C.beadDark}" stroke-width="1.6"/>`;
    const botStart = beamY + 3.5;
    const botEnd = h - t;
    for (let i = 0; i < rods; i++) {
      const x = t + sp * (i + 0.5);
      const p = pattern[i % pattern.length];
      // 五珠（上の珠）
      out += bead(x, p.up ? beamY - 3.5 - bry - 0.5 : t + bry + 1);
      // 一珠（下の4つ）
      const step = bry * 2 + 0.5;
      for (let k = 0; k < 4; k++) {
        const y = k < p.low
          ? botStart + bry + 0.5 + k * step
          : botEnd - bry - 0.5 - (3 - k) * step;
        out += bead(x, y);
      }
    }
    return out;
  }

  const ABACUS_PATTERN = [
    { up: false, low: 1 }, { up: true, low: 2 }, { up: false, low: 0 }, { up: true, low: 3 },
    { up: false, low: 4 }, { up: true, low: 0 }, { up: false, low: 2 }, { up: true, low: 1 },
    { up: false, low: 3 },
  ];

  const abacus = (w = 180, h = 100, rods = 9) =>
    svg(`0 0 ${w} ${h}`, abacusBody(w, h, rods, ABACUS_PATTERN), 'illust-abacus');

  /* ---------- 小物 ---------- */

  const sparklePath = (x, y, s, color = '#ffd23f') =>
    `<path transform="translate(${x} ${y}) scale(${s})" d="M0 -12 C2 -3 3 -2 12 0 C3 2 2 3 0 12 C-2 3 -3 2 -12 0 C-3 -2 -2 -3 0 -12 Z" fill="${color}"/>`;

  const sakuraBody = (fill = '#f9a8c0', stroke = '#ee7fa0') => {
    let petals = '';
    for (let i = 0; i < 5; i++) {
      petals += `<path transform="rotate(${i * 72})" d="M0 -6 C-15 -14 -20 -34 -9 -46 L0 -39 L9 -46 C20 -34 15 -14 0 -6 Z" fill="${fill}" stroke="${stroke}" stroke-width="2.5" stroke-linejoin="round"/>`;
    }
    let stamens = '';
    for (let i = 0; i < 5; i++) {
      stamens += `<line transform="rotate(${i * 72 + 36})" x1="0" y1="0" x2="0" y2="-15" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round"/>`;
      stamens += `<circle transform="rotate(${i * 72 + 36})" cx="0" cy="-16" r="2.6" fill="#ffffff"/>`;
    }
    return `<g transform="translate(50 52)">${petals}<circle r="9" fill="${stroke}"/>${stamens}</g>`;
  };

  const icons = {
    person: svg('0 0 40 40', `
      <circle cx="20" cy="12" r="8" fill="#2d62b3"/>
      <path d="M5 36 C5 25 12 21 20 21 C28 21 35 25 35 36 Z" fill="#2d62b3"/>`),

    book: svg('0 0 48 40', `
      <path d="M24 9 C18 5 10 4 4 5 L4 34 C10 33 18 34 24 38 Z" fill="#e3f1fc" stroke="#2d6fb8" stroke-width="3.2" stroke-linejoin="round"/>
      <path d="M24 9 C30 5 38 4 44 5 L44 34 C38 33 30 34 24 38 Z" fill="#e3f1fc" stroke="#2d6fb8" stroke-width="3.2" stroke-linejoin="round"/>
      <path d="M9 13 L19 14 M9 19 L19 20 M9 25 L19 26 M29 14 L39 13 M29 20 L39 19 M29 26 L39 25" stroke="#2d6fb8" stroke-width="2.4" stroke-linecap="round"/>`),

    target: svg('0 0 48 48', `
      <circle cx="21" cy="27" r="18" fill="#e8505b" stroke="#c43945" stroke-width="2"/>
      <circle cx="21" cy="27" r="12.5" fill="#ffffff"/>
      <circle cx="21" cy="27" r="7.5" fill="#e8505b"/>
      <circle cx="21" cy="27" r="3" fill="#ffffff"/>
      <path d="M21 27 L40 8" stroke="#8a5a33" stroke-width="3.2" stroke-linecap="round"/>
      <path d="M36 4 L46 2 L44 12 L40 8 Z" fill="#f29a3a" stroke="#c96f14" stroke-width="1.6" stroke-linejoin="round"/>`),

    bulb: svg('0 0 48 60', `
      <path d="M24 6 C13 6 6 14 6 23 C6 31 12 35 15 41 L33 41 C36 35 42 31 42 23 C42 14 35 6 24 6 Z" fill="#ffe066" stroke="#e0a800" stroke-width="3" stroke-linejoin="round"/>
      <path d="M16 18 C17 13 20 11 24 11" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round" fill="none"/>
      <rect x="15" y="41" width="18" height="6" rx="2" fill="#8fa9c9" stroke="#5a7394" stroke-width="2"/>
      <rect x="16" y="47" width="16" height="6" rx="2" fill="#8fa9c9" stroke="#5a7394" stroke-width="2"/>
      <rect x="20" y="53" width="8" height="4" rx="2" fill="#5a7394"/>`),

    house: svg('0 0 56 52', `
      <path d="M10 26 L10 48 L46 48 L46 26" fill="#fffdf6" stroke="#3f9d5d" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M4 28 L28 6 L52 28" fill="none" stroke="#e8505b" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="22" y="32" width="12" height="16" rx="2" fill="#f2b84b" stroke="#3f9d5d" stroke-width="2.6"/>
      <rect x="38" y="10" width="6" height="11" fill="#e8505b"/>`),

    bubble: svg('0 0 56 50', `
      <path d="M28 4 C14 4 4 13 4 24 C4 30 7 35 12 39 L9 47 L20 42 C22.5 43 25 43.5 28 43.5 C42 43.5 52 34.5 52 24 C52 13 42 4 28 4 Z" fill="#4c9be8"/>
      <circle cx="18" cy="24" r="3.6" fill="#ffffff"/>
      <circle cx="28" cy="24" r="3.6" fill="#ffffff"/>
      <circle cx="38" cy="24" r="3.6" fill="#ffffff"/>`),

    smile: svg('0 0 32 32', `
      <circle cx="16" cy="16" r="14" fill="#ffd54a" stroke="#e5a800" stroke-width="2"/>
      <path d="M9.5 14 Q12 10.5 14.5 14 M17.5 14 Q20 10.5 22.5 14" fill="none" stroke="#6b4a1a" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M9.5 18.5 Q16 25 22.5 18.5" fill="none" stroke="#6b4a1a" stroke-width="2.2" stroke-linecap="round"/>
      <ellipse cx="8.5" cy="19" rx="2.8" ry="1.8" fill="#ff9eaa" opacity=".8"/>
      <ellipse cx="23.5" cy="19" rx="2.8" ry="1.8" fill="#ff9eaa" opacity=".8"/>`),

    note: svg('0 0 80 80', `
      <rect x="10" y="10" width="44" height="58" rx="5" fill="#ffffff" stroke="${C.line}" stroke-width="3.5" transform="rotate(-8 32 39)"/>
      <path d="M20 26 L42 23 M21 35 L43 32 M22 44 L36 42" stroke="#b9c7d6" stroke-width="3" stroke-linecap="round"/>
      <g transform="rotate(38 56 44)">
        <rect x="50" y="14" width="13" height="46" rx="2" fill="#ffc93c" stroke="${C.line}" stroke-width="3"/>
        <rect x="50" y="14" width="13" height="8" fill="#6db3f2" stroke="${C.line}" stroke-width="3"/>
        <path d="M50 60 L56.5 72 L63 60 Z" fill="#ffe3cd" stroke="${C.line}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M54.6 68.5 L56.5 72 L58.4 68.5 Z" fill="${C.line}"/>
      </g>`),

    sakura: svg('0 0 100 104', sakuraBody()),
    sakuraSmall: svg('0 0 100 104', sakuraBody('#f9b3c7', '#ef86a6')),

    clover: svg('0 0 70 80', `
      <path d="M36 44 C38 58 34 68 26 78" fill="none" stroke="#4caf6a" stroke-width="4" stroke-linecap="round"/>
      <g fill="#6cc27f" stroke="#3f9d5d" stroke-width="2.4" stroke-linejoin="round">
        <path d="M35 42 C24 44 14 36 18 26 C21 19 30 20 32 26 C29 18 36 12 42 16 C49 21 44 33 35 42 Z"/>
        <path d="M37 44 C40 34 52 30 58 37 C63 43 58 50 52 49 C58 53 55 62 48 61 C40 60 37 52 37 44 Z"/>
        <path d="M34 45 C26 49 22 60 28 64 C33 67 38 62 37 56 Z"/>
      </g>`),

    chart: svg('0 0 100 80', `
      <rect x="24" y="52" width="14" height="24" rx="2" fill="#6cc27f"/>
      <rect x="44" y="40" width="14" height="36" rx="2" fill="#4caf6a"/>
      <rect x="64" y="26" width="14" height="50" rx="2" fill="#3f9d5d"/>
      <path d="M14 46 L40 30 L50 36 L80 10" fill="none" stroke="#f2743a" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M70 6 L88 4 L84 21 Z" fill="#f2743a"/>
      ${sparklePath(10, 24, 0.7)}
      ${sparklePath(8, 64, 0.5)}`),

    sparkles: svg('0 0 60 60', `${sparklePath(22, 24, 1.3)}${sparklePath(46, 44, 0.7)}${sparklePath(48, 12, 0.5)}`),
    sparkleOne: svg('0 0 30 30', sparklePath(15, 15, 1.1)),

    rays: svg('0 0 50 50', `
      <path d="M8 30 L4 42 M20 22 L20 8 M32 30 L44 20" stroke="#ffd23f" stroke-width="5" stroke-linecap="round"/>`),

    dashes: svg('0 0 30 50', `
      <path d="M24 10 L8 4 M24 25 L4 25 M24 40 L8 46" stroke="#ffd23f" stroke-width="5" stroke-linecap="round"/>`),

    shapes: svg('0 0 90 26', `
      <path d="M4 22 L14 4 L24 22 Z" fill="#7fc8e8" stroke="#4aa6cf" stroke-width="1.5" stroke-linejoin="round"/>
      <circle cx="45" cy="13" r="10" fill="#f7a8d0"/>
      <rect x="64" y="3" width="20" height="20" rx="3" fill="#ffd54a"/>`),
  };

  /* ---------- キャラクター ---------- */

  const avatar = (kind, shirt) => svg('0 0 200 200', `<g transform="translate(0 -8)">${person(kind, shirt)}</g>`);
  const avatarBoy = avatar('boy', '#ffd66b');
  const avatarGirl = avatar('girl', '#ffb3c6');

  const heart = (x, y, s, color = '#ff8fab') =>
    `<path transform="translate(${x} ${y}) scale(${s})" d="M0 6 C-10 -2 -14 -8 -10 -13 C-6 -18 -1 -15 0 -11 C1 -15 6 -18 10 -13 C14 -8 10 -2 0 6 Z" fill="${color}"/>`;

  // はなまる（先生が花丸をつけるときの形）
  function hanamaru(x, y, s) {
    let petals = '';
    for (let i = 0; i < 7; i++) {
      petals += `<ellipse cx="0" cy="-17" rx="8" ry="10" transform="rotate(${(360 / 7) * i})"/>`;
    }
    return `<g transform="translate(${x} ${y}) scale(${s})" fill="#fff5f6" stroke="#e8505b" stroke-width="3.2">
      ${petals}
      <circle r="13" fill="#fff5f6"/>
      <path d="M1 0 A3 3 0 1 0 -2 3 A6 6 0 1 0 6 -4" fill="none" stroke-linecap="round"/>
    </g>`;
  }

  const heroKid = svg('0 0 300 300', `
    <circle cx="150" cy="128" r="112" fill="#fff4cc"/>
    <circle cx="262" cy="250" r="40" fill="#e4f4dc"/>
    ${sparklePath(34, 62, 1.6)}
    ${sparklePath(64, 26, 0.8)}
    ${sparklePath(270, 70, 1.5)}
    ${sparklePath(252, 34, 0.7)}
    <path d="M46 44 L32 32 M56 30 L54 16 M256 102 L272 96 M246 90 L256 78" stroke="#ffd23f" stroke-width="5" stroke-linecap="round"/>
    <g transform="translate(50 6) rotate(-4 100 120)">${person('boy', '#8ccaf0')}</g>
    <g transform="translate(40 192) rotate(-5 110 50)">
      ${abacusBody(220, 100, 9, ABACUS_PATTERN)}
      ${grip(46, 2)}
      ${grip(174, 2)}
    </g>`, 'illust-hero');

  const teacher = svg('0 0 220 250', `
    ${hanamaru(186, 40, 0.95)}
    ${sparklePath(26, 34, 0.9)}
    <g transform="translate(4 34) scale(0.9)">${person('teacher', '#fffaf5', `
      <path d="M66 240 L70 206 Q100 214 130 206 L134 240 Z" fill="#f7a3b8" stroke="${C.line}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M72 207 L80 182 M128 207 L120 182" stroke="${C.line}" stroke-width="4" stroke-linecap="round"/>
      <rect x="86" y="218" width="28" height="15" rx="4" fill="#ffffff" stroke="${C.line}" stroke-width="2.5"/>
      <circle cx="93" cy="225.5" r="3" fill="#f7a3b8"/>`)}</g>`, 'illust-teacher');

  const parentChild = svg('0 0 260 240', `
    ${sparklePath(242, 30, 0.9)}
    ${sparklePath(18, 132, 1.0)}
    ${heart(122, 54, 1.3)}
    ${heart(142, 30, 0.8, '#ffb3c6')}
    <g transform="translate(100 48) scale(0.8)">${person('mom', '#f59a9a', `
      <circle cx="100" cy="206" r="4" fill="#ffffff" stroke="${C.line}" stroke-width="2"/>`)}</g>
    <g transform="translate(8 90) scale(0.64)">${person('boy', '#6aa9e8')}</g>
    <g transform="translate(14 192)">
      ${abacusBody(112, 46, 7, ABACUS_PATTERN)}
      ${grip(26, 1)}
      ${grip(86, 1)}
    </g>`, 'illust-parent');

  window.ILLUST = {
    icons,
    abacus,
    heroKid,
    avatar: { boy: avatarBoy, girl: avatarGirl },
    teacher,
    parentChild,
  };
})();
