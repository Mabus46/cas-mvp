/* ЦАС · экраны: обзор, паспорт аватара, приватность, правовой контур, наследование */
(function (global) {
  'use strict';
  var C = global.CAS, E = global.CAS_ECON, AI = global.CAS_AI, U = global.UI;
  var esc = C.esc;
  window.ACTIONS = window.ACTIONS || {};

  function acc(state, id) { return E.find(state.accounts, id); }
  function av(state, id) { return E.find(state.avatars, id); }
  function me(state) { return acc(state, state.session.accountId); }
  function myAvatar(state) { var a = me(state); return a && a.avatarId ? av(state, a.avatarId) : null; }

  /* ================= ОБЗОР ================= */
  C.Router.register('/', function (state) {
    var stats = {
      avatars: state.avatars.length,
      blocks: state.blocks.filter(function (b) { return b.status === 'published'; }).length,
      contracts: state.contracts.length,
      turnover: state.ledger.filter(function (e) { return e.type === 'contract.paid'; })
        .reduce(function (s, e) { return s + e.payload.amount; }, 0),
      ledger: state.ledger.length,
      consents: state.consents.filter(function (c) { return !c.revokedAt; }).length
    };

    var modules = [
      { t: 'M1 · Паспорт и верификация', d: 'Паспортные и спортивные данные, статус «проверен», очередь федерации', href: '#/avatar', ok: true },
      { t: 'M2 · Соревновательный модуль', d: 'Турниры, результаты, метрики дисциплины, рейтинг', href: '#/sport', ok: true },
      { t: 'M3 · Тренировочный модуль', d: 'Журнал, нагрузка, сон, когнитивный тест реакции', href: '#/training', ok: true },
      { t: 'M4 · Методическое ядро', d: 'Блоки, версии, деревья решений, авторство', href: '#/methods', ok: true },
      { t: 'M5 · Аренда «Наставник»', d: 'Каталог, лицензионный договор, доступ по сроку', href: '#/catalog', ok: true },
      { t: 'M6 · Форк и граф методик', d: 'Ветвление, каскад роялти 15/10/5, проверка баланса', href: '#/lineage', ok: true },
      { t: 'M7 · Наследование наследия', d: 'Завещание методики, мемориальный режим, LAW-06', href: '#/legacy', ok: true },
      { t: 'M8 · Экономика и расчёты', d: 'Баллы, комиссия 7 %, роялти, журнал с хеш-цепочкой', href: '#/earnings', ok: true },
      { t: 'M9 · ИИ-коучинг', d: 'Рекомендации с факторами, HITL-подтверждение тренером', href: '#/ai', ok: true },
      { t: 'M10 · Кабинет спонсора', d: 'Агрегаты с k-анонимностью, скины с маркировкой «Реклама»', href: '#/sponsor', ok: true },
      { t: 'M11 · Социальный индекс', d: 'Прозрачная формула, покупки не влияют на рейтинг', href: '#/avatar', ok: true },
      { t: 'M12 · Федерация', d: 'Верификация, споры, журнал действий', href: '#/federation', ok: true },
      { t: 'M14 · Права субъекта', d: 'Согласия, экспорт, удаление, журнал доступа', href: '#/privacy', ok: true },
      { t: 'Правовой контур', d: '11 норм, что исключено из концепции и почему', href: '#/legal', ok: true }
    ];

    var steps = [
      ['Открыть паспорт аватара', 'Проверенный профиль, витрина без персональных данных', '#/avatar'],
      ['Оформить аренду методики', 'Лицензионный договор, оплата в демо-контуре, доступ', '#/catalog'],
      ['Посмотреть расчёт роялти', 'Каскад 15 % / 10 % / 5 %, сходимость до копейки', '#/lineage'],
      ['Открыть доходы и журнал', 'Проверка хеш-цепочки журнала операций', '#/earnings'],
      ['Подтвердить сигнал тренером', 'ИИ предложил — человек решил (HITL)', '#/coach'],
      ['Попробовать запрещённый доступ', 'Запрос к чужой закрытой области → 403', '#/privacy']
    ];

    return '<div class="page-head">' +
      '<h1>Цифровой аватар спортсмена</h1>' +
      '<p>Верифицированный профиль спортсмена, методическое ядро тренера и прозрачная экономика методик — как модуль цифровой экосистемы физической культуры и спорта. Демонстрационный контур собран целиком: все механики работают в браузере, без сервера и без персональных данных.</p>' +
      '<div class="chips" style="margin-top:10px">' +
      U.badge('Пилотный вид спорта — компьютерный спорт', 'cyan') +
      U.badge('14 функциональных блоков', 'gold') +
      U.badge('11 правовых ограничений учтено', 'green') +
      U.badge('Демо-данные', '') +
      '</div></div>' +

      '<div class="grid grid--4 section">' +
      U.card({ cls: 'card--pad-sm', body: U.kpi(C.num(stats.avatars), 'аватара в демо', 'спортсмены, тренеры, педагоги') }) +
      U.card({ cls: 'card--pad-sm', body: U.kpi(C.num(stats.blocks), 'методических блоков', 'с версиями и графом наследования') }) +
      U.card({ cls: 'card--pad-sm', body: U.kpi(C.num(stats.contracts), 'договора аренды', 'действующие лицензии') }) +
      U.card({ cls: 'card--pad-sm', body: U.kpi(C.money(stats.turnover), 'оборот в демо-контуре', stats.ledger + ' записей в журнале') }) +
      '</div>' +

      '<div class="section"><h2>Что уже работает <span class="count">— нажмите на любой блок</span></h2>' +
      '<div class="grid grid--3">' + modules.map(function (m) {
        return '<a class="card card--pad-sm" href="' + m.href + '" style="text-decoration:none;color:inherit">' +
          '<div class="row row--between"><div class="card__title" style="margin:0">' + esc(m.t) + '</div>' + U.badge('готово', 'green') + '</div>' +
          '<div class="small muted" style="margin-top:6px">' + esc(m.d) + '</div></a>';
      }).join('') + '</div></div>' +

      '<div class="section"><h2>Проверить за 5 минут</h2>' +
      '<div class="grid grid--2">' + steps.map(function (s, i) {
        return '<a class="card card--pad-sm" href="' + s[2] + '" style="text-decoration:none;color:inherit">' +
          '<div class="row"><span class="badge badge--gold">' + (i + 1) + '</span><div><div style="font-weight:700">' + esc(s[0]) + '</div>' +
          '<div class="small muted">' + esc(s[1]) + '</div></div></div></a>';
      }).join('') + '</div></div>' +

      '<div class="section"><h2>Три плоскости данных</h2>' + U.planes() +
      U.note('Арендатор физически не получает доступ к закрытой плоскости: ограничение зашито в модель прав, а не в интерфейс. Проверьте на экране «Приватность».', 'gold') +
      '</div>' +

      '<div class="section"><h2>Авторство и статус разработки</h2>' +
      '<div class="grid grid--2">' +
      U.card({ title: 'Правообладатель', body: '<div class="small">Архитектура, алгоритмы и исключительные права на систему «Цифровой аватар спортсмена» принадлежат <b>Белякову Максиму Александровичу</b>.</div>' }) +
      U.card({ title: 'Разработчик (подрядчик)', body: '<div class="small">Фонд содействия развитию социальных проектов — исполнитель работ по созданию демонстрационного контура и промышленной платформы. <a href="#/legal">Правовой контур →</a></div>' }) +
      '</div></div>';
  });

  /* ================= ПАСПОРТ АВАТАРА ================= */
  C.Router.register('/avatar', function (state) {
    var a = myAvatar(state);
    if (!a) {
      var m0 = me(state);
      var target = m0.role === 'sponsor' ? '#/sponsor' : m0.role === 'federation' ? '#/federation' : '#/';
      return '<div class="page-head"><h1>Паспорт аватара</h1>' +
        '<p>Модуль M1. У роли «' + esc({ sponsor: 'Спонсор', federation: 'Федерация', athlete: 'Спортсмен', coach: 'Тренер' }[m0.role] || m0.role) + '» нет собственного аватара — это нормально: паспорт ведут спортсмены и тренеры.</p></div>' +
        '<div class="grid grid--2">' +
        U.card({ title: 'Что доступно вашей роли', body: '<div class="small">' +
          (m0.role === 'sponsor'
            ? 'Спонсор видит только агрегированную статистику и управляет кампаниями. Персональные данные спортсменов и их паспорта недоступны технически.'
            : m0.role === 'federation'
              ? 'Федерация проверяет паспортные и соревновательные данные через очередь верификации и разрешает споры. Закрытые данные о здоровье недоступны.'
              : 'Переключите роль в верхней панели на «Спортсмен», чтобы увидеть паспорт аватара с витриной и закрытым хранилищем.') +
          '</div><div class="btn-row" style="margin-top:12px"><a class="btn btn--gold btn--sm" href="' + target + '">Перейти в кабинет роли</a>' +
          '<a class="btn btn--sm" href="#/legal">Правовой контур</a></div>' }) +
        U.card({ title: 'Демонстрация ролей', body: '<div class="small muted">В верхней панели можно переключаться между четырьмя ролями: спортсмен, тренер, спонсор, федерация. Набор доступных данных меняется вместе с ролью — это и есть проверка модели прав.</div>' }) +
        '</div>';
    }

    var owner = acc(state, a.ownerId);
    var pub = publicView(state, a);
    var priv = privateView(state, a);

    var statusMap = { verified: ['Проверен федерацией', 'green'], pending: ['На проверке', 'amber'], rejected: ['Отклонён', 'red'] };
    var st = statusMap[a.status] || ['—', ''];

    return '<div class="page-head"><h1>Паспорт аватара</h1>' +
      '<p>Модуль M1. Паспортные и спортивные данные, статус верификации и разделение на публичную витрину и закрытое хранилище.</p></div>' +

      '<div class="grid grid--2">' +
      U.card({
        title: 'Профиль ' + U.badge(st[0], st[1]),
        body: '<table class="tbl" style="min-width:0"><tbody>' +
          row('Владелец', owner.fio) +
          row('Публичный псевдоним', a.alias) +
          row('Дисциплина', (global.DISCIPLINES[a.discipline] || {}).title) +
          row('Разряд', a.rank) +
          row('Регион', owner.region) +
          row('Федерация', a.federation) +
          row('Рейтинг ЦАС', C.num(a.rating)) +
          row('Видимость', a.visibility === 'public' ? 'публичная витрина' : 'только по ссылке') +
          '</tbody></table>' +
          (a.status !== 'verified' ? '<div style="margin-top:12px"><button class="btn btn--gold btn--block" data-act="verify-request">Отправить заявку на верификацию</button></div>' : '')
      }) +
      U.card({
        title: 'Статус и доступ',
        body: '<div class="list small">' +
          '<div class="row row--between"><span>Верификация</span>' + (a.verifiedAt ? U.badge('от ' + C.dateRu(a.verifiedAt), 'green') : U.badge('не пройдена', 'amber')) + '</div>' +
          '<div class="row row--between"><span>Действует до</span><span class="mono">' + (a.verifyExpires ? C.dateRu(a.verifyExpires) : '—') + '</span></div>' +
          '<div class="row row--between"><span>Медицинская группа</span><span>' + esc(a.medGroup || '—') + ' <span class="tiny muted">(закрытая плоскость)</span></span></div>' +
          '<div class="row row--between"><span>Активных согласий</span><span>' + state.consents.filter(function (c) { return c.accountId === a.ownerId && !c.revokedAt; }).length + '</span></div>' +
          '</div>' +
          U.note('Медицинская группа и допуск не отображаются в публичной витрине и не передаются арендаторам методик.', 'gold')
      }) +
      '</div>' +

      '<div class="section"><h2>Что видит скаут, а что — только владелец</h2>' +
      '<div class="grid grid--2">' +
      U.card({ title: 'Публичная витрина ' + U.badge('Плоскость 1', 'green'), body: '<div class="code">' + esc(JSON.stringify(pub, null, 2)) + '</div>' }) +
      U.card({ title: 'Закрытое хранилище ' + U.badge('Плоскость 3', 'red'), body: '<div class="code">' + esc(JSON.stringify(priv, null, 2)) + '</div>' })
      + '</div>' +
      U.note('Публичная витрина собирается отдельной функцией и физически не содержит персональных данных — это проверяется автоматическим тестом, а не настройкой приватности.') +
      '</div>' +

      '<div class="section"><h2>Достижения</h2>' +
      (a.achievements && a.achievements.length ? U.table(['Соревнование', 'Место', 'Дата', 'Уровень'],
        a.achievements.map(function (x) {
          return [esc(x.title), U.badge(String(x.place) + ' место', x.place === 1 ? 'gold' : ''), C.dateRu(x.date), esc(x.level)];
        })) : '<div class="muted">Пока нет подтверждённых достижений.</div>') +
      '</div>' +

      '<div class="section"><h2>Социальный индекс</h2>' +
      U.card({
        body: '<div class="row" style="gap:20px;align-items:flex-start">' +
          '<div>' + U.kpi(global.CAS_ECON.socialScore(state, a.id), 'Social Score', 'из 10') + '</div>' +
          '<div class="small muted" style="flex:1;min-width:240px">Формула публикуется открыто: 0,4 × достижения + 0,3 × активность за 90 дней + 0,2 × подтверждённые методики + 0,1 × оценки арендаторов. Покупки и скины не влияют на индекс — платного преимущества нет.</div>' +
          '</div>'
      }) +
      '</div>';
  });

  function row(k, v) {
    return '<tr><td class="muted" style="width:45%">' + esc(k) + '</td><td>' + esc(v == null ? '—' : v) + '</td></tr>';
  }

  function publicView(state, a) {
    return {
      id: a.id,
      alias: a.alias,
      discipline: a.discipline,
      rank: a.rank,
      region: (acc(state, a.ownerId) || {}).region,
      rating: a.rating,
      socialScore: global.CAS_ECON.socialScore(state, a.id),
      achievements: (a.achievements || []).map(function (x) { return { title: x.title, place: x.place }; }),
      verified: a.status === 'verified'
    };
  }
  function privateView(state, a) {
    var owner = acc(state, a.ownerId) || {};
    return {
      fio: owner.fio,
      birthYear: new Date().getFullYear() - (owner.age || 0),
      email: owner.email,
      snils: '***-***-123 45',
      medGroup: a.medGroup,
      admissionUntil: a.admissionUntil,
      consentBasis: state.consents.filter(function (c) { return c.accountId === a.ownerId && !c.revokedAt; }).map(function (c) { return c.type; })
    };
  }

  /* ================= ПРИВАТНОСТЬ ================= */
  C.Router.register('/privacy', function (state) {
    var m = me(state);
    var myConsents = state.consents.filter(function (c) { return c.accountId === m.id; });
    var log = state.accessLog.slice().reverse().slice(0, 12);
    var target = state.avatars.filter(function (a) { return a.ownerId !== m.id; })[0] || state.avatars[0];
    var probe = E.canAccessPlane3(state, m.id, target.id);

    return '<div class="page-head"><h1>Приватность и права субъекта данных</h1>' +
      '<p>Модуль M14 и Закон 152-ФЗ: согласия, отзыв, экспорт, удаление, журнал доступа. Всё это работает в демо-контуре — можно нажать.</p></div>' +

      '<div class="grid grid--2">' +
      U.card({
        title: 'Мои согласия',
        body: '<div class="list">' + myConsents.map(function (c) {
          var active = !c.revokedAt;
          return '<div class="row row--between" style="border-bottom:1px solid var(--line);padding-bottom:8px">' +
            '<div><div class="small">' + esc(global.CONSENT_TYPES[c.type] || c.type) + '</div>' +
            '<div class="tiny muted">' + (active ? 'выдано ' + C.dateRu(c.grantedAt) : 'отозвано ' + C.dateRu(c.revokedAt)) + ' · версия ' + esc(c.version) + (c.by ? ' · представитель' : '') + '</div></div>' +
            (active ? '<button class="btn btn--sm btn--danger" data-act="consent-revoke" data-id="' + c.id + '">Отозвать</button>'
              : U.badge('отозвано', 'red')) + '</div>';
        }).join('') + '</div>' +
          U.note('Отзыв согласия немедленно прекращает соответствующую обработку: тренер теряет доступ к тренировочным данным, кабинет арендатора — к методике.', 'gold')
      }) +
      U.card({
        title: 'Проверка прав доступа',
        body: '<div class="small muted" style="margin-bottom:10px">Попробуем из текущей роли запросить закрытые данные чужого аватара: <b>' + esc(target.alias) + '</b>.</div>' +
          '<button class="btn btn--block" data-act="probe-access" data-id="' + target.id + '">Запросить Плоскость 3</button>' +
          '<div style="margin-top:10px">' + (probe.allow ? U.note('Доступ разрешён: ' + esc(probe.reason), 'green') : U.forbidden(probe.reason)) + '</div>' +
          '<div class="tiny muted" style="margin-top:10px">Федерация видит только паспортные и соревновательные данные. Арендатор методики не получает персональных данных владельца.</div>'
      }) +
      '</div>' +

      '<div class="section"><h2>Журнал доступа к закрытым данным</h2>' +
      U.table(['Когда', 'Кто', 'К чему', 'Плоскость', 'Основание', 'Результат'],
        log.map(function (l) {
          var a = acc(state, l.actorId) || { short: l.actorId };
          var s = av(state, l.subject) || { alias: l.subject };
          return [C.dateTimeRu(l.at), esc(a.short), esc(s.alias), 'P' + l.plane, esc(l.reason),
            l.result === 'allow' ? U.badge('разрешено', 'green') : U.badge('отказ', 'red')];
        })) +
      U.note('Журнал ведётся отдельно от обычных логов, не редактируется и выгружается по запросу ответственного за обработку данных.') +
      '</div>' +

      '<div class="section"><h2>Права субъекта</h2>' +
      '<div class="grid grid--3">' +
      U.card({ title: 'Экспорт данных', body: '<div class="small muted" style="margin-bottom:10px">Выгрузка всех своих данных в машиночитаемом виде (JSON).</div><button class="btn btn--block" data-act="export">Скачать JSON</button>' }) +
      U.card({ title: 'Удаление', body: '<div class="small muted" style="margin-bottom:10px">Согласия отзываются, закрытая плоскость зачищается, методика снимается с аренды.</div><button class="btn btn--block btn--danger" data-act="delete-account">Запросить удаление</button>' }) +
      U.card({ title: 'Демонстрационные данные', body: '<div class="small muted" style="margin-bottom:10px">Сбросить демо-контур к исходному состоянию.</div><button class="btn btn--block" data-act="reset">Сбросить демо</button>' }) +
      '</div></div>';
  });

  /* ================= ПРАВОВОЙ КОНТУР ================= */
  C.Router.register('/legal', function () {
    return '<div class="page-head"><h1>Правовой контур системы</h1>' +
      '<p>Система проектировалась от ограничений, а не от возможностей: сначала определялось, что делать нельзя, и только затем — как сделать полезное в этих рамках.</p></div>' +

      '<div class="section"><h2>Три плоскости данных</h2>' + U.planes() + '</div>' +

      '<div class="section"><h2>Учтённые нормы</h2>' +
      U.table(['Код', 'Норма', 'Требование', 'Как реализовано'],
        global.LAWS.map(function (l) {
          return ['<span class="mono tiny">' + esc(l.code) + '</span>', esc(l.law), esc(l.rule), esc(l.impl)];
        })) + '</div>' +

      '<div class="section"><h2>Что изменено относительно исходной концепции</h2>' +
      '<p class="small muted" style="margin:-4px 0 10px">Семь положений исходных документов заменены юридически допустимыми аналогами. Механики сохранены — изменена форма расчётов и доступа.</p>' +
      U.table(['Как было в концепции', 'Как реализовано', 'Основание'],
        global.CONCEPT_DELTA.map(function (d) {
          return ['<span class="muted">' + esc(d.from) + '</span>', '<b>' + esc(d.to) + '</b>', '<span class="tiny">' + esc(d.why) + '</span>'];
        })) + '</div>' +

      '<div class="section"><h2>ИИ: границы применения</h2>' +
      '<div class="grid grid--2">' +
      U.card({ title: 'Что ИИ делает', body: '<ul class="small" style="margin:0;padding-left:18px">' +
        '<li>считает признаки накопленной усталости по нагрузке, сну и реакции;</li>' +
        '<li>предлагает микроцикл на основе методических блоков;</li>' +
        '<li>объясняет каждый вывод списком факторов с весами;</li>' +
        '<li>передаёт решения с высоким уровнем тренеру (HITL).</li></ul>' }) +
      U.card({ title: 'Что ИИ не делает никогда', body: '<ul class="small" style="margin:0;padding-left:18px">' +
        '<li>не ставит диагнозы и не назначает лечение (323-ФЗ);</li>' +
        '<li>не делает выводов о допинге;</li>' +
        '<li>не даёт финансовых и инвестиционных советов;</li>' +
        '<li>не оценивает «профпригодность» и не прогнозирует доход.</li></ul>' }) +
      '</div>' +
      U.note('Любую рекомендацию можно отключить. Модель версионируется, все выданные рекомендации пишутся в журнал вместе с реакцией человека.') +
      '</div>' +

      '<div class="section"><h2>Чек-лист 152-ФЗ</h2>' +
      U.table(['Пункт', 'Состояние'], [
        ['Раздельные согласия по целям обработки, с версией текста', U.badge('реализовано', 'green')],
        ['Согласие на специальные категории — отдельно', U.badge('реализовано', 'green')],
        ['Согласие несовершеннолетнего — через законного представителя', U.badge('реализовано', 'green')],
        ['Право на доступ, копию, уточнение, блокирование, удаление', U.badge('реализовано', 'green')],
        ['Журнал доступа к специальным категориям', U.badge('реализовано', 'green')],
        ['Хранение только на территории РФ', U.badge('для промышленного контура', 'amber')],
        ['Уведомление Роскомнадзора, назначение ответственного', U.badge('зона заказчика', 'amber')],
        ['Аттестация по требованиям ФСТЭК (при включении в ГИС)', U.badge('этап 2', '')]
      ]) +
      '</div>' +

      '<div class="section"><h2>Авторство и распределение прав</h2>' +
      '<div class="grid grid--2">' +
      U.card({ cls: 'card--gold', title: 'Правообладатель', body: '<div class="small">Архитектурная концепция, алгоритмы (каскад роялти, граф методик, модель плоскостей, механика наследования) и исключительные права принадлежат <b>Белякову Максиму Александровичу</b>.</div>' }) +
      U.card({ title: 'Разработчик', body: '<div class="small">Фонд содействия развитию социальных проектов выступает подрядчиком: разработка кода, ядра аналитики, интеграций и сопровождение — по договору с правообладателем. Поэтому демонстрационный контур размещён на сайте фонда.</div>' }) +
      '</div>' +
      U.note('Условия использования закреплены в файле <b>LICENSE</b> в корне проекта: исключительные права принадлежат правообладателю; демонстрационное ознакомление и цитирование со ссылкой разрешены, воспроизведение, переработка и коммерческое использование — по договору.') +
      U.note('Демонстрационный контур не обрабатывает реальные персональные данные. Все имена, результаты и договоры — синтетические.', 'gold') +
      '</div>';
  });

  /* ================= НАСЛЕДОВАНИЕ ================= */
  C.Router.register('/legacy', function (state) {
    var lg = state.legacy;
    var ownerAvatar = av(state, 'av-lebedev');
    var blocks = state.blocks.filter(function (b) { return b.ownerAvatarId === 'av-lebedev'; });

    return '<div class="page-head"><h1>Наследование методического наследия</h1>' +
      '<p>Модуль M7. Передаётся не аккаунт и не персональные данные, а методическое ядро и право на роялти — так механика «спортивной династии» работает в рамках ГК РФ и 152-ФЗ.</p></div>' +

      '<div class="grid grid--2">' +
      U.card({
        title: 'Завещание наследия',
        body: '<table class="tbl" style="min-width:0"><tbody>' +
          row('Владелец наследия', (acc(state, lg.ownerId) || {}).fio) +
          row('Наследник / доверенное лицо', lg.heirName) +
          row('Объект передачи', 'методические блоки (' + blocks.length + ') и право на роялти') +
          row('Персональные данные', 'не передаются') +
          row('Статус', lg.status === 'active' ? 'передано наследнику' : (lg.status === 'draft' ? 'черновик' : lg.status)) +
          '</tbody></table>' +
          '<div class="btn-row" style="margin-top:12px">' +
          '<button class="btn btn--gold" data-act="legacy-activate">' + (lg.status === 'active' ? 'Наследие передано' : 'Активировать передачу (демо)') + '</button>' +
          '<button class="btn" data-act="legacy-memorial">Включить мемориальный режим</button>' +
          '</div>'
      }) +
      U.card({
        title: 'Что происходит с данными',
        body: '<div class="list small">' +
          '<div class="row"><span class="badge badge--green">передаётся</span><span>методические блоки, версии, дерево решений</span></div>' +
          '<div class="row"><span class="badge badge--green">передаётся</span><span>право на роялти и отчётность по нему</span></div>' +
          '<div class="row"><span class="badge badge--red">не передаётся</span><span>персональные данные, контакты, здоровье</span></div>' +
          '<div class="row"><span class="badge badge--red">не передаётся</span><span>доступ к закрытой плоскости и переписке</span></div>' +
          '</div>' +
          U.note('Активация в промышленном контуре — только по документу о праве на наследство с проверкой оператором. В демо-режиме шаг выполняется без документов.', 'gold')
      }) +
      '</div>' +

      '<div class="section"><h2>Наследие в цифрах</h2>' +
      U.table(['Методический блок', 'Уровень', 'Цена', 'Статус'], blocks.map(function (b) {
        return [esc(b.title), b.lineageDepth ? 'ветвь ' + b.lineageDepth : 'корневая', C.money(b.priceRub), U.badge('в аренде', 'green')];
      })) +
      '</div>';
  });

  /* ================= ДЕЙСТВИЯ ================= */
  window.ACTIONS['verify-request'] = function (state) {
    var a = myAvatar(state);
    if (!a) return;
    a.status = 'pending';
    state.verifications.push({ id: C.uid('vr'), avatarId: a.id, kind: 'Повторная верификация', submittedAt: new Date().toISOString(), status: 'pending', docs: 'Заявка из личного кабинета' });
    C.toast('Заявка отправлена федерации. Ожидает проверки.', 'ok');
    C.Router.render();
  };

  window.ACTIONS['consent-revoke'] = function (state, el) {
    var id = el.getAttribute('data-id');
    var c = state.consents.filter(function (x) { return x.id === id; })[0];
    if (!c) return;
    if (c.revokedAt) { C.toast('Согласие уже отозвано'); return; }
    C.modal.open(
      '<h3>Отозвать согласие?</h3>' +
      '<p class="small">' + esc(global.CONSENT_TYPES[c.type]) + '</p>' +
      '<div class="note note--red">После отзыва обработка по этой цели прекращается немедленно. Тренер и арендаторы теряют соответствующий доступ. Вернуть согласие можно в любой момент.</div>' +
      '<div class="btn-row" style="margin-top:14px"><button class="btn btn--danger" data-act="consent-revoke-confirm" data-id="' + c.id + '">Отозвать</button>' +
      '<button class="btn" data-act="modal-close">Отмена</button></div>'
    );
  };

  window.ACTIONS['consent-revoke-confirm'] = function (state, el) {
    var id = el.getAttribute('data-id');
    var c = state.consents.filter(function (x) { return x.id === id; })[0];
    if (c) {
      c.revokedAt = new Date().toISOString();
      var type = c.type;
      state.accessLog.push({
        id: C.uid('al'), at: new Date().toISOString(), actorId: state.session.accountId,
        subject: (myAvatar(state) || {}).id || '—', plane: 3, reason: 'Отзыв согласия: ' + type, result: 'allow'
      });
      E.ledgerAppend(state, 'consent.revoked', { consentId: c.id, type: type });
    }
    C.modal.close();
    C.toast('Согласие отозвано. Обработка прекращена.', 'warn');
    C.Router.render();
  };

  window.ACTIONS['probe-access'] = function (state, el) {
    var targetId = el.getAttribute('data-id');
    var actorId = state.session.accountId;
    var res = E.canAccessPlane3(state, actorId, targetId);
    state.accessLog.push({
      id: C.uid('al'), at: new Date().toISOString(), actorId: actorId, subject: targetId, plane: 3,
      reason: 'Ручной запрос из интерфейса', result: res.allow ? 'allow' : 'deny'
    });
    C.toast(res.allow ? 'Доступ разрешён: ' + res.reason : 'Отказ в доступе: ' + res.reason, res.allow ? 'ok' : 'err');
    C.Router.render();
  };

  window.ACTIONS['export'] = function (state) {
    var m = me(state);
    var a = myAvatar(state);
    var payload = {
      exportedAt: new Date().toISOString(),
      subject: { id: m.id, fio: m.fio },
      avatar: a ? publicView(state, a) : null,
      consents: state.consents.filter(function (c) { return c.accountId === m.id; }),
      trainings: (a && state.training[a.id]) || [],
      results: a ? state.results.filter(function (r) { return r.avatarId === a.id; }) : [],
      points: E.pointsBalance(state, m.id),
      note: 'Демонстрационная выгрузка. В промышленном контуре формируется сервером в течение 24 часов.'
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'cas-export-' + m.id + '.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    C.toast('Файл выгрузки сформирован', 'ok');
  };

  window.ACTIONS['delete-account'] = function (state) {
    C.modal.open('<h3>Запрос на удаление данных</h3>' +
      '<div class="small">В демонстрационном контуре выполняется сразу. В промышленном — в течение 30 дней, с уведомлением и возможностью отмены.</div>' +
      '<ul class="small"><li>согласия отзываются;</li><li>закрытая плоскость зачищается;</li><li>методические блоки снимаются с аренды;</li><li>журнал аудита сохраняется в обезличенном виде.</li></ul>' +
      '<div class="btn-row"><button class="btn btn--danger" data-act="delete-account-confirm">Подтвердить</button><button class="btn" data-act="modal-close">Отмена</button></div>');
  };

  window.ACTIONS['delete-account-confirm'] = function (state) {
    var m = me(state);
    state.consents.forEach(function (c) { if (c.accountId === m.id && !c.revokedAt) c.revokedAt = new Date().toISOString(); });
    state.blocks.forEach(function (b) {
      var a = av(state, b.ownerAvatarId);
      if (a && a.ownerId === m.id) b.status = 'withdrawn';
    });
    var a = myAvatar(state);
    if (a) a.visibility = 'private';
    E.ledgerAppend(state, 'account.deletion_requested', { accountId: m.id });
    C.modal.close();
    C.toast('Демо: данные закрыты, методики сняты с аренды, журнал сохранён.', 'warn');
    C.Router.render();
  };

  window.ACTIONS['legacy-activate'] = function (state) {
    state.legacy.status = 'active';
    state.legacy.basis = 'Демонстрационный документ о праве на наследство № ДЕМО-' + Math.floor(Math.random() * 9000 + 1000);
    E.ledgerAppend(state, 'legacy.transferred', { heir: state.legacy.heirName, basis: state.legacy.basis });
    C.toast('Методическое наследие передано. Персональные данные не передавались.', 'ok');
    C.Router.render();
  };

  window.ACTIONS['legacy-memorial'] = function (state) {
    var a = av(state, 'av-lebedev');
    state.memorial = { avatarId: a.id, at: new Date().toISOString() };
    a.visibility = 'public';
    C.toast('Мемориальный режим: витрина и методика открыты, доступ к личным данным закрыт навсегда.', 'warn');
    C.Router.render();
  };

  global.__CAS_MAIN = { publicView: publicView, privateView: privateView, me: me, myAvatar: myAvatar };
})(window);
