/* ЦАС · демонстрационные данные (синтетические, реальных ПДн нет) */
var DATA_VERSION = 2;

/* ---------- справочники ---------- */
var DISCIPLINES = {
  cs2: {
    title: 'CS2 (компьютерный спорт)',
    metrics: [
      { code: 'kd', title: 'K/D', unit: '', better: 'high' },
      { code: 'adr', title: 'ADR (урон за раунд)', unit: '', better: 'high' },
      { code: 'hs', title: 'Хедшоты', unit: '%', better: 'high' },
      { code: 'reaction', title: 'Реакция', unit: 'мс', better: 'low' },
      { code: 'clutch', title: 'Клатчи 1×N', unit: '%', better: 'high' }
    ]
  },
  valorant: {
    title: 'Valorant (компьютерный спорт)',
    metrics: [
      { code: 'acs', title: 'ACS', unit: '', better: 'high' },
      { code: 'kd', title: 'K/D', unit: '', better: 'high' },
      { code: 'hs', title: 'Хедшоты', unit: '%', better: 'high' },
      { code: 'reaction', title: 'Реакция', unit: 'мс', better: 'low' }
    ]
  },
  dota2: {
    title: 'Dota 2 (компьютерный спорт)',
    metrics: [
      { code: 'gpm', title: 'GPM', unit: '', better: 'high' },
      { code: 'lh10', title: 'LH@10', unit: '', better: 'high' },
      { code: 'kda', title: 'KDA', unit: '', better: 'high' }
    ]
  }
};

var RANKS = ['3-й разряд', '2-й разряд', '1-й разряд', 'КМС', 'МС', 'МСМК'];
var REGIONS = ['Курская область', 'Белгородская область', 'Воронежская область', 'Орловская область', 'Тульская область'];

var CONSENT_TYPES = {
  pd: 'Обработка персональных данных (152-ФЗ)',
  health: 'Данные о состоянии здоровья (спец. категория)',
  showcase: 'Публикация витрины аватара',
  coach: 'Передача тренировочных данных тренеру',
  rent: 'Участие в аренде методик и расчётах роялти',
  marketing: 'Информационные и маркетинговые сообщения'
};

/* Правовой контур: что исключено из исходной концепции и почему */
var LAWS = [
  { code: 'LAW-01', law: '152-ФЗ, ст. 10', rule: 'Специальные категории ПДн (здоровье, биометрия) — особый режим', impl: 'Отдельный сегмент хранения, шифрование полей, журнал доступа, отдельное согласие' },
  { code: 'LAW-02', law: '572-ФЗ', rule: 'Биометрия — только через ЕБС', impl: 'В демо-контуре биометрия не собирается; поле закрыто с пояснением' },
  { code: 'LAW-03', law: '323-ФЗ', rule: 'Врачебная тайна, медицинская деятельность', impl: 'Нет диагнозов и назначений: только «признаки усталости» и «обратитесь к тренеру и врачу»' },
  { code: 'LAW-04', law: '161-ФЗ, ст. 27 ФЗ «О банках…»', rule: 'Запрет денежных суррогатов', impl: 'Баллы неконвертируемы; выплаты только в рублях по договору через платёжного партнёра' },
  { code: 'LAW-05', law: '259-ФЗ', rule: 'Инвестиционные платформы', impl: 'Функция «инвестиции с роялти» не реализуется: только лицензионные договоры и целевые донаты' },
  { code: 'LAW-06', law: 'ГК РФ ст. 1112, 152-ФЗ', rule: 'Наследование: имущественные права — да, ПДн — нет', impl: 'Наследуется методика и право на роялти; личные данные не передаются, аккаунт → мемориальный режим' },
  { code: 'LAW-07', law: '152-ФЗ ст. 9, ч. 5 ст. 18', rule: 'Отзыв согласия, хранение на территории РФ', impl: 'Отзыв в один клик, экспорт и удаление данных, размещение только в РФ' },
  { code: 'LAW-08', law: '152-ФЗ, 436-ФЗ', rule: 'Несовершеннолетние', impl: 'Профиль ребёнка — только по приглашению тренера и с согласия законного представителя; запрет публичных рейтингов и рекламы' },
  { code: 'LAW-09', law: '149-ФЗ, приказ ФСТЭК № 17, 187-ФЗ', rule: 'Требования к ГИС и КИИ', impl: 'Архитектура допускает аттестацию; в демо — модель разграничения доступа и журналы' },
  { code: 'LAW-10', law: '38-ФЗ, 436-ФЗ', rule: 'Реклама и маркировка', impl: 'Скины со логотипами спонсоров маркируются «Реклама»; данные детей не используются' },
  { code: 'LAW-11', law: '152-ФЗ ст. 12', rule: 'Трансграничная передача', impl: 'Обмен только обезличенными методиками; данных за рубеж не передаём' }
];

