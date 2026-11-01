/* ЦАС · UI-компоненты */
(function (global) {
  'use strict';
  var C = global.CAS;
  var esc = C.esc;

  function card(opts) {
    var cls = 'card' + (opts.cls ? ' ' + opts.cls : '');
    return '<div class="' + cls + '"' + (opts.id ? ' id="' + opts.id + '"' : '') + '>' +
      (opts.title ? '<div class="card__title">' + opts.title + '</div>' : '') +
      (opts.body || '') + '</div>';
  }

  function kpi(value, label, hint) {
    return '<div class="kpi"><div class="kpi__value">' + value + '</div>' +
      '<div class="kpi__label">' + esc(label) + '</div>' +
      (hint ? '<div class="kpi__hint">' + esc(hint) + '</div>' : '') + '</div>';
  }

  function badge(text, cls) {
    return '<span class="badge' + (cls ? ' badge--' + cls : '') + '">' + esc(text) + '</span>';
  }

  function table(head, rows, opts) {
    opts = opts || {};
    var th = head.map(function (h) { return '<th>' + h + '</th>'; }).join('');
    var tr = rows.map(function (r) {
      var cls = (opts.rowClass && opts.rowClass(r)) || '';
      return '<tr' + (cls ? ' class="' + cls + '"' : '') + '>' + r.map(function (c, i) {
        return '<td' + (opts.numCols && opts.numCols.indexOf(i) >= 0 ? ' class="num"' : '') + '>' + c + '</td>';
      }).join('') + '</tr>';
    }).join('');
    return '<div class="table-wrap"><table class="tbl"><thead><tr>' + th + '</tr></thead><tbody>' + tr + '</tbody></table></div>';
  }

  /* ---------- мини-графики ---------- */
  function spark(values, opts) {
    opts = opts || {};
    var w = opts.w || 260, h = opts.h || 54, pad = 4;
    if (!values.length) return '<div class="muted tiny">нет данных</div>';
    var min = Math.min.apply(null, values), max = Math.max.apply(null, values);
    var span = (max - min) || 1;
    var step = (w - pad * 2) / Math.max(1, values.length - 1);
    var pts = values.map(function (v, i) {
      var x = pad + i * step;
      var y = h - pad - ((v - min) / span) * (h - pad * 2);
      return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
    });
    var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0] + ' ' + p[1]; }).join(' ');
    var color = opts.color || '#38bdf8';
    var area = d + ' L' + pts[pts.length - 1][0] + ' ' + (h - pad) + ' L' + pts[0][0] + ' ' + (h - pad) + ' Z';
    var dots = pts.map(function (p, i) {
      return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (i === pts.length - 1 ? 3 : 1.8) + '" fill="' + color + '"/>';
    }).join('');
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" style="width:100%;height:' + h + 'px" preserveAspectRatio="none" role="img" aria-label="' + esc(opts.label || 'график') + '">' +
      '<path d="' + area + '" fill="' + color + '" opacity="0.10"/>' +
      '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>' +
      dots + '</svg>';
  }

  function bars(items, opts) {
    opts = opts || {};
    var max = Math.max.apply(null, items.map(function (i) { return i.value; })) || 1;
    return '<div class="list">' + items.map(function (i) {
      return '<div><div class="row row--between small"><span>' + esc(i.label) + '</span><span class="mono muted">' + esc(i.display || i.value) + '</span></div>' +
        '<div class="bar' + (i.cls ? ' ' + i.cls : '') + '"><i style="width:' + Math.max(2, Math.round(i.value / max * 100)) + '%"></i></div></div>';
    }).join('') + '</div>';
  }

  /* ---------- три плоскости ---------- */
  function planes() {
    return '<div class="planes">' +
      '<div class="plane plane--1"><h4>Плоскость 1 · Витрина</h4>' +
      '<div class="tiny muted">Публично</div>' +
      '<ul><li>псевдоним, вид спорта, разряд</li><li>рейтинг и достижения</li><li>скины и статус</li><li>без ПДн и контактов</li></ul></div>' +
      '<div class="plane plane--2"><h4>Плоскость 2 · Методическое ядро</h4>' +
      '<div class="tiny muted">Лицензируется</div>' +
      '<ul><li>тактики, разборы, планы</li><li>деревья решений</li><li>версии и авторство</li><li>то, что сдаётся в аренду</li></ul></div>' +
      '<div class="plane plane--3"><h4>Плоскость 3 · Хранилище</h4>' +
      '<div class="tiny muted">Закрыто</div>' +
      '<ul><li>персональные данные</li><li>здоровье и восстановление</li><li>контакты и реквизиты</li><li>доступ только по согласию</li></ul></div>' +
      '</div>';
  }

  /* ---------- граф методик ---------- */
  function lineageSvg(state, highlightId) {
    var blocks = state.blocks;
    var levels = {};
    blocks.forEach(function (b) {
      var d = b.lineageDepth || 0;
      (levels[d] = levels[d] || []).push(b);
    });
    var depthKeys = Object.keys(levels).map(Number).sort(function (a, b) { return a - b; });
    var nodeW = 200, nodeH = 62, gapX = 22, gapY = 26;
    var maxPerLevel = Math.max.apply(null, depthKeys.map(function (d) { return levels[d].length; }));
    var w = Math.max(320, maxPerLevel * nodeW + (maxPerLevel - 1) * gapX + 32);
    var h = 40 + depthKeys.length * (nodeH + gapY);
    var pos = {};
    var svg = [];
    depthKeys.forEach(function (d, row) {
      var list = levels[d];
      var totalW = list.length * nodeW + (list.length - 1) * gapX;
      var startX = Math.max(16, (w - totalW) / 2);
      list.forEach(function (b, i) {
        pos[b.id] = { x: startX + i * (nodeW + gapX), y: 24 + row * (nodeH + gapY), row: row };
      });
    });

    blocks.forEach(function (b) {
      if (!b.derivedFrom || !pos[b.derivedFrom]) return;
      var a = pos[b.derivedFrom], c = pos[b.id];
      var x1 = a.x + nodeW / 2, y1 = a.y + nodeH;
      var x2 = c.x + nodeW / 2, y2 = c.y;
      var midY = (y1 + y2) / 2;
      svg.push('<path d="M' + x1 + ' ' + y1 + ' C' + x1 + ' ' + midY + ' ' + x2 + ' ' + midY + ' ' + x2 + ' ' + y2 + '" fill="none" stroke="#3b4a66" stroke-width="1.6" stroke-dasharray="4 3"/>');
      svg.push('<circle cx="' + x2 + '" cy="' + y2 + '" r="3" fill="#d4af37"/>');
    });

    blocks.forEach(function (b) {
      var p = pos[b.id];
      if (!p) return;
      var isRoot = !b.derivedFrom;
      var stroke = isRoot ? '#d4af37' : (b.lineageDepth === 1 ? '#38bdf8' : '#34d399');
      var fill = highlightId === b.id ? 'rgba(212,175,55,.16)' : 'rgba(15,23,38,.96)';
      var title = b.title.length > 31 ? b.title.slice(0, 29) + "…" : b.title;
      var author = (state.avatars.filter(function (a) { return a.id === b.ownerAvatarId; })[0] || {}).alias || '—';
      if (author.length > 22) author = author.slice(0, 20) + '…';
      svg.push('<g class="tree-node" data-block="' + b.id + '">' +
        '<rect x="' + p.x + '" y="' + p.y + '" width="' + nodeW + '" height="' + nodeH + '" rx="12" fill="' + fill + '" stroke="' + stroke + '" stroke-width="1.4"/>' +
        '<text x="' + (p.x + 12) + '" y="' + (p.y + 22) + '" fill="#e6ebf3" font-size="10.8" font-weight="700" font-family="PT Sans, sans-serif">' + esc(title) + '</text>' +
        '<text x="' + (p.x + 12) + '" y="' + (p.y + 40) + '" fill="#8291a8" font-size="10.5" font-family="PT Sans, sans-serif">' + esc(author) + ' · ' + C.money(b.priceRub) + '/мес</text>' +
        '<text x="' + (p.x + 12) + '" y="' + (p.y + 54) + '" fill="' + stroke + '" font-size="9.5" font-family="PT Sans, sans-serif">' +
        (isRoot ? 'корневая методика' : 'ветвь, уровень ' + b.lineageDepth) + '</text>' +
        '</g>');
    });

    return '<svg viewBox="0 0 ' + w + ' ' + h + '" class="tree-svg" role="img" aria-label="Граф наследования методик">' + svg.join('') + '</svg>';
  }

  /* ---------- карточка аватара ---------- */
  function avatarCard(state, avatar, opts) {
    opts = opts || {};
    var acc = state.accounts.filter(function (a) { return a.id === avatar.ownerId; })[0] || {};
    var statusMap = { verified: ['Проверен', 'green'], pending: ['На проверке', 'amber'], rejected: ['Отклонён', 'red'] };
    var st = statusMap[avatar.status] || ['—', ''];
    var disc = (global.DISCIPLINES[avatar.discipline] || {}).title || avatar.discipline;
    var name = opts.publicOnly ? avatar.alias : (acc.short || avatar.alias);
    return '<div class="card' + (opts.cls ? ' ' + opts.cls : '') + '">' +
      '<div class="row row--between"><div class="card__title">' + esc(name) + '</div>' + badge(st[0], st[1]) + '</div>' +
      '<div class="small muted">' + esc(disc) + ' · ' + esc(avatar.rank) + ' · ' + esc(acc.region || '') + '</div>' +
      '<div class="row" style="margin-top:10px;gap:16px">' +
      '<div><div class="kpi__value" style="font-size:20px">' + C.num(avatar.rating) + '</div><div class="kpi__label">рейтинг ЦАС</div></div>' +
      '<div><div class="kpi__value" style="font-size:20px">' + global.CAS_ECON.socialScore(state, avatar.id) + '</div><div class="kpi__label">индекс</div></div>' +
      '<div><div class="kpi__value" style="font-size:20px">' + (avatar.achievements || []).length + '</div><div class="kpi__label">достижений</div></div>' +
      '</div>' +
      (opts.footer ? '<div style="margin-top:12px">' + opts.footer + '</div>' : '') +
      '</div>';
  }

  /* ---------- сообщения ---------- */
  function forbidden(reason) {
    return '<div class="tag-403"><b>403 · Доступ запрещён</b><br>' + esc(reason) +
      '<br><span class="tiny">Проверка выполнена на серверной модели прав: роль, согласие, основание обработки.</span></div>';
  }

  function note(text, kind) {
    return '<div class="note' + (kind ? ' note--' + kind : '') + '">' + text + '</div>';
  }

  global.UI = {
    card: card, kpi: kpi, badge: badge, table: table, spark: spark, bars: bars,
    planes: planes, lineageSvg: lineageSvg, avatarCard: avatarCard, forbidden: forbidden, note: note
  };
})(window);
