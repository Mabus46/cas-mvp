/* ЦАС · экраны: соревнования, тренировки, ИИ-коучинг, кабинет тренера */
(function (global) {
  'use strict';
  var C = global.CAS, E = global.CAS_ECON, AI = global.CAS_AI, U = global.UI;
  var esc = C.esc;
  window.ACTIONS = window.ACTIONS || {};
  var M = function () { return global.__CAS_MAIN; };

  function me(state) { return M().me(state); }
  function myAvatar(state) { return M().myAvatar(state); }
  function acc(state, id) { return E.find(state.accounts, id); }
  function av(state, id) { return E.find(state.avatars, id); }

  /* ================= СОРЕВНОВАТЕЛЬНЫЙ МОДУЛЬ ================= */
  C.Router.register('/sport', function (state) {
    var a = myAvatar(state) || state.avatars[0];
    var viewing = !myAvatar(state) ? '<div class="note note--cyan small" style="margin-bottom:14px">Роль «' + (me(state).role === 'sponsor' ? 'Спонсор' : me(state).role === 'federation' ? 'Федерация' : 'Тренер') + '» смотрит демонстрационный профиль спортсмена. В промышленном контуре этот экран показывает только подопечных по действующему согласию.</div>' : '';
    var disc = global.DISCIPLINES[a.discipline] || { title: a.discipline, metrics: [] };
    var results = state.results.filter(function (r) { return r.avatarId === a.id; });

    var leaderboard = state.avatars.slice()
      .filter(function (x) { return x.kind !== 'teacher'; })
      .sort(function (x, y) { return y.rating - x.rating; });

    var metricRows = disc.metrics.map(function (m) {
      var lastRes = results.length ? results[results.length - 1].metrics : {};
      return [esc(m.title), '<b>' + esc(lastRes[m.code] == null ? '—' : lastRes[m.code]) + '</b>' + (m.unit ? ' ' + esc(m.unit) : ''), m.better === 'high' ? 'чем выше, тем лучше' : 'чем ниже, тем лучше'];
    });

    return viewing + '<div class="page-head"><h1>Соревновательный модуль</h1>' +
      '<p>Модуль M2. Результаты турниров, подтверждение федерацией, метрики дисциплины и внутренний рейтинг.</p></div>' +

      '<div class="grid grid--3">' +
      U.card({ cls: 'card--pad-sm', body: U.kpi(results.length, 'результатов', 'в демо-профиле') }) +
      U.card({ cls: 'card--pad-sm', body: U.kpi(C.num(a.rating), 'рейтинг ЦАС', 'внутренний, не смешивается с внешним') }) +
      U.card({ cls: 'card--pad-sm', body: U.kpi(results.filter(function (r) { return !r.confirmed; }).length, 'ждут подтверждения', 'очередь федерации') }) +
      '</div>' +

      '<div class="section"><h2>Метрики дисциплины: ' + esc(disc.title) + '</h2>' +
      U.table(['Показатель', 'Последнее значение', 'Направление'], metricRows) +
      U.note('Набор метрик задаётся конфигурацией дисциплины, а не кодом: для новой дисциплины достаточно описать справочник показателей.', 'cyan') +
      '</div>' +

      '<div class="section"><h2>История соревнований</h2>' +
      U.table(['Соревнование', 'Уровень', 'Дата', 'Место', 'Статус'], results.map(function (r) {
        var c = E.find(state.competitions, r.competitionId) || {};
        return [esc(c.title || '—'), esc(c.level || '—'), C.dateRu(c.date), U.badge(String(r.place) + ' место', r.place === 1 ? 'gold' : ''),
          r.confirmed ? U.badge('подтверждено', 'green') : U.badge('на проверке', 'amber')];
      })) +
      '<div class="btn-row" style="margin-top:12px"><button class="btn btn--sm" data-act="load-protocol">Загрузить протокол соревнования (демо)</button></div>' +
      '</div>' +

      '<div class="section"><h2>Рейтинг ЦАС по региону</h2>' +
      U.table(['#', 'Аватар', 'Дисциплина', 'Разряд', 'Рейтинг'], leaderboard.map(function (x, i) {
        var o = acc(state, x.ownerId) || {};
        return [String(i + 1), esc(o.short), esc((global.DISCIPLINES[x.discipline] || {}).title || x.discipline), esc(x.rank), '<b>' + C.num(x.rating) + '</b>'];
      }), { numCols: [0, 4] }) +
      '</div>';
  });

  /* ================= ТРЕНИРОВОЧНЫЙ МОДУЛЬ ================= */
  C.Router.register('/training', function (state) {
    var a = myAvatar(state) || state.avatars[0];
    var viewing = !myAvatar(state) ? '<div class="note note--cyan small" style="margin-bottom:14px">Роль «' + (me(state).role === 'sponsor' ? 'Спонсор' : me(state).role === 'federation' ? 'Федерация' : 'Тренер') + '» смотрит демонстрационный профиль спортсмена. В промышленном контуре этот экран показывает только подопечных по действующему согласию.</div>' : '';
    var rows = (state.training[a.id] || []).slice().sort(function (x, y) { return new Date(y.date) - new Date(x.date); });
    var asc = rows.slice().reverse();
    var m = AI.metrics(state, a.id);

    var table = U.table(['Дата', 'Тип', 'Объём, мин', 'RPE', 'Сон, ч', 'Реакция, мс', 'Источник'], rows.slice(0, 14).map(function (t) {
      return [C.dateRu(t.date), esc(t.type), String(t.loadMin), String(t.rpe), String(t.sleepH).replace('.', ','), String(t.reactionMs), esc(t.source === ' wearable' || t.source === 'wearable' ? 'устройство' : 'ручной ввод')];
    }), { numCols: [2, 3, 4, 5] });

    return viewing + '<div class="page-head"><h1>Тренировочный модуль</h1>' +
      '<p>Модуль M3. Журнал тренировок, субъективная нагрузка, сон и когнитивный тест реакции. Данные хранятся в закрытой плоскости и видны тренеру только по согласию.</p></div>' +

      '<div class="grid grid--3">' +
      U.card({ title: 'RPE, последние 14 дней', body: U.spark(asc.map(function (t) { return t.rpe; }), { color: '#fbbf24', label: 'динамика RPE' }) + '<div class="tiny muted">Средняя за 3 дня: <b>' + String(m.rpeLast).replace('.', ',') + '</b> · изменение ' + (m.rpeDelta > 0 ? '+' : '') + m.rpeDelta + ' %</div>' }) +
      U.card({ title: 'Сон, часы', body: U.spark(asc.map(function (t) { return t.sleepH; }), { color: '#38bdf8', label: 'динамика сна' }) + '<div class="tiny muted">Средняя за 3 дня: <b>' + String(m.sleepLast).replace('.', ',') + ' ч</b> · изменение ' + (m.sleepDelta > 0 ? '+' : '') + m.sleepDelta + ' %</div>' }) +
      U.card({ title: 'Время реакции, мс', body: U.spark(asc.map(function (t) { return t.reactionMs; }), { color: '#a78bfa', label: 'динамика реакции' }) + '<div class="tiny muted">Средняя за 3 дня: <b>' + m.reactLast + ' мс</b> · изменение ' + (m.reactDelta > 0 ? '+' : '') + m.reactDelta + ' мс</div>' }) +
      '</div>' +

      '<div class="section"><h2>Когнитивный тест реакции</h2>' +
      U.card({
        body: '<div class="row row--between"><div class="small muted">5 нажатий по цели. Среднее время попадёт в журнал и в расчёт признаков усталости.</div>' +
          '<div class="mono" id="react-out">—</div></div>' +
          '<div class="reaction-area" id="react-area" style="margin-top:10px"><div class="muted small" style="padding:16px">Нажмите «Начать тест»</div></div>' +
          '<div class="btn-row" style="margin-top:10px"><button class="btn btn--gold" data-act="react-start">Начать тест</button>' +
          '<button class="btn" data-act="training-add">Добавить тренировку вручную</button></div>'
      }) + '</div>' +

      '<div class="section"><h2>Журнал тренировок</h2>' + table +
      U.note('Источник данных указывается всегда: ручной ввод, тренер или носимое устройство. Это нужно, чтобы ИИ и тренер понимали достоверность.', 'cyan') +
      '</div>';
  });

  /* ================= ИИ-КОУЧИНГ ================= */
  C.Router.register('/ai', function (state) {
    var a = myAvatar(state) || state.avatars[0];
    var viewing = !myAvatar(state) ? '<div class="note note--cyan small" style="margin-bottom:14px">Роль «' + (me(state).role === 'sponsor' ? 'Спонсор' : me(state).role === 'federation' ? 'Федерация' : 'Тренер') + '» смотрит демонстрационный профиль спортсмена. В промышленном контуре этот экран показывает только подопечных по действующему согласию.</div>' : '';
    var res = AI.compute(state, a.id);
    var role = me(state).role;
    var list = AI.visibleTo(res.list, role === 'coach' ? 'coach' : 'athlete');
    var hidden = res.list.length - list.length;

    var cards = list.map(function (r) {
      var lvl = { high: ['высокий', 'red'], watch: ['наблюдение', 'amber'], info: ['информация', 'cyan'] }[r.level] || ['инфо', 'cyan'];
      var st = { new: ['новая', 'cyan'], accepted: ['принята', 'green'], rejected: ['отклонена', ''], pending_coach: ['у тренера', 'amber'] }[r.status] || ['—', ''];
      var factors = r.factors.map(function (f) {
        return '<div class="row row--between small" style="border-bottom:1px solid var(--line);padding:6px 0">' +
          '<span>' + esc(f.label) + '</span><span class="mono">' + esc(f.value) + ' <span class="tiny muted">вес ' + f.weight + '</span></span></div>';
      }).join('');
      return U.card({
        cls: r.level === 'high' ? 'card--gold' : '',
        body: '<div class="row row--between"><div class="card__title" style="margin:0">' + esc(r.title) + '</div>' +
          '<div class="chips">' + U.badge(lvl[0], lvl[1]) + U.badge(st[0], st[1]) + '</div></div>' +
          '<div class="small muted" style="margin:6px 0 10px">' + esc(r.why || '') + '</div>' +
          '<div class="tiny muted">Факторы (объяснение вывода)</div>' + factors +
          '<div class="btn-row" style="margin-top:10px">' +
          (r.status === 'new' ? '<button class="btn btn--sm btn--gold" data-act="ai-accept" data-id="' + r.id + '">Принять</button><button class="btn btn--sm" data-act="ai-reject" data-id="' + r.id + '">Отклонить</button>' : '') +
          (r.status === 'pending_coach' ? '<span class="tiny muted">Решение принимает тренер — спортсмену сигнал не показывается до подтверждения.</span>' : '') +
          '<button class="btn btn--sm btn--ghost" data-act="ai-limits">Ограничения модели</button>' +
          '</div>' +
          '<div class="tiny muted" style="margin-top:8px">Модель: ' + esc(r.model) + ' · ' + esc(r.disclaimer || '') + '</div>'
      });
    }).join('');

    return viewing + '<div class="page-head"><h1>ИИ-коучинг и сигналы риска</h1>' +
      '<p>Модуль M9. Правила и статистика вместо «чёрного ящика»: каждый вывод объясняется списком факторов, а решения с высоким уровнем подтверждает человек.</p></div>' +

      '<div class="grid grid--3">' +
      U.card({ cls: 'card--pad-sm', body: U.kpi(list.length, 'рекомендаций', 'доступно вашей роли') }) +
      U.card({ cls: 'card--pad-sm', body: U.kpi(hidden, 'скрыто', 'высокий уровень до решения тренера') }) +
      U.card({ cls: 'card--pad-sm', body: U.kpi(state.aiEnabled ? 'вкл' : 'выкл', 'ИИ-рекомендации', 'отключаются в один клик') }) +
      '</div>' +

      '<div class="section"><div class="row row--between"><h2>Рекомендации</h2>' +
      '<button class="btn btn--sm" data-act="ai-toggle">' + (state.aiEnabled ? 'Отключить рекомендации' : 'Включить рекомендации') + '</button></div>' +
      (cards || '<div class="note">Рекомендаций нет. Это нормальное состояние, если данных мало или ИИ отключён.</div>') +
      '</div>' +

      '<div class="section"><h2>Журнал решений</h2>' +
      U.table(['Когда', 'Решение', 'Кем'], state.ledger.filter(function (e) { return e.type === 'ai.decision'; })
        .slice().reverse().map(function (e) {
          var who = acc(state, e.payload.by) || { short: e.payload.by };
          return [C.dateTimeRu(e.at), esc(e.payload.recommendationId + ' → ' + e.payload.status), esc(who.short || 'система')];
        })) +
      '</div>';
  });

  /* ================= КАБИНЕТ ТРЕНЕРА ================= */
  C.Router.register('/coach', function (state) {
    var coach = me(state).role === 'coach' ? me(state) : acc(state, 'acc-coach');
    var group = state.avatars.filter(function (a) { return a.ownerId !== coach.id && a.kind !== 'teacher' && a.kind !== 'coach'; });

    var signals = [];
    group.forEach(function (a) {
      var r = AI.compute(state, a.id);
      r.list.forEach(function (rec) { if (rec.level === 'high') signals.push({ avatar: a, rec: rec }); });
    });

    var access = group.map(function (a) {
      var res = E.canAccessPlane3(state, coach.id, a.id);
      return { avatar: a, res: res };
    });

    return '<div class="page-head"><h1>Кабинет тренера</h1>' +
      '<p>Группа, сигналы риска и доступ к тренировочным данным — только по действующему согласию спортсмена.</p></div>' +

      '<div class="section"><h2>Сигналы на подтверждение (HITL)</h2>' +
      (signals.length ? signals.map(function (s) {
        return U.card({
          cls: 'card--gold',
          body: '<div class="row row--between"><div><div style="font-weight:700">' + esc((acc(state, s.avatar.ownerId) || {}).short) + ' · ' + esc(s.avatar.alias) + '</div>' +
            '<div class="small muted">' + esc(s.rec.title) + '</div></div>' + U.badge('высокий уровень', 'red') + '</div>' +
            '<div class="small" style="margin-top:8px">' + s.rec.factors.map(function (f) { return esc(f.label) + ' — ' + esc(f.value); }).join(' · ') + '</div>' +
            '<div class="btn-row" style="margin-top:10px"><button class="btn btn--sm btn--gold" data-act="coach-approve" data-id="' + s.rec.id + '">Подтвердить спортсмену</button>' +
            '<button class="btn btn--sm" data-act="coach-dismiss" data-id="' + s.rec.id + '">Считать ложным</button></div>'
        });
      }).join('') : U.note('Сигналов нет: показатели группы в пределах нормы.', 'green')) +
      '</div>' +

      '<div class="section"><h2>Доступ к тренировочным данным группы</h2>' +
      U.table(['Спортсмен', 'Согласие', 'Доступ к данным здоровья', 'Основание'], access.map(function (x) {
        var consent = state.consents.some(function (c) { return c.accountId === x.avatar.ownerId && c.type === 'coach' && !c.revokedAt; });
        return [esc((acc(state, x.avatar.ownerId) || {}).short), consent ? U.badge('действует', 'green') : U.badge('нет', 'red'),
          x.res.allow ? U.badge('разрешён', 'green') : U.badge('закрыт', 'red'), '<span class="tiny">' + esc(x.res.reason) + '</span>'];
      })) +
      U.note('Отзыв согласия спортсменом закрывает доступ немедленно — это можно проверить на экране «Приватность».', 'gold') +
      '</div>' +

      '<div class="section"><h2>Методические блоки тренера</h2>' +
      U.table(['Блок', 'Тип', 'Цена', 'Версия', 'Аренд'], state.blocks.filter(function (b) {
        var a = av(state, b.ownerAvatarId);
        return a && a.ownerId === coach.id;
      }).map(function (b) {
        var rents = state.contracts.filter(function (c) { return c.blockId === b.id && c.status === 'active'; }).length;
        return [esc(b.title), esc(b.type), C.money(b.priceRub), 'v' + b.version, String(rents)];
      })) +
      '<div class="btn-row" style="margin-top:12px"><a class="btn btn--sm" href="#/methods">Открыть методическое ядро</a></div>' +
      '</div>';
  });

  /* ================= ИНТЕРАКТИВ: тест реакции ================= */
  var react = { running: false, trial: 0, times: [], startAt: 0 };

  window.ACTIONS['react-start'] = function (state) {
    var area = document.getElementById('react-area');
    if (!area) return;
    react = { running: true, trial: 0, times: [], startAt: 0 };
    area.innerHTML = '<div class="muted small" style="padding:16px">Приготовьтесь: цель появится в случайном месте. Нажимайте как можно быстрее. Попытка 1 из 5.</div>';
    setTimeout(function () { nextTrial(state); }, 700);
  };

  function nextTrial(state) {
    var area = document.getElementById('react-area');
    if (!area) return;
    if (react.trial >= 5) {
      var avg = Math.round(react.times.reduce(function (s, x) { return s + x; }, 0) / react.times.length);
      var out = document.getElementById('react-out');
      if (out) out.textContent = 'Среднее: ' + avg + ' мс';
      area.innerHTML = '<div class="muted small" style="padding:16px">Тест завершён. Среднее время реакции: <b>' + avg + ' мс</b>. Результат записан в журнал тренировок.</div>';
      var a = myAvatar(state);
      if (a) {
        state.training[a.id] = state.training[a.id] || [];
        state.training[a.id].push({
          id: C.uid('tr'), date: new Date().toISOString(), type: 'Когнитивный тест',
          loadMin: 5, rpe: 5, sleepH: (state.training[a.id].slice(-1)[0] || {}).sleepH || 7,
          reactionMs: avg, source: 'manual', done: true
        });
        state.accessLog.push({ id: C.uid('al'), at: new Date().toISOString(), actorId: state.session.accountId, subject: a.id, plane: 3, reason: 'Когнитивный тест реакции', result: 'allow' });
        E.ledgerAppend(state, 'training.cognitive_test', { avatarId: a.id, reactionMs: avg });
      }
      C.toast('Результат теста записан: ' + avg + ' мс', 'ok');
      react.running = false;
      return;
    }
    var x = 10 + Math.random() * 70, y = 10 + Math.random() * 60;
    area.innerHTML = '<button class="reaction-target" id="react-target" style="left:' + x + '%;top:' + y + '%;" aria-label="Цель"></button>' +
      '<div class="tiny muted" style="position:absolute;left:10px;bottom:8px">Попытка ' + (react.trial + 1) + ' из 5</div>';
    var t = document.getElementById('react-target');
    react.startAt = performance.now();
    t.addEventListener('click', function () {
      var dt = Math.round(performance.now() - react.startAt);
      react.times.push(dt);
      react.trial++;
      var out = document.getElementById('react-out');
      if (out) out.textContent = 'Последняя: ' + dt + ' мс';
      setTimeout(function () { nextTrial(state); }, 220);
    }, { once: true });
  }

  /* ================= ПРОЧИЕ ДЕЙСТВИЯ ================= */
  window.ACTIONS['load-protocol'] = function (state) {
    var a = myAvatar(state) || state.avatars[0];
    var viewing = !myAvatar(state) ? '<div class="note note--cyan small" style="margin-bottom:14px">Роль «' + (me(state).role === 'sponsor' ? 'Спонсор' : me(state).role === 'federation' ? 'Федерация' : 'Тренер') + '» смотрит демонстрационный профиль спортсмена. В промышленном контуре этот экран показывает только подопечных по действующему согласию.</div>' : '';
    var cmp = state.competitions[0];
    var place = Math.floor(Math.random() * 3) + 1;
    state.results.push({
      id: C.uid('res'), avatarId: a.id, competitionId: cmp.id, place: place, confirmed: false, disputed: false,
      metrics: { kd: (1 + Math.random() * 0.4).toFixed(2), adr: String(70 + Math.round(Math.random() * 20)), hs: String(40 + Math.round(Math.random() * 12)), reaction: String(205 + Math.round(Math.random() * 25)), clutch: String(15 + Math.round(Math.random() * 15)) }
    });
    E.ledgerAppend(state, 'result.submitted', { avatarId: a.id, competitionId: cmp.id });
    C.toast('Протокол загружен: результат отправлен на подтверждение федерации.', 'ok');
    C.Router.render();
  };

  window.ACTIONS['training-add'] = function (state) {
    var a = myAvatar(state) || state.avatars[0];
    var viewing = !myAvatar(state) ? '<div class="note note--cyan small" style="margin-bottom:14px">Роль «' + (me(state).role === 'sponsor' ? 'Спонсор' : me(state).role === 'federation' ? 'Федерация' : 'Тренер') + '» смотрит демонстрационный профиль спортсмена. В промышленном контуре этот экран показывает только подопечных по действующему согласию.</div>' : '';
    C.modal.open('<h3>Новая тренировка</h3>' +
      '<div class="field"><label for="f-type">Тип занятия</label><select id="f-type"><option>Тренировка</option><option>Разбор</option><option>Турнирный день</option><option>Восстановление</option></select></div>' +
      '<div class="grid grid--2">' +
      '<div class="field"><label for="f-load">Объём, мин</label><input id="f-load" type="number" value="90" min="10" max="400"></div>' +
      '<div class="field"><label for="f-rpe">RPE (1–10)</label><input id="f-rpe" type="number" value="7" min="1" max="10"></div>' +
      '<div class="field"><label for="f-sleep">Сон, часов</label><input id="f-sleep" type="number" value="7.5" step="0.1" min="3" max="12"></div>' +
      '<div class="field"><label for="f-react">Реакция, мс</label><input id="f-react" type="number" value="215" min="120" max="500"></div>' +
      '</div>' +
      '<div class="btn-row"><button class="btn btn--gold" data-act="training-save" data-id="' + a.id + '">Сохранить</button><button class="btn" data-act="modal-close">Отмена</button></div>');
  };

  window.ACTIONS['training-save'] = function (state, el) {
    var id = el.getAttribute('data-id');
    var g = function (x) { var n = document.getElementById(x); return n ? n.value : ''; };
    state.training[id] = state.training[id] || [];
    state.training[id].push({
      id: C.uid('tr'), date: new Date().toISOString(), type: g('f-type'),
      loadMin: Number(g('f-load')) || 90, rpe: Number(g('f-rpe')) || 7,
      sleepH: Number(String(g('f-sleep')).replace(',', '.')) || 7.5,
      reactionMs: Number(g('f-react')) || 215, source: 'manual', done: true
    });
    E.ledgerAppend(state, 'training.added', { avatarId: id, source: 'manual' });
    C.modal.close();
    C.toast('Тренировка добавлена в журнал', 'ok');
    C.Router.render();
  };

  window.ACTIONS['ai-accept'] = function (state, el) {
    AI.setStatus(state, el.getAttribute('data-id'), 'accepted', state.session.accountId);
    C.toast('Рекомендация принята и записана в журнал решений', 'ok');
    C.Router.render();
  };
  window.ACTIONS['ai-reject'] = function (state, el) {
    AI.setStatus(state, el.getAttribute('data-id'), 'rejected', state.session.accountId);
    C.toast('Рекомендация отклонена. Это тоже данные: система учитывает решения человека.', 'warn');
    C.Router.render();
  };
  window.ACTIONS['ai-toggle'] = function (state) {
    state.aiEnabled = !state.aiEnabled;
    E.ledgerAppend(state, 'ai.toggled', { enabled: state.aiEnabled });
    C.toast(state.aiEnabled ? 'Рекомендации включены' : 'Рекомендации отключены. Основные функции работают как обычно.', 'warn');
    C.Router.render();
  };
  window.ACTIONS['ai-limits'] = function () {
    C.modal.open('<h3>Ограничения модели</h3><ul class="small">' +
      '<li>Модель работает на правилах и статистике, нейросети в демо-контуре не используются.</li>' +
      '<li>Выводы не являются медицинскими: система говорит о признаках усталости, а не о состоянии здоровья.</li>' +
      '<li>Метрики качества: precision ≥ 0,7, recall ≥ 0,6 на размеченной выборке — до достижения порога сигнал остаётся советующим.</li>' +
      '<li>Любой вывод можно отключить или отклонить; отказ фиксируется в журнале.</li></ul>' +
      '<div class="btn-row"><button class="btn" data-act="modal-close">Понятно</button></div>');
  };
  window.ACTIONS['coach-approve'] = function (state, el) {
    AI.setStatus(state, el.getAttribute('data-id'), 'accepted', state.session.accountId);
    C.toast('Сигнал подтверждён тренером — теперь он виден спортсмену', 'ok');
    C.Router.render();
  };
  window.ACTIONS['coach-dismiss'] = function (state, el) {
    AI.setStatus(state, el.getAttribute('data-id'), 'rejected', state.session.accountId);
    C.toast('Сигнал отклонён как ложный', 'warn');
    C.Router.render();
  };
})(window);
