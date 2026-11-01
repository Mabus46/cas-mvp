/* ЦАС · экраны: методическое ядро, граф и роялти, каталог аренды, доходы */
(function (global) {
  'use strict';
  var C = global.CAS, E = global.CAS_ECON, U = global.UI;
  var esc = C.esc;
  window.ACTIONS = window.ACTIONS || {};
  var M = function () { return global.__CAS_MAIN; };

  function me(state) { return M().me(state); }
  function av(state, id) { return E.find(state.avatars, id); }
  function acc(state, id) { return E.find(state.accounts, id); }
  function myAvatar(state) { return M().myAvatar(state); }
  function params() {
    var h = location.hash || '';
    var q = h.indexOf('?');
    var out = {};
    if (q < 0) return out;
    h.slice(q + 1).split('&').forEach(function (kv) {
      var p = kv.split('=');
      out[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || '');
    });
    return out;
  }
  function ownerLabel(state, b) {
    var a = av(state, b.ownerAvatarId) || {};
    var o = acc(state, a.ownerId) || {};
    return o.short || a.alias || '—';
  }
  function accessTo(state, b) {
    var m = me(state);
    var a = av(state, b.ownerAvatarId) || {};
    if (a.ownerId === m.id) return 'owner';
    if (E.hasAccess(state, b.id, m.id)) return 'rented';
    return 'none';
  }

  /* ================= МЕТОДИЧЕСКОЕ ЯДРО ================= */
  C.Router.register('/methods', function (state) {
    var q = params();
    if (q.open) return blockDetail(state, q.open);

    var m = me(state);
    var list = state.blocks.filter(function (b) { return b.status === 'published'; });

    return '<div class="page-head"><h1>Методическое ядро</h1>' +
      '<p>Модуль M4. Методические блоки — объекты авторского права: версии, авторство, применимость и правила наследования. Именно они сдаются в аренду, а не личные данные.</p></div>' +

      '<div class="row row--between section"><h2 style="margin:0">Блоки в системе <span class="count">— ' + list.length + '</span></h2>' +
      '<button class="btn btn--gold btn--sm" data-act="block-new">Создать методический блок</button></div>' +

      '<div class="grid grid--2">' + list.map(function (b) {
        var access = accessTo(state, b);
        var accessBadge = access === 'owner' ? U.badge('мой блок', 'gold') : access === 'rented' ? U.badge('арендован', 'green') : U.badge('доступ по подписке', '');
        return '<div class="card">' +
          '<div class="row row--between"><div class="card__title" style="margin:0">' + esc(b.title) + '</div>' + accessBadge + '</div>' +
          '<div class="small muted" style="margin:6px 0 10px">' + esc(b.summary) + '</div>' +
          '<div class="chips">' + U.badge('v' + b.version, '') + U.badge(b.type, 'cyan') + U.badge(b.ageGroup, '') +
          (b.derivedFrom ? U.badge('ветвь от: ' + (E.find(state.blocks, b.derivedFrom) || {}).title.slice(0, 18) + '…', 'violet') : U.badge('корневая методика', 'gold')) + '</div>' +
          '<div class="row row--between" style="margin-top:12px"><div class="small muted">' + esc(ownerLabel(state, b)) + '</div>' +
          '<div class="small"><b>' + C.money(b.priceRub) + '</b>/мес</div></div>' +
          '<div class="btn-row" style="margin-top:10px"><a class="btn btn--sm" href="#/methods?open=' + b.id + '">Открыть</a>' +
          '<a class="btn btn--sm btn--ghost" href="#/catalog">Условия аренды</a></div>' +
          '</div>';
      }).join('') + '</div>' +

      '<div class="section">' + U.note('Содержимое блока видно владельцу и арендатору с действующим договором. Остальные видят только карточку — так работает лицензионная модель.', 'gold') + '</div>';
  });

  function blockDetail(state, id) {
    var b = E.find(state.blocks, id);
    if (!b) return '<div class="page-head"><h1>Блок не найден</h1></div>';
    var access = accessTo(state, b);
    var owner = av(state, b.ownerAvatarId) || {};
    var versions = (b.versions || []).slice().reverse();

    var content = access === 'owner' || access === 'rented'
      ? '<div class="small" style="white-space:pre-wrap">' + esc(b.body) + '</div>'
      : U.forbidden('Содержимое методического блока доступно после оформления лицензионного договора. Карточка, автор и цена открыты.');

    var tree = b.tree ? treeView(b.tree) : '';

    return '<div class="page-head"><a class="small" href="#/methods">← к списку блоков</a>' +
      '<h1>' + esc(b.title) + '</h1><p>' + esc(b.summary) + '</p></div>' +
      '<div class="grid grid--2">' +
      U.card({
        title: 'Содержимое ' + (access === 'owner' ? U.badge('владелец', 'gold') : access === 'rented' ? U.badge('арендатор', 'green') : U.badge('закрыто', 'red')),
        body: content +
          (access !== 'owner' && access !== 'rented' ? '<div class="btn-row" style="margin-top:10px"><a class="btn btn--gold btn--sm" href="#/catalog">Перейти к аренде</a></div>' : '') +
          tree
      }) +
      U.card({
        title: 'Паспорт блока',
        body: '<table class="tbl" style="min-width:0"><tbody>' +
          '<tr><td class="muted">Автор</td><td>' + esc(ownerLabel(state, b)) + '</td></tr>' +
          '<tr><td class="muted">Уровень</td><td>' + esc(b.level) + '</td></tr>' +
          '<tr><td class="muted">Возрастная группа</td><td>' + esc(b.ageGroup) + '</td></tr>' +
          '<tr><td class="muted">Цена</td><td>' + C.money(b.priceRub) + ' / мес</td></tr>' +
          '<tr><td class="muted">Форк разрешён</td><td>' + (b.forkAllowed ? 'да' : 'нет') + '</td></tr>' +
          '<tr><td class="muted">Уровень наследования</td><td>' + (b.lineageDepth ? 'ветвь ' + b.lineageDepth : 'корневая') + '</td></tr>' +
          '<tr><td class="muted">Опубликован</td><td>' + C.dateRu(b.publishedAt) + '</td></tr>' +
          '</tbody></table>' +
          '<div class="btn-row" style="margin-top:10px">' +
          (access === 'owner' ? '<button class="btn btn--sm btn--gold" data-act="block-version" data-id="' + b.id + '">Выпустить новую версию</button>' : '') +
          '<a class="btn btn--sm" href="#/lineage?block=' + b.id + '">Родословная и роялти</a></div>'
      }) +
      '</div>' +
      '<div class="section"><h2>История версий</h2>' +
      U.table(['Версия', 'Дата', 'Что изменилось'], versions.map(function (v) {
        return ['v' + v.v, C.dateRu(v.date), esc(v.note)];
      })) + '</div>';
  }

  function treeView(tree) {
    var byId = {};
    tree.nodes.forEach(function (n) { byId[n.id] = n; });
    var levels = {};
    var depth = { n1: 0 };
    var changed = true, guard = 0;
    while (changed && guard < 20) {
      changed = false; guard++;
      tree.edges.forEach(function (e) {
        if (depth[e.from] != null && depth[e.to] == null) { depth[e.to] = depth[e.from] + 1; changed = true; }
      });
    }
    tree.nodes.forEach(function (n) { var d = depth[n.id] || 0; (levels[d] = levels[d] || []).push(n); });
    var rows = Object.keys(levels).sort().map(function (d) {
      return '<div class="row" style="align-items:flex-start;gap:8px;margin:6px 0">' +
        '<span class="badge">шаг ' + (Number(d) + 1) + '</span>' +
        levels[d].map(function (n) {
          var cls = n.kind === 'cond' ? 'badge--cyan' : n.kind === 'act' ? 'badge--green' : 'badge--gold';
          return '<span class="badge ' + cls + '">' + esc(n.text) + '</span>';
        }).join('') + '</div>';
    }).join('');
    return '<div style="margin-top:14px"><div class="tiny muted">Дерево решений (' + tree.nodes.length + ' узлов, ' + tree.edges.length + ' переходов)</div>' + rows + '</div>';
  }

  /* ================= ГРАФ И РОЯЛТИ ================= */
  C.Router.register('/lineage', function (state) {
    var q = params();
    var blockId = q.block || 'bl-artem';
    var block = E.find(state.blocks, blockId) || state.blocks[0];
    var months = 1;
    var split = E.calcSplit(state, block.id, block.priceRub * months);
    var chain = E.lineageChain(state, block.id);

    return '<div class="page-head"><h1>Граф методик и каскад роялти</h1>' +
      '<p>Модуль M6. Каждая ветвь помнит, откуда она выросла. При каждом платеже система распределяет доли по цепочке и гарантирует сходимость до копейки.</p></div>' +

      '<div class="section">' +
      U.card({ title: 'Дерево наследования методик <span class="count">— нажмите на блок</span>', body: U.lineageSvg(state, block.id) }) +
      '</div>' +

      '<div class="grid grid--2">' +
      U.card({
        title: 'Расчёт для блока «' + esc(block.title.length > 28 ? block.title.slice(0, 26) + '…' : block.title) + '»',
        body: '<table class="tbl" style="min-width:0"><tbody>' +
          '<tr><td class="muted">Цена за месяц</td><td class="num">' + C.money(block.priceRub) + '</td></tr>' +
          '<tr><td class="muted">Комиссия платформы (' + split.commissionPct + ' %)</td><td class="num">− ' + C.money(split.commission) + '</td></tr>' +
          '<tr><td class="muted">Остаток к распределению</td><td class="num">' + C.money(split.pool) + '</td></tr>' +
          split.royalties.map(function (r) {
            return '<tr><td class="muted">Роялти ' + r.level + '-й линии · ' + r.percent + ' % <span class="tiny">(' + esc((acc(state, (av(state, r.beneficiaryAvatarId) || {}).ownerId) || {}).short || '') + ')</span></td><td class="num">' + C.money(r.amount) + '</td></tr>';
          }).join('') +
          '<tr><td class="muted">Доля владельца</td><td class="num"><b>' + C.money(split.ownerShare) + '</b></td></tr>' +
          '<tr><td class="muted">Сходимость</td><td class="num">' + (split.balanced ? U.badge('сумма = платежу', 'green') : U.badge('расхождение', 'red')) + '</td></tr>' +
          '</tbody></table>' +
          '<div class="tiny muted" style="margin-top:8px">Правило: 15 % → 10 % → 5 %, суммарно не более 30 %. Расчёт детерминирован и покрыт тестами.</div>'
      }) +
      U.card({
        title: 'Родословная блока',
        body: chain.length ? '<div class="list">' + chain.map(function (c) {
          return '<div class="row row--between" style="border-bottom:1px solid var(--line);padding-bottom:8px">' +
            '<div><div class="small">' + esc(c.block.title) + '</div><div class="tiny muted">' + esc(ownerLabel(state, c.block)) + ' · ' + C.money(c.block.priceRub) + '/мес</div></div>' +
            U.badge('уровень ' + c.level, 'violet') + '</div>';
        }).join('') + '</div>' + U.note('Наследование глубже 3 уровней не начисляет роялти: сумма ограничена 30 %.', 'gold')
          : U.note('Это корневая методика: роялти по ней не начисляются, вся доля владельца остаётся автору.', 'green')
      }) +
      '</div>' +

      '<div class="section"><h2>Все связи в системе</h2>' +
      U.table(['Блок', 'Происходит от', 'Владелец', 'Уровень'], state.blocks.map(function (b) {
        return [esc(b.title), esc(b.derivedFrom ? (E.find(state.blocks, b.derivedFrom) || {}).title : '—'), esc(ownerLabel(state, b)), String(b.lineageDepth || 0)];
      })) + '</div>';
  });

  /* ================= КАТАЛОГ АРЕНДЫ ================= */
  C.Router.register('/catalog', function (state) {
    var m = me(state);
    var q = params();
    var months = Number(q.months) || 1;
    var items = state.blocks.filter(function (b) {
      var a = av(state, b.ownerAvatarId) || {};
      return b.status === 'published' && a.ownerId !== m.id;
    });

    var selected = q.block ? E.find(state.blocks, q.block) : null;
    var preview = selected ? E.calcSplit(state, selected.id, selected.priceRub * months) : null;

    var rows = items.map(function (b) {
      var active = E.hasAccess(state, b.id, m.id);
      return '<tr><td><a href="#/methods?open=' + b.id + '">' + esc(b.title) + '</a><div class="tiny muted">' + esc(b.summary.slice(0, 80)) + '…</div></td>' +
        '<td>' + esc(ownerLabel(state, b)) + '</td>' +
        '<td class="num">' + C.money(b.priceRub) + '</td>' +
        '<td>' + (active ? U.badge('доступ есть', 'green') : U.badge('не арендован', '')) + '</td>' +
        '<td><button class="btn btn--sm" data-act="rent-choose" data-id="' + b.id + '">Выбрать</button></td></tr>';
    }).join('');

    return '<div class="page-head"><h1>Каталог аренды методик</h1>' +
      '<p>Модуль M5 «Наставник». Арендуется методика, а не профиль человека. Перед оплатой видно, как именно распределится сумма.</p></div>' +

      '<div class="section">' + U.card({
        title: 'Каталог',
        body: '<div class="table-wrap"><table class="tbl"><thead><tr><th>Блок</th><th>Автор</th><th>Цена/мес</th><th>Доступ</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>'
      }) + '</div>' +

      (selected ? '<div class="section"><h2>Оформление договора</h2>' +
        '<div class="grid grid--2">' +
        U.card({
          title: esc(selected.title),
          body: '<div class="small muted">' + esc(selected.summary) + '</div>' +
            '<div class="field" style="margin-top:12px"><label>Срок аренды</label>' +
            '<select data-act="rent-term">' + [1, 3, 6, 12].map(function (t) {
              return '<option value="' + t + '"' + (t === months ? ' selected' : '') + '>' + t + ' ' + C.plural(t, 'месяц', 'месяца', 'месяцев') + '</option>';
            }).join('') + '</select></div>' +
            '<div class="small">Сумма: <b>' + C.money(selected.priceRub * months) + '</b></div>' +
            U.note('Это лицензионный договор: доступ к содержанию методики на срок. Перепродажа и передача третьим лицам запрещены. Персональные данные автора не передаются.', 'gold')
        }) +
        U.card({
          title: 'Как распределится платеж',
          body: '<table class="tbl" style="min-width:0"><tbody>' +
            '<tr><td class="muted">Платёж</td><td class="num">' + C.money(preview.base) + '</td></tr>' +
            '<tr><td class="muted">Комиссия платформы</td><td class="num">' + C.money(preview.commission) + '</td></tr>' +
            preview.royalties.map(function (r) {
              return '<tr><td class="muted">Роялти: ' + esc((acc(state, (av(state, r.beneficiaryAvatarId) || {}).ownerId) || {}).short) + ' (' + r.percent + ' %)</td><td class="num">' + C.money(r.amount) + '</td></tr>';
            }).join('') +
            '<tr><td class="muted">Автору блока</td><td class="num"><b>' + C.money(preview.ownerShare) + '</b></td></tr>' +
            '<tr><td class="muted">Проверка</td><td class="num">' + (preview.balanced ? U.badge('сходится', 'green') : U.badge('ошибка', 'red')) + '</td></tr>' +
            '</tbody></table>' +
            '<div class="btn-row" style="margin-top:12px"><button class="btn btn--gold btn--block" data-act="rent-confirm" data-id="' + selected.id + '" data-months="' + months + '">Оплатить и получить доступ (демо)</button>' +
            '<a class="btn btn--sm btn--ghost" href="#/catalog">Отмена</a></div>' +
            '<div class="tiny muted" style="margin-top:8px">В демо-контуре оплата имитируется. В промышленном — проходит через платёжного партнёра; данные карт платформа не хранит.</div>'
        }) +
        '</div></div>' : '') +

      '<div class="section"><h2>Мои договоры</h2>' +
      U.table(['Блок', 'Срок', 'Сумма', 'Статус', 'Действует до'], state.contracts.map(function (c) {
        var b = E.find(state.blocks, c.blockId) || {};
        var expired = new Date(c.endsAt) < new Date();
        return [esc(b.title || '—'), c.months + ' мес', C.money(c.priceRub),
          expired ? U.badge('истёк', '') : U.badge('активен', 'green'), C.dateRu(c.endsAt)];
      })) + '</div>';
  });

  /* ================= ДОХОДЫ ================= */
  C.Router.register('/earnings', function (state) {
    var m = me(state);
    var e = E.earnings(state, m.id);
    var pts = E.pointsBalance(state, m.id);
    var period = E.closePeriod(state, m.id);
    var ver = E.ledgerVerify(state);

    var ledgerRows = state.ledger.slice().reverse().map(function (l) {
      var label = {
        'contract.paid': 'Оплата договора', 'royalty.accrual': 'Начисление роялти', 'owner.accrual': 'Начисление автору',
        'points.award': 'Начисление баллов', 'payout.requested': 'Заявка на выплату', 'ai.decision': 'Решение по рекомендации',
        'consent.revoked': 'Отзыв согласия', 'result.submitted': 'Загрузка протокола', 'training.added': 'Тренировка',
        'training.cognitive_test': 'Когнитивный тест', 'account.deletion_requested': 'Запрос удаления',
        'legacy.transferred': 'Передача наследия', 'ai.toggled': 'Переключение ИИ', 'block.created': 'Создание блока',
        'block.version': 'Новая версия блока'
      }[l.type] || l.type;
      var amount = l.payload.amount != null ? C.money(l.payload.amount) : (l.payload.delta != null ? l.payload.delta + ' б.' : '');
      return [String(l.seq), C.dateTimeRu(l.at), esc(label), '<span class="hash">' + esc(l.hash.slice(0, 16)) + '…</span>', amount];
    });

    return '<div class="page-head"><h1>Доходы и расчёты</h1>' +
      '<p>Модуль M8. Баллы и деньги разделены: баллы неконвертируемы, денежные суммы начисляются по договорам и выплачиваются в рублях через платёжного партнёра.</p></div>' +

      '<div class="grid grid--4">' +
      U.card({ cls: 'card--pad-sm', body: U.kpi(C.money(e.total), 'начислено всего', 'по договорам и роялти') }) +
      U.card({ cls: 'card--pad-sm', body: U.kpi(C.money(e.owner), 'как автору', 'доля владельца методики') }) +
      U.card({ cls: 'card--pad-sm', body: U.kpi(C.money(e.royalties), 'как правообладателю', 'роялти по каскаду') }) +
      U.card({ cls: 'card--pad-sm', body: U.kpi(C.num(pts), 'баллов', 'неконвертируемые, накопительные') }) +
      '</div>' +

      '<div class="grid grid--2 section">' +
      U.card({
        title: 'Выплата',
        body: '<table class="tbl" style="min-width:0"><tbody>' +
          '<tr><td class="muted">Доступно к выплате</td><td class="num"><b>' + C.money(period.available) + '</b></td></tr>' +
          '<tr><td class="muted">Уже выплачено</td><td class="num">' + C.money(period.paid) + '</td></tr>' +
          '<tr><td class="muted">Налоговый режим</td><td class="num">НДФЛ 13 %, по договору</td></tr>' +
          '</tbody></table>' +
          '<div class="btn-row" style="margin-top:10px"><button class="btn btn--gold btn--block" data-act="payout-request">Запросить выплату (демо)</button></div>' +
          U.note('Баллы на деньги не обмениваются. Выплата — только в рублях по договору, через платёжного партнёра, с налоговой отчётностью.', 'gold')
      }) +
      U.card({
        title: 'Целостность журнала',
        body: '<div class="row row--between"><div>Записей в журнале:</div><div class="mono"><b>' + ver.count + '</b></div></div>' +
          '<div class="row row--between" style="margin-top:8px"><div>Проверка хеш-цепочки:</div><div>' + (ver.ok ? U.badge('цепочка цела', 'green') : U.badge('нарушена на #' + ver.brokenAt, 'red')) + '</div></div>' +
          '<div class="btn-row" style="margin-top:10px"><button class="btn btn--sm" data-act="ledger-verify">Проверить заново</button></div>' +
          U.note('Журнал append-only: каждая запись содержит хеш предыдущей. Изменение любой записи ломает цепочку — это и есть воспроизводимость расчётов спустя годы.', 'cyan')
      }) +
      '</div>' +

      '<div class="section"><h2>Журнал операций</h2>' +
      U.table(['#', 'Когда', 'Операция', 'Хеш', 'Сумма'], ledgerRows, { numCols: [4] }) +
      '</div>' +

      '<div class="section"><h2>Баллы</h2>' +
      U.table(['Когда', 'Начисление', 'Основание'], state.pointTx.slice().reverse().map(function (t) {
        return [C.dateRu(t.at), '+' + t.delta, esc(t.reason)];
      }), { numCols: [1] }) +
      '</div>';
  });

  /* ================= ДЕЙСТВИЯ ================= */
  window.ACTIONS['rent-choose'] = function (state, el) {
    location.hash = '/catalog?block=' + el.getAttribute('data-id');
  };

  window.ACTIONS['rent-confirm'] = function (state, el) {
    var blockId = el.getAttribute('data-id');
    var months = Number(el.getAttribute('data-months')) || 1;
    var res = E.createContract(state, blockId, state.session.accountId, months);
    if (!res.ok) { C.toast(res.error, 'err'); return; }
    C.toast('Договор оформлен. Доступ открыт, роялти начислены по каскаду.', 'ok');
    location.hash = '/methods?open=' + blockId;
  };

  window.ACTIONS['payout-request'] = function (state) {
    var res = E.requestPayout(state, state.session.accountId);
    if (!res.ok) { C.toast(res.error, 'warn'); return; }
    C.toast('Заявка на выплату создана: ' + C.money(res.payout.amount) + ' (демо, платёж не проводится)', 'ok');
    C.Router.render();
  };

  window.ACTIONS['ledger-verify'] = function (state) {
    var v = E.ledgerVerify(state);
    C.toast(v.ok ? 'Проверка пройдена: ' + v.count + ' записей, цепочка цела' : 'Нарушение целостности на записи #' + v.brokenAt, v.ok ? 'ok' : 'err');
  };

  window.ACTIONS['block-new'] = function (state) {
    C.modal.open('<h3>Новый методический блок</h3>' +
      '<div class="field"><label for="b-title">Название</label><input id="b-title" type="text" placeholder="Например: Разбор карты Inferno для юниоров"></div>' +
      '<div class="field"><label for="b-sum">Краткое описание</label><textarea id="b-sum" placeholder="Что даёт блок и для кого он"></textarea></div>' +
      '<div class="grid grid--2">' +
      '<div class="field"><label for="b-type">Тип</label><select id="b-type"><option value="tactic">Тактика</option><option value="plan">План подготовки</option><option value="tree">Дерево решений</option><option value="recovery">Восстановление</option><option value="pedagogy">Педагогика</option></select></div>' +
      '<div class="field"><label for="b-price">Цена, ₽/мес</label><input id="b-price" type="number" value="900" min="0" max="20000"></div>' +
      '</div>' +
      '<label class="check"><input type="checkbox" id="b-fork" checked> Разрешить создание ответвлений (форков) с выплатой роялти</label>' +
      '<div class="note note--gold small">Создавая блок, вы подтверждаете авторство. Материал попадёт в граф методик и реестр происхождения.</div>' +
      '<div class="btn-row" style="margin-top:12px"><button class="btn btn--gold" data-act="block-save">Опубликовать</button><button class="btn" data-act="modal-close">Отмена</button></div>');
  };

  window.ACTIONS['block-save'] = function (state) {
    var g = function (id) { var n = document.getElementById(id); return n ? n.value : ''; };
    var title = (g('b-title') || '').trim();
    if (title.length < 3) { C.toast('Укажите название блока (минимум 3 символа)', 'err'); return; }
    var a = myAvatar(state);
    var block = {
      id: C.uid('bl'), ownerAvatarId: a.id, type: g('b-type'), title: title,
      summary: (g('b-sum') || '').trim() || 'Описание не заполнено',
      level: 'любой', ageGroup: '16+', priceRub: Number(g('b-price')) || 0,
      forkAllowed: !!(document.getElementById('b-fork') || {}).checked,
      derivedFrom: null, lineageDepth: 0, version: 1, status: 'published',
      publishedAt: new Date().toISOString(), body: (g('b-sum') || '').trim() || 'Содержание блока.',
      versions: [{ v: 1, date: new Date().toISOString(), note: 'Первая публикация' }]
    };
    state.blocks.push(block);
    E.ledgerAppend(state, 'block.created', { blockId: block.id, title: block.title, ownerAvatarId: block.ownerAvatarId });
    E.awardPoints(state, state.session.accountId, 300, 'Публикация методического блока');
    C.modal.close();
    C.toast('Блок опубликован. Начислено 300 баллов (неконвертируемых).', 'ok');
    location.hash = '/methods?open=' + block.id;
  };

  window.ACTIONS['block-version'] = function (state, el) {
    var id = el.getAttribute('data-id');
    var b = E.find(state.blocks, id);
    if (!b) return;
    C.modal.open('<h3>Новая версия блока</h3>' +
      '<div class="field"><label for="v-note">Что изменилось</label><textarea id="v-note" placeholder="Например: уточнены тайминги после 12 разборов"></textarea></div>' +
      '<div class="note small">Старые версии сохраняются: арендатор, начавший обучение на v' + b.version + ', продолжит на ней до конца срока.</div>' +
      '<div class="btn-row" style="margin-top:12px"><button class="btn btn--gold" data-act="block-version-save" data-id="' + id + '">Выпустить v' + (b.version + 1) + '</button>' +
      '<button class="btn" data-act="modal-close">Отмена</button></div>');
  };

  window.ACTIONS['block-version-save'] = function (state, el) {
    var id = el.getAttribute('data-id');
    var b = E.find(state.blocks, id);
    var noteEl = document.getElementById('v-note');
    var note = (noteEl && noteEl.value.trim()) || 'Без описания изменений';
    b.version += 1;
    b.versions.push({ v: b.version, date: new Date().toISOString(), note: note });
    E.ledgerAppend(state, 'block.version', { blockId: b.id, version: b.version, note: note });
    C.modal.close();
    C.toast('Выпущена версия v' + b.version, 'ok');
    C.Router.render();
  };

  global.__CAS_METHOD = { params: params, ownerLabel: ownerLabel, accessTo: accessTo };
})(window);