/* Что изменено относительно исходных документов концепции */
var CONCEPT_DELTA = [
  { from: 'Антидопинговый контроль через анализ биометрии', to: 'Исключено: только импорт официального статуса', why: 'Компетенция РУСАДА/ВАДА; LAW-01, LAW-02' },
  { from: 'Виртуальная валюта с обменом и выводом', to: 'Неконвертируемые баллы + рублёвые выплаты по договору', why: 'LAW-04' },
  { from: 'Внутренний банкинг платформы', to: 'Платёжный партнёр (НКО / агрегатор)', why: 'LAW-04, лицензия ЦБ' },
  { from: 'Наследование аватара целиком', to: 'Наследование методического ядра и роялти', why: 'LAW-06' },
  { from: 'Инвестиции внутри платформы с получением роялти', to: 'Лицензионные договоры и целевые донаты', why: 'LAW-05' },
  { from: 'Обмен данными со спортсменами других стран', to: 'Публикация обезличенных методик', why: 'LAW-11' },
  { from: 'ИИ даёт финансовые рекомендации', to: 'Аналитика начислений без советов по инвестициям', why: 'Проф. ответственность, LAW-05' }
];

/* ---------- построение начального состояния ---------- */
function buildSeedState() {
  var now = Date.now();
  var day = function (n) { return new Date(now - n * 864e5).toISOString(); };

  /* тренировочные серии: 14 дней */
  var trainingArtem = [];
  var rpePlan = [6, 5, 7, 6, 8, 5, 4, 6, 7, 7, 8, 8, 9, 9];
  var sleepPlan = [7.6, 7.8, 7.4, 7.5, 7.1, 7.9, 8.1, 7.4, 7.0, 6.9, 6.6, 6.4, 6.1, 5.9];
  var reactPlan = [212, 208, 214, 210, 216, 206, 203, 209, 213, 218, 224, 229, 236, 241];
  var loadPlan = [95, 80, 110, 90, 135, 70, 45, 100, 115, 120, 140, 145, 160, 155];
  for (var i = 13; i >= 0; i--) {
    var idx = 13 - i;
    trainingArtem.push({
      id: 'tr-' + i,
      date: day(i),
      type: ['Тренировка', 'Тренировка', 'Разбор', 'Тренировка', 'Турнирный день'][idx % 5],
      loadMin: loadPlan[idx],
      rpe: rpePlan[idx],
      sleepH: sleepPlan[idx],
      reactionMs: reactPlan[idx],
      source: idx % 4 === 0 ? 'wearable' : 'manual',
      done: true
    });
  }

  return {
    __v: DATA_VERSION,
    role: 'athlete',
    session: { accountId: 'acc-artem', startedAt: day(0) },
    aiEnabled: true,
    memorial: null,

    accounts: [
      { id: 'acc-artem', fio: 'Артём Соколов', short: 'А. Соколов', role: 'athlete', avatarId: 'av-artem', age: 19, region: 'Курская область', email: 'a.sokolov@example.org', isMinor: false },
      { id: 'acc-iris', fio: 'Ирина Лаврова', short: 'И. Лаврова', role: 'athlete', avatarId: 'av-iris', age: 21, region: 'Курская область', email: 'i.lavrova@example.org', isMinor: false },
      { id: 'acc-danil', fio: 'Даниил Ковалёв', short: 'Д. Ковалёв', role: 'athlete', avatarId: 'av-danil', age: 16, region: 'Курская область', email: '—', isMinor: true, guardianId: 'acc-guard' },
      { id: 'acc-guard', fio: 'Ольга Ковалёва', short: 'О. Ковалёва', role: 'athlete', avatarId: null, age: 41, region: 'Курская область', email: 'o.kovaleva@example.org', isMinor: false, wardId: 'acc-danil' },
      { id: 'acc-coach', fio: 'Сергей Ильин', short: 'С. Ильин', role: 'coach', avatarId: 'av-ilyin', age: 34, region: 'Курская область', email: 's.ilin@example.org', isMinor: false },
      { id: 'acc-teacher', fio: 'Наталья Громова', short: 'Н. Громова', role: 'coach', avatarId: 'av-gromova', age: 46, region: 'Курская область', email: 'n.gromova@example.org', isMinor: false },
      { id: 'acc-lebedev', fio: 'Алексей Лебедев', short: 'А. Лебедев', role: 'coach', avatarId: 'av-lebedev', age: 52, region: 'Курская область', email: 'a.lebedev@example.org', isMinor: false },
      { id: 'acc-sponsor', fio: 'ООО «Киберпарк Курск»', short: 'Киберпарк', role: 'sponsor', avatarId: null, age: null, region: 'Курская область', email: 'pr@example.org', isMinor: false },
      { id: 'acc-fed', fio: 'КРМОО «Федерация компьютерного спорта»', short: 'Федерация', role: 'federation', avatarId: null, age: null, region: 'Курская область', email: '46@example.org', isMinor: false }
    ],

    avatars: [
      {
        id: 'av-artem', ownerId: 'acc-artem', discipline: 'cs2', alias: 'Стрелок · Курск',
        rank: 'КМС', rating: 1842, federation: 'КРМОО «ФКС»', status: 'verified',
        verifiedAt: day(24), verifyExpires: new Date(now + 340 * 864e5).toISOString(),
        visibility: 'public', socialScore: 0,
        achievements: [
          { id: 'ach-1', title: 'Кубок Курской области по CS2', place: 1, date: day(38), level: 'региональный' },
          { id: 'ach-2', title: 'Первенство ЦФО (юниоры)', place: 3, date: day(96), level: 'межрегиональный' },
          { id: 'ach-3', title: 'Кубок губернатора по компьютерному спорту', place: 2, date: day(151), level: 'региональный' }
        ],
        medGroup: 'I (основная)', admissionUntil: new Date(now + 210 * 864e5).toISOString()
      },
      {
        id: 'av-iris', ownerId: 'acc-iris', discipline: 'valorant', alias: 'Капитан · Курск',
        rank: 'МС', rating: 1910, federation: 'КРМОО «ФКС»', status: 'verified',
        verifiedAt: day(51), verifyExpires: new Date(now + 310 * 864e5).toISOString(),
        visibility: 'public', socialScore: 0,
        achievements: [{ id: 'ach-4', title: 'Чемпионат ЦФО по Valorant', place: 1, date: day(64), level: 'межрегиональный' }],
        medGroup: 'I (основная)', admissionUntil: new Date(now + 150 * 864e5).toISOString()
      },
      {
        id: 'av-danil', ownerId: 'acc-danil', discipline: 'cs2', alias: 'Юниор · Курск',
        rank: '1-й разряд', rating: 1512, federation: 'КРМОО «ФКС»', status: 'pending',
        verifiedAt: null, verifyExpires: null, visibility: 'link', socialScore: 0,
        achievements: [{ id: 'ach-5', title: 'Турнир «Первая лига», юноши', place: 2, date: day(19), level: 'региональный' }],
        medGroup: 'II (подготовительная)', admissionUntil: new Date(now + 90 * 864e5).toISOString(),
        guardianConfirmed: true
      },
      {
        id: 'av-lebedev', ownerId: 'acc-lebedev', discipline: 'cs2', alias: 'Легенда · методист',
        rank: 'МСМК', rating: 1620, federation: 'КРМОО «ФКС»', status: 'verified',
        verifiedAt: day(400), verifyExpires: new Date(now + 40 * 864e5).toISOString(),
        visibility: 'public', socialScore: 0, kind: 'coach',
        achievements: [{ id: 'ach-6', title: 'Зал славы ЦАС, 2025', place: 1, date: day(300), level: 'всероссийский' }],
        medGroup: '—', admissionUntil: null
      },
      {
        id: 'av-ilyin', ownerId: 'acc-coach', discipline: 'cs2', alias: 'Тренер · Курск',
        rank: 'КМС', rating: 1705, federation: 'КРМОО «ФКС»', status: 'verified',
        verifiedAt: day(210), verifyExpires: new Date(now + 280 * 864e5).toISOString(),
        visibility: 'public', socialScore: 0, kind: 'coach',
        achievements: [{ id: 'ach-7', title: 'Подготовлено 9 КМС', place: 1, date: day(120), level: 'тренерское' }],
        medGroup: '—', admissionUntil: null
      },
      {
        id: 'av-gromova', ownerId: 'acc-teacher', discipline: 'cs2', alias: 'Педагог · Курск',
        rank: '—', rating: 0, federation: 'КРМОО «ФКС»', status: 'verified',
        verifiedAt: day(180), verifyExpires: new Date(now + 290 * 864e5).toISOString(),
        visibility: 'public', socialScore: 0, kind: 'teacher',
        achievements: [], medGroup: '—', admissionUntil: null
      }
    ],

    activities: [
      { avatarId: 'av-artem', date: day(2), kind: 'training', text: 'Тренировочный день: 140 мин, RPE 8' },
      { avatarId: 'av-artem', date: day(6), kind: 'competition', text: 'Кубок области: 1 место' },
      { avatarId: 'av-artem', date: day(9), kind: 'method', text: 'Опубликована новая версия методического блока v2' },
      { avatarId: 'av-iris', date: day(4), kind: 'training', text: 'Ретейки Ascent: 3 подхода' },
      { avatarId: 'av-ilyin', date: day(5), kind: 'method', text: 'Адаптация методики под CS2 — опубликована' }
    ],

    competitions: [
      { id: 'cmp-1', title: 'Кубок Курской области по CS2', level: 'региональный', discipline: 'cs2', date: day(38), place: 'Курск', ekp: 'ЕКП-2026/0463' },
      { id: 'cmp-2', title: 'Первенство ЦФО по CS2 (юниоры)', level: 'межрегиональный', discipline: 'cs2', date: day(96), place: 'Воронеж', ekp: 'ЕКП-2026/0311' },
      { id: 'cmp-3', title: 'Чемпионат ЦФО по Valorant', level: 'межрегиональный', discipline: 'valorant', date: day(64), place: 'Белгород', ekp: 'ЕКП-2026/0402' },
      { id: 'cmp-4', title: 'Турнир «Первая лига» (юноши)', level: 'региональный', discipline: 'cs2', date: day(19), place: 'Курск', ekp: 'ЕКП-2026/0517' },
      { id: 'cmp-5', title: 'Кубок губернатора по компьютерному спорту', level: 'региональный', discipline: 'cs2', date: day(151), place: 'Курск', ekp: 'ЕКП-2025/0899' }
    ],

    results: [
      { id: 'res-1', avatarId: 'av-artem', competitionId: 'cmp-1', place: 1, confirmed: true, disputed: false, metrics: { kd: '1.34', adr: '86', hs: '47', reaction: '212', clutch: '31' } },
      { id: 'res-2', avatarId: 'av-artem', competitionId: 'cmp-2', place: 3, confirmed: true, disputed: false, metrics: { kd: '1.12', adr: '78', hs: '42', reaction: '218', clutch: '22' } },
      { id: 'res-3', avatarId: 'av-artem', competitionId: 'cmp-5', place: 2, confirmed: true, disputed: false, metrics: { kd: '1.21', adr: '81', hs: '44', reaction: '215', clutch: '27' } },
      { id: 'res-4', avatarId: 'av-iris', competitionId: 'cmp-3', place: 1, confirmed: true, disputed: false, metrics: { acs: '268', kd: '1.41', hs: '51', reaction: '206' } },
      { id: 'res-5', avatarId: 'av-danil', competitionId: 'cmp-4', place: 2, confirmed: false, disputed: false, metrics: { kd: '1.05', adr: '72', hs: '39', reaction: '248', clutch: '14' } }
    ],

    training: {
      'av-artem': trainingArtem,
      'av-iris': trainingArtem.slice(0, 8).map(function (t, i) {
        return { id: 'tri-' + i, date: t.date, type: 'Тренировка', loadMin: 90 + i * 4, rpe: 6 + (i % 3), sleepH: 7.2 + (i % 4) * 0.2, reactionMs: 205 + (i % 5) * 3, source: 'manual', done: true };
      }),
      'av-danil': trainingArtem.slice(0, 6).map(function (t, i) {
        return { id: 'trd-' + i, date: t.date, type: 'Тренировка', loadMin: 60 + i * 3, rpe: 5 + (i % 3), sleepH: 8 + (i % 3) * 0.2, reactionMs: 245 + (i % 4) * 4, source: 'manual', done: true };
      })
    },

    blocks: [
      {
        id: 'bl-root', ownerAvatarId: 'av-lebedev', type: 'plan', title: 'Микроцикл на реакцию: базовая школа',
        summary: 'Пятидневный микроцикл перед турниром: дозирование зрительной нагрузки, разминка на реакцию, восстановление между картами.',
        level: 'любой', ageGroup: '16+', priceRub: 900, forkAllowed: true, derivedFrom: null, lineageDepth: 0,
        version: 1, status: 'published', publishedAt: day(210),
        body: 'День 1 — объём 60 %, фокус на точности. День 2 — 80 %, добавляем смену прицела. День 3 — разгрузка 40 %, когнитивные тесты. День 4 — 70 %, имитация турнирного дня. День 5 — 30 %, сон не менее 8 часов, никаких новых тактик.',
        versions: [{ v: 1, date: day(210), note: 'Первая публикация' }]
      },
      {
        id: 'bl-cs2', ownerAvatarId: 'av-ilyin', type: 'plan', title: 'Микроцикл на реакцию: адаптация под CS2',
        summary: 'Та же школа, пересчитанная под CS2: раунды по 1:55, тайминги выхода, работа с дымом и вспышками.',
        level: 'КМС и ниже', ageGroup: '16+', priceRub: 1000, forkAllowed: true, derivedFrom: 'bl-root', lineageDepth: 1,
        version: 2, status: 'published', publishedAt: day(5),
        body: 'День 1 — 60 % объёма, только aim-карты. День 2 — 85 %, добавляем ретейки 3×3. День 3 — разгрузка, разбор демо. День 4 — 75 %, полный турнирный день с таймингами. День 5 — 30 % и обязательный сон 8+ часов. Отличие от базовой школы: сокращён объём прицельных упражнений и добавлен блок «вспышки и звук».',
        versions: [
          { v: 1, date: day(60), note: 'Адаптация базовой школы' },
          { v: 2, date: day(5), note: 'Сокращён объём прицельных упражнений на 15 %, добавлен блок «вспышки и звук»' }
        ]
      },
      {
        id: 'bl-artem', ownerAvatarId: 'av-artem', type: 'plan', title: 'Микроцикл на реакцию: версия для стрелков 18–20',
        summary: 'Мой вариант: меньше объёма, больше сна, добавлены когнитивные тесты утром. Реакция выросла с 236 до 212 мс за 6 недель.',
        level: 'КМС', ageGroup: '18+', priceRub: 1100, forkAllowed: true, derivedFrom: 'bl-cs2', lineageDepth: 2,
        version: 1, status: 'published', publishedAt: day(12),
        body: 'Утро — тест реакции 3 подхода. Основная работа — 60 % от объёма школы. Вечер — разбор одной карты, не больше. Сон — приоритет выше тренировки: если сон ниже 7 часов, объём режется вдвое.',
        versions: [{ v: 1, date: day(12), note: 'Ветвь от «Микроцикл на реакцию: адаптация под CS2»' }]
      },
      {
        id: 'bl-mirage', ownerAvatarId: 'av-artem', type: 'tactic', title: 'Mirage: контроль центра через окно',
        summary: 'Разбор раунда: тайминги выхода на центр, работа со смоками, размен. С видеоразбором и деревом решений.',
        level: '1-й разряд и выше', ageGroup: '16+', priceRub: 1500, forkAllowed: true, derivedFrom: null, lineageDepth: 0,
        version: 3, status: 'published', publishedAt: day(30),
        body: '1) Выход на окно на 22-й секунде. 2) Смок на коннектор — только после фрага в центре. 3) Если центр не взят к 40-й секунде — откат и работа через B.',
        versions: [
          { v: 1, date: day(120), note: 'Черновик' },
          { v: 2, date: day(60), note: 'Добавлено видео' },
          { v: 3, date: day(30), note: 'Уточнены тайминги после 12 разборов' }
        ]
      },
      {
        id: 'bl-eco', ownerAvatarId: 'av-ilyin', type: 'tree', title: 'Дерево решений: эко-раунд 3-1',
        summary: 'Что делать на эко: стек, стакинг, тайминг выхода. Ветвление по счёту и оставшемуся времени.',
        level: 'любой', ageGroup: '16+', priceRub: 800, forkAllowed: false, derivedFrom: null, lineageDepth: 0,
        version: 1, status: 'published', publishedAt: day(48),
        body: 'Дерево из 9 узлов. Корень: «счёт 3-1, наша эко». Ветви: время > 30 с / < 30 с; противник с AWP / без.',
        tree: {
          root: 'n1',
          nodes: [
            { id: 'n1', text: 'Счёт 3-1, эко-раунд', kind: 'start' },
            { id: 'n2', text: 'Осталось > 30 с', kind: 'cond' },
            { id: 'n3', text: 'Осталось < 30 с', kind: 'cond' },
            { id: 'n4', text: 'Стек 4+1 на ближней', kind: 'act' },
            { id: 'n5', text: 'Быстрый выход через A', kind: 'act' },
            { id: 'n6', text: 'У противника AWP', kind: 'cond' },
            { id: 'n7', text: 'Играем на смок-размен', kind: 'act' },
            { id: 'n8', text: 'AWP нет', kind: 'cond' },
            { id: 'n9', text: 'Пробуем пистолетный пик', kind: 'act' }
          ],
          edges: [
            { from: 'n1', to: 'n2', label: 'время' }, { from: 'n1', to: 'n3', label: 'время' },
            { from: 'n2', to: 'n4' }, { from: 'n3', to: 'n5' },
            { from: 'n4', to: 'n6' }, { from: 'n6', to: 'n7' }, { from: 'n6', to: 'n8' }, { from: 'n8', to: 'n9' }
          ]
        },
        versions: [{ v: 1, date: day(48), note: 'Первая публикация' }]
      },
      {
        id: 'bl-sleep', ownerAvatarId: 'av-ilyin', type: 'recovery', title: 'Восстановление между картами',
        summary: 'Что делать в 20-минутном перерыве, чтобы не потерять реакцию к третьей карте.',
        level: 'любой', ageGroup: '16+', priceRub: 600, forkAllowed: true, derivedFrom: null, lineageDepth: 0,
        version: 1, status: 'published', publishedAt: day(75),
        body: 'Первые 5 минут — встать и пройтись. Следующие 5 — вода и еда без сахара. Последние 10 — тишина без экрана. Не смотреть разбор в перерыве: он поднимает тревожность.',
        versions: [{ v: 1, date: day(75), note: 'Первая публикация' }]
      },
      {
        id: 'bl-ped', ownerAvatarId: 'av-gromova', type: 'pedagogy', title: 'Как объяснять тактику 14-летним',
        summary: 'Методика педагога: одна идея за занятие, разбор ошибки без оценки личности, дневник прогресса.',
        level: 'тренер / педагог', ageGroup: 'для педагогов', priceRub: 1200, forkAllowed: true, derivedFrom: null, lineageDepth: 0,
        version: 1, status: 'published', publishedAt: day(96),
        body: 'Правило одной идеи: за занятие разбирается ровно одна тактическая идея. Ошибка разбирается через действие, а не через «ты невнимательный». Дневник прогресса ведёт сам ученик.',
        versions: [{ v: 1, date: day(96), note: 'Первая публикация' }]
      }
    ],

    contracts: [
      { id: 'cnt-1', blockId: 'bl-cs2', renterId: 'acc-danil', ownerId: 'acc-coach', months: 1, priceRub: 1000, commissionPct: 7, status: 'active', startsAt: day(10), endsAt: new Date(now + 20 * 864e5).toISOString(), contractVersion: 'v1.2', acceptedAt: day(10) },
      { id: 'cnt-2', blockId: 'bl-mirage', renterId: 'acc-iris', ownerId: 'acc-artem', months: 3, priceRub: 4500, commissionPct: 7, status: 'active', startsAt: day(21), endsAt: new Date(now + 69 * 864e5).toISOString(), contractVersion: 'v1.2', acceptedAt: day(21) }
    ],

    ledger: [],
    pointTx: [
      { id: 'pt-1', accountId: 'acc-artem', delta: 120, reason: 'Участие в турнире (Кубок области)', at: day(38) },
      { id: 'pt-2', accountId: 'acc-artem', delta: 60, reason: 'Подтверждённое достижение', at: day(36) },
      { id: 'pt-3', accountId: 'acc-artem', delta: 300, reason: 'Публикация методического блока', at: day(12) },
      { id: 'pt-4', accountId: 'acc-iris', delta: 150, reason: 'Участие в турнире (Чемпионат ЦФО)', at: day(64) }
    ],

    payouts: [],

    skins: [
      { id: 'sk-1', avatarId: 'av-artem', title: 'Скин «Курская дуга»', sponsorId: null, isAd: false, priceRub: 0, status: 'active' },
      { id: 'sk-2', avatarId: 'av-artem', title: 'Скин с логотипом «Киберпарк Курск»', sponsorId: 'acc-sponsor', isAd: true, priceRub: 0, status: 'active' },
      { id: 'sk-3', avatarId: 'av-iris', title: 'Скин «Капитан»', sponsorId: null, isAd: false, priceRub: 0, status: 'active' }
    ],

    sponsors: [
      { id: 'acc-sponsor', name: 'ООО «Киберпарк Курск»', campaigns: [{ id: 'camp-1', title: 'Поддержка юниоров Курска', budgetRub: 150000, spentRub: 48000, status: 'active' }] }
    ],

    consents: [
      { id: 'cs-1', accountId: 'acc-artem', type: 'pd', grantedAt: day(120), revokedAt: null, version: '1.0' },
      { id: 'cs-2', accountId: 'acc-artem', type: 'health', grantedAt: day(120), revokedAt: null, version: '1.0' },
      { id: 'cs-3', accountId: 'acc-artem', type: 'showcase', grantedAt: day(120), revokedAt: null, version: '1.0' },
      { id: 'cs-4', accountId: 'acc-artem', type: 'coach', grantedAt: day(60), revokedAt: null, version: '1.0' },
      { id: 'cs-5', accountId: 'acc-artem', type: 'rent', grantedAt: day(30), revokedAt: null, version: '1.1' },
      { id: 'cs-6', accountId: 'acc-artem', type: 'marketing', grantedAt: day(90), revokedAt: day(40), version: '1.0' },
      { id: 'cs-7', accountId: 'acc-danil', type: 'pd', grantedAt: day(30), revokedAt: null, version: '1.0', by: 'acc-guard' },
      { id: 'cs-8', accountId: 'acc-danil', type: 'health', grantedAt: day(30), revokedAt: null, version: '1.0', by: 'acc-guard' }
    ],

    accessLog: [
      { id: 'al-1', at: day(1), actorId: 'acc-coach', subject: 'av-artem', plane: 3, reason: 'Согласие на передачу тренировочных данных', result: 'allow' },
      { id: 'al-2', at: day(2), actorId: 'acc-fed', subject: 'av-artem', plane: 1, reason: 'Проверка витрины при верификации', result: 'allow' },
      { id: 'al-3', at: day(3), actorId: 'acc-iris', subject: 'av-artem', plane: 3, reason: 'Попытка доступа из кабинета арендатора', result: 'deny' },
      { id: 'al-4', at: day(4), actorId: 'acc-artem', subject: 'av-artem', plane: 3, reason: 'Владелец: просмотр своих данных', result: 'allow' }
    ],

    recommendations: [
      { id: 'rc-1', avatarId: 'av-artem', kind: 'load', title: 'Снизить объём тренировок на 30 % в ближайшие два дня', level: 'high', status: 'pending_coach', createdAt: day(0), model: 'rules-v1.3', factors: [{ code: 'rpe', label: 'RPE вырос при том же объёме', value: '+25 %', weight: 0.4 }, { code: 'sleep', label: 'Сон сократился', value: '−20 %', weight: 0.35 }, { code: 'reaction', label: 'Время реакции ухудшилось', value: '+15 мс', weight: 0.25 }] },
      { id: 'rc-2', avatarId: 'av-artem', kind: 'skill', title: 'Добавить 20 минут работы на хедшоты в микроцикл', level: 'info', status: 'new', createdAt: day(1), model: 'rules-v1.3', factors: [{ code: 'hs', label: 'Хедшоты ниже среднего по разряду', value: '47 %', weight: 0.5 }, { code: 'kd', label: 'K/D выше среднего', value: '1.34', weight: 0.3 }, { code: 'adr', label: 'ADR стабилен', value: '86', weight: 0.2 }] },
      { id: 'rc-3', avatarId: 'av-artem', kind: 'recovery', title: 'Вернуть вечерний блок сна: 7 дней подряд не менее 7,5 часа', level: 'info', status: 'new', createdAt: day(2), model: 'rules-v1.3', factors: [{ code: 'sleep', label: 'Средний сон за 7 дней', value: '6,6 ч', weight: 0.6 }, { code: 'rest', label: 'Нет дней полного отдыха', value: '9 дней', weight: 0.4 }] }
    ],

    verifications: [
      { id: 'vr-1', avatarId: 'av-danil', kind: 'Первичная верификация', submittedAt: day(2), status: 'pending', docs: 'Протокол турнира «Первая лига», согласие законного представителя' },
      { id: 'vr-2', avatarId: 'av-artem', kind: 'Изменение разряда (КМС)', submittedAt: day(26), status: 'approved', docs: 'Выписка о присвоении разряда' },
      { id: 'vr-3', avatarId: 'av-iris', kind: 'Подтверждение достижения', submittedAt: day(15), status: 'pending', docs: 'Протокол чемпионата ЦФО' }
    ],

    disputes: [
      { id: 'ds-1', type: 'Авторство методики', initiatorId: 'acc-teacher', subject: 'bl-cs2', status: 'in_review', openedAt: day(6), text: 'Заявлено совпадение с методикой «Правило одной идеи». Требуется сверка версий.' }
    ],

    legacy: {
      ownerId: 'acc-lebedev',
      heirName: 'Методическое наследие: семейный фонд Лебедевых',
      status: 'draft',
      basis: null,
      createdAt: day(30)
    },

    demo: { tourStep: 0 }
  };
}

