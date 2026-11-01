/* ЦАС · экраны: кабинет спонсора, кабинет федерации */
(function (global) {
  'use strict';
  var C = global.CAS, E = global.CAS_ECON, U = global.UI;
  var esc = C.esc;
  window.ACTIONS = window.ACTIONS || {};

  function acc(state, id) { return E.find(state.accounts, id); }
  function av(state, id) { return E.find(state.avatars, id); }

  /* ================= СПОНСОР ================= */
  C.Router.register('/sponsor', function (state) {
    var sponsor = acc(state, 'acc-sponsor');
    var campaigns = (sponsor.campaigns || []);

    /* агрегаты с порогом k-анонимности */
    var byDiscipline = {};
    state.avatars.forEach(function (a) {
      if (a.kind === 'coach' || a.kind === 'teacher') return;
      var owner = acc(state, a.ownerId) || {};
      if (owner.isMinor) return; // данные детей не используются в рекламных отчётах
      byDiscipline[a.discipline] = (byDiscipline[a.discipline] || 0) + 1;
    });
    var K = 10;
    var aggRows = Object.keys(byDiscipline).map(function (d) {
      var n = byDiscipline[d];
      var title = (global.DISCIPLINES[d] || {}).title || d;
      if (n < K) return [esc(title), U.badge('недостаточно данных', ''), '—', '—'];
      return [esc(title), String(n), C.num(n * 137) + ' показов', C.num(n * 12) + ' реакций'];
    });

    var skins = state.skins.map(function (s) {
      var a = av(state, s.avatarId) || {};
      return [esc(s.title), esc(a.alias || '—'), s.isAd ? U.badge('Реклама', 'amber') : U.badge('без рекламы', ''),
        s.isAd ? '<span class="tiny muted">маркировка по 38-ФЗ</span>' : '—', U.badge('активен', 'green')];
    });

    return '<div class="page-head"><h1>Кабинет спонсора</h1>' +
      '<p>Модуль M10. Спонсор видит только агрегированную статистику. Персональные данные и списки участников недоступны технически.</p></div>' +

      '<div class="grid grid--3">' +
      U.card({ cls: 'card--pad-sm', body: U.kpi(C.money(campaigns.reduce(function (s, c) { return s + c.budgetRub; }, 0)), 'бюджет кампаний', esc(sponsor.name)) }) +
      U.card({ cls: 'card--pad-sm', body: U.kpi(C.money(campaigns.reduce(function (s, c) { return s + c.spentRub; }, 0)), 'израсходовано', 'донаты и поддержка') }) +
      U.card({ cls: 'card--pad-sm', body: U.kpi(state.skins.filter(function (s) { return s.isAd; }).length, 'скинов с логотипом', 'все маркированы как реклама') }) +
      '</div>' +

      '<div class="section"><h2>Кампании</h2>' +
      U.table(['Кампания', 'Бюджет', 'Израсходовано', 'Статус'], campaigns.map(function (c) {
        return [esc(c.title), C.money(c.budgetRub), C.money(c.spentRub), U.badge('активна', 'green')];
      }), { numCols: [1, 2] }) + '</div>' +

      '<div class="section"><h2>Агрегированная статистика</h2>' +
      U.table(['Дисциплина', 'Спортсменов 18+', 'Показы', 'Реакции'], aggRows) +
      U.note('Порог k-анонимности: если в группе меньше 10 человек, показывается «недостаточно данных». Данные несовершеннолетних не используются в отчётах и рекламе вообще. Выгрузка персональных списков невозможна.', 'gold') +
      '</div>' +

      '<div class="section"><h2>Скины и маркировка рекламы</h2>' +
      U.table(['Скин', 'Аватар', 'Маркировка', 'Основание', 'Статус'], skins) + '</div>' +

      '<div class="section"><h2>Донаты</h2>' +
      U.table(['Получатель', 'Назначение', 'Сумма', 'Отчёт'], [
        ['Фонд поддержки юниоров Курска', 'Экипировка для 12 спортсменов', C.money(48000), U.badge('отчёт получен', 'green')]
      ], { numCols: [2] }) +
      U.note('Целевые донаты фиксируются в журнале: сбор → получатель → отчёт о целевом использовании. Это не инвестиции и не роялти.', 'cyan') +
      '</div>';
  });

  /* ================= ФЕДЕРАЦИЯ ================= */
  C.Router.register('/federation', function (state) {
    var queue = state.verifications.slice().reverse();
    var disputes = state.disputes;

    var queueRows = queue.map(function (v) {
      var a = av(state, v.avatarId) || {};
      var o = acc(state, a.ownerId) || {};
      var badge = { pending: U.badge('ожидает', 'amber'), approved: U.badge('подтверждено', 'green'), rejected: U.badge('отклонено', 'red') }[v.status];
      var actions = v.status === 'pending'
        ? '<button class="btn btn--sm btn--gold" data-act="fed-approve" data-id="' + v.id + '">Подтвердить</button> <button class="btn btn--sm" data-act="fed-reject" data-id="' + v.id + '">Отклонить</button>'
        : '<span class="tiny muted">решение принято</span>';
      return [esc(o.short || '—'), esc(a.alias || '—'), esc(v.kind), C.dateRu(v.submittedAt), badge, actions];
    });

    return '<div class="page-head"><h1>Кабинет федерации</h1>' +
      '<p>Модуль M12. Верификация данных, разрешение споров и журнал действий. Федерация не видит персональные данные и не может редактировать результаты — только подтверждать или помечать спорными.</p></div>' +

      '<div class="grid grid--3">' +
      U.card({ cls: 'card--pad-sm', body: U.kpi(state.verifications.filter(function (v) { return v.status === 'pending'; }).length, 'заявок в очереди', 'SLA — 5 рабочих дней') }) +
      U.card({ cls: 'card--pad-sm', body: U.kpi(state.avatars.filter(function (a) { return a.status === 'verified'; }).length, 'проверенных аватаров', 'в демо-контуре') }) +
      U.card({ cls: 'card--pad-sm', body: U.kpi(disputes.filter(function (d) { return d.status === 'in_review'; }).length, 'споров в работе', 'решение фиксируется в журнале') }) +
      '</div>' +

      '<div class="section"><h2>Очередь верификации</h2>' +
      U.table(['Спортсмен', 'Витрина', 'Тип заявки', 'Подана', 'Статус', 'Действие'], queueRows) + '</div>' +

      '<div class="section"><h2>Споры</h2>' +
      U.table(['Тип', 'Инициатор', 'Предмет', 'Открыт', 'Статус', 'Действие'], disputes.map(function (d) {
        var i = acc(state, d.initiatorId) || {};
        var b = E.find(state.blocks, d.subject) || {};
        return [esc(d.type), esc(i.short), esc(b.title || d.subject), C.dateRu(d.openedAt),
          d.status === 'in_review' ? U.badge('в работе', 'amber') : U.badge('решён', 'green'),
          d.status === 'in_review' ? '<button class="btn btn--sm" data-act="fed-resolve" data-id="' + d.id + '">Принять решение</button>' : '—'];
      })) +
      (disputes.length ? U.note('Спор по авторству рассматривается по версиям блока: система хранит историю изменений и хеши содержимого.', 'cyan') : '') +
      '</div>' +

      '<div class="section"><h2>Журнал доступа</h2>' +
      U.table(['Когда', 'Кто', 'К чему', 'Основание', 'Результат'], state.accessLog.slice().reverse().slice(0, 10).map(function (l) {
        var a = acc(state, l.actorId) || {};
        var s = av(state, l.subject) || {};
        return [C.dateTimeRu(l.at), esc(a.short || l.actorId), esc(s.alias || l.subject), esc(l.reason),
          l.result === 'allow' ? U.badge('разрешено', 'green') : U.badge('отказ', 'red')];
      })) + '</div>';
  });

  /* ================= ДЕЙСТВИЯ ================= */
  window.ACTIONS['fed-approve'] = function (state, el) {
    var id = el.getAttribute('data-id');
    var v = E.find(state.verifications, id);
    if (!v) return;
    v.status = 'approved';
    v.decidedAt = new Date().toISOString();
    var a = av(state, v.avatarId);
    if (a) {
      a.status = 'verified';
      a.verifiedAt = new Date().toISOString();
      a.verifyExpires = new Date(Date.now() + 365 * 864e5).toISOString();
    }
    E.ledgerAppend(state, 'verification.approved', { verificationId: id, avatarId: v.avatarId });
    C.toast('Верификация подтверждена. Аватар получил статус «проверен».', 'ok');
    C.Router.render();
  };

  window.ACTIONS['fed-reject'] = function (state, el) {
    var id = el.getAttribute('data-id');
    var v = E.find(state.verifications, id);
    if (!v) return;
    v.status = 'rejected';
    v.decidedAt = new Date().toISOString();
    var a = av(state, v.avatarId);
    if (a) a.status = 'rejected';
    E.ledgerAppend(state, 'verification.rejected', { verificationId: id, reason: 'Документы не подтверждают заявленные данные' });
    C.toast('Заявка отклонена с обоснованием. Спортсмен может подать повторно.', 'warn');
    C.Router.render();
  };

  window.ACTIONS['fed-resolve'] = function (state, el) {
    var id = el.getAttribute('data-id');
    var d = E.find(state.disputes, id);
    if (!d) return;
    C.modal.open('<h3>Решение по спору</h3>' +
      '<div class="small muted">' + esc(d.text) + '</div>' +
      '<div class="field" style="margin-top:10px"><label for="d-res">Формулировка решения</label>' +
      '<textarea id="d-res">Совпадение признано частичным: блок остаётся, в карточке указывается ссылка на исходную методику и распределение роялти по каскаду.</textarea></div>' +
      '<div class="btn-row"><button class="btn btn--gold" data-act="fed-resolve-save" data-id="' + id + '">Зафиксировать</button><button class="btn" data-act="modal-close">Отмена</button></div>');
  };

  window.ACTIONS['fed-resolve-save'] = function (state, el) {
    var id = el.getAttribute('data-id');
    var d = E.find(state.disputes, id);
    var note = (document.getElementById('d-res') || {}).value || '';
    if (d) { d.status = 'resolved'; d.resolution = note; d.closedAt = new Date().toISOString(); }
    E.ledgerAppend(state, 'dispute.resolved', { disputeId: id, resolution: note });
    C.modal.close();
    C.toast('Решение зафиксировано в журнале', 'ok');
    C.Router.render();
  };
})(window);
