/* ЦАС · ИИ-коучинг: правила + объяснимые факторы (HITL) */
(function (global) {
  'use strict';
  var C = global.CAS;
  var MODEL = 'rules-v1.3';

  var avg = function (arr) { return arr.length ? arr.reduce(function (s, x) { return s + x; }, 0) / arr.length : 0; };
  var round = function (n, d) { var p = Math.pow(10, d || 1); return Math.round(n * p) / p; };

  function series(state, avatarId) {
    var rows = (state.training[avatarId] || []).slice().sort(function (a, b) { return new Date(a.date) - new Date(b.date); });
    return rows;
  }

  /* Метрики состояния: сравнение последних 3 записей с предыдущими 4 */
  function metrics(state, avatarId) {
    var rows = series(state, avatarId);
    var last3 = rows.slice(-3);
    var prev4 = rows.slice(-7, -3);
    var m = {
      n: rows.length,
      rpeLast: round(avg(last3.map(function (r) { return r.rpe; })), 1),
      rpePrev: round(avg(prev4.map(function (r) { return r.rpe; })), 1),
      sleepLast: round(avg(last3.map(function (r) { return r.sleepH; })), 1),
      sleepPrev: round(avg(prev4.map(function (r) { return r.sleepH; })), 1),
      reactLast: Math.round(avg(last3.map(function (r) { return r.reactionMs; }))),
      reactPrev: Math.round(avg(prev4.map(function (r) { return r.reactionMs; }))),
      restDays: 0
    };
    m.rpeDelta = m.rpePrev ? round((m.rpeLast - m.rpePrev) / m.rpePrev * 100, 0) : 0;
    m.sleepDelta = m.sleepPrev ? round((m.sleepLast - m.sleepPrev) / m.sleepPrev * 100, 0) : 0;
    m.reactDelta = m.reactPrev ? m.reactLast - m.reactPrev : 0;
    return m;
  }

  function persisted(state, id) {
    return state.recommendations.filter(function (r) { return r.id === id; })[0];
  }

  /* Генерация рекомендаций (детерминированная, объяснимая) */
  function compute(state, avatarId) {
    if (!state.aiEnabled) return { list: [], metrics: metrics(state, avatarId) };
    var m = metrics(state, avatarId);
    var out = [];

    /* 1. Признаки накопленной усталости */
    if (m.n >= 5 && (m.rpeDelta >= 12 || m.sleepDelta <= -8 || m.reactDelta >= 10)) {
      var factors = [];
      factors.push({ code: 'rpe', label: 'Субъективная нагрузка (RPE) выросла', value: (m.rpeDelta > 0 ? '+' : '') + m.rpeDelta + ' %', weight: 0.4 });
      factors.push({ code: 'sleep', label: 'Средний сон за последние 3 дня', value: String(m.sleepLast).replace('.', ',') + ' ч (' + (m.sleepDelta > 0 ? '+' : '') + m.sleepDelta + ' %)', weight: 0.35 });
      factors.push({ code: 'reaction', label: 'Время реакции изменилось', value: (m.reactDelta > 0 ? '+' : '') + m.reactDelta + ' мс', weight: 0.25 });
      var score = 0.4 * Math.min(1, Math.max(0, m.rpeDelta / 30)) + 0.35 * Math.min(1, Math.max(0, -m.sleepDelta / 25)) + 0.25 * Math.min(1, Math.max(0, m.reactDelta / 30));
      out.push({
        id: 'gen-load', avatarId: avatarId, kind: 'load', level: score >= 0.55 ? 'high' : 'watch',
        title: 'Снизить объём тренировок на 30 % в ближайшие два дня',
        why: 'Признаки накопленной усталости: нагрузка растёт, сон сокращается, реакция замедляется.',
        factors: factors, model: MODEL, createdAt: new Date().toISOString(),
        disclaimer: 'Это не медицинское заключение. При плохом самочувствии обратитесь к тренеру и врачу.'
      });
    }

    /* 2. Сон */
    if (m.n >= 4 && m.sleepLast < 7) {
      out.push({
        id: 'gen-sleep', avatarId: avatarId, kind: 'recovery', level: 'info',
        title: 'Вернуть вечерний блок сна: 7 дней подряд не менее 7,5 часа',
        why: 'Сон — самый сильный фактор восстановления реакции у спортсменов вашего профиля.',
        factors: [
          { code: 'sleep', label: 'Средний сон за 3 дня', value: String(m.sleepLast).replace('.', ',') + ' ч', weight: 0.6 },
          { code: 'rest', label: 'Дней полного отдыха за 14 дней', value: String((state.training[avatarId] || []).filter(function (r) { return r.loadMin < 50; }).length), weight: 0.4 }
        ],
        model: MODEL, createdAt: new Date().toISOString(),
        disclaimer: 'Рекомендация носит информационный характер.'
      });
    }

    /* 3. Технический навык — по метрикам последнего турнира */
    var av = state.avatars.filter(function (a) { return a.id === avatarId; })[0];
    var results = state.results.filter(function (r) { return r.avatarId === avatarId; });
    if (av && results.length) {
      var last = results[results.length - 1];
      var hs = Number(last.metrics && last.metrics.hs);
      if (hs && hs < 50) {
        out.push({
          id: 'gen-hs', avatarId: avatarId, kind: 'skill', level: 'info',
          title: 'Добавить 20 минут работы на хедшоты в микроцикл',
          why: 'Хедшоты ниже среднего по вашему разряду, при этом K/D и ADR в норме — резерв именно в точности.',
          factors: [
            { code: 'hs', label: 'Хедшоты на последнем турнире', value: hs + ' %', weight: 0.5 },
            { code: 'kd', label: 'K/D', value: String(last.metrics.kd || '—'), weight: 0.3 },
            { code: 'adr', label: 'ADR', value: String(last.metrics.adr || '—'), weight: 0.2 }
          ],
          model: MODEL, createdAt: new Date().toISOString(),
          disclaimer: 'Рекомендация носит информационный характер.'
        });
      }
    }

    /* применяем сохранённые статусы */
    out = out.map(function (r) {
      var p = persisted(state, r.id);
      r.status = p ? p.status : (r.level === 'high' ? 'pending_coach' : 'new');
      r.reviewedBy = p ? p.reviewedBy : null;
      return r;
    });

    /* рекомендации из сида (если правила их не сгенерировали) */
    state.recommendations.forEach(function (seed) {
      if (out.some(function (r) { return r.id === seed.id; })) return;
      if (seed.avatarId !== avatarId) return;
      if (!persisted(state, seed.id)) { out.push(C.clone(seed)); }
    });

    return { list: out, metrics: m };
  }

  /* Видимость рекомендации: высокий уровень скрыт от спортсмена до подтверждения тренером */
  function visibleTo(list, role) {
    return list.filter(function (r) {
      if (role === 'athlete' && r.level === 'high' && r.status === 'pending_coach') return false;
      return true;
    });
  }

  function setStatus(state, id, status, reviewedBy) {
    var rec = state.recommendations.filter(function (r) { return r.id === id; })[0];
    if (!rec) {
      var gen = state.recommendations.concat([]);
      rec = { id: id, status: status, reviewedBy: reviewedBy || null, createdAt: new Date().toISOString() };
      state.recommendations.push(rec);
    } else {
      rec.status = status;
      rec.reviewedBy = reviewedBy || rec.reviewedBy;
    }
    global.CAS_ECON.ledgerAppend(state, 'ai.decision', { recommendationId: id, status: status, by: reviewedBy || 'system' });
  }

  global.CAS_AI = { compute: compute, metrics: metrics, visibleTo: visibleTo, setStatus: setStatus, MODEL: MODEL };
})(window);