/* Начальное наполнение журнала по демонстрационным договорам
   (использует тот же расчёт, что и рабочий код — никаких «нарисованных» цифр) */
function seedLedger(state) {
  if (!window.CAS_ECON || !state.ledger || state.ledger.length) return state;
  var E = window.CAS_ECON;
  state.contracts.forEach(function (c) {
    var split = E.calcSplit(state, c.blockId, c.priceRub);
    E.ledgerAppend(state, 'contract.paid', {
      contractId: c.id, blockId: c.blockId, renterId: c.renterId,
      amount: c.priceRub, commission: split.commission, royaltyTotal: split.royaltyTotal, ownerShare: split.ownerShare
    });
    split.royalties.forEach(function (r) {
      E.ledgerAppend(state, 'royalty.accrual', {
        contractId: c.id, blockId: r.blockId, level: r.level,
        beneficiaryAvatarId: r.beneficiaryAvatarId, percent: r.percent, amount: r.amount
      });
    });
    E.ledgerAppend(state, 'owner.accrual', { contractId: c.id, ownerId: c.ownerId, amount: split.ownerShare });
  });
  state.pointTx.forEach(function (t) {
    E.ledgerAppend(state, 'points.award', { accountId: t.accountId, delta: t.delta, reason: t.reason });
  });
  return state;
}
