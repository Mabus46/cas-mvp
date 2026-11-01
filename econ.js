/* ЦАС · экономика: каскад роялти, комиссии, баллы, журнал происхождения */
(function (global) {
  'use strict';
  var C = global.CAS;

  var RULES = {
    commissionPct: 7,
    cascade: [15, 10, 5],   // уровни наследования: 15 % → 10 % → 5 %
    cascadeCap: 30,         // суммарный потолок роялти
    terms: [1, 3, 6, 12]
  };

  var find = function (arr, id) { return arr.filter(function (x) { return x.id === id; })[0]; };

  /* ---------- цепочка наследования ---------- */
  function lineageChain(state, blockId) {
    var chain = [];
    var cur = find(state.blocks, blockId);
    var guard = 0;
    while (cur && cur.derivedFrom && guard < 10) {
      var parent = find(state.blocks, cur.derivedFrom);
      if (!parent) break;
      chain.push({ block: parent, level: chain.length + 1 });
      cur = parent;
      guard++;
    }
    return chain;
  }

  /* ---------- расчёт долей ----------
     base = price
     commission = round2(base * pct/100)
     pool = base - commission
     royalty_i = round2(pool * percent_i/100), сумма ≤ cascadeCap
     owner = pool - Σ royalty_i
     Гарантия: commission + Σ royalty + owner === base (до копейки)          */
  function calcSplit(state, blockId, priceRub, commissionPct) {
    var base = C.round2(priceRub);
    var cpc = commissionPct == null ? RULES.commissionPct : commissionPct;
    var commission = C.round2(base * cpc / 100);
    var pool = C.round2(base - commission);
    var chain = lineageChain(state, blockId);
    var royalties = [];
    var used = 0;
    chain.forEach(function (item, i) {
      var percent = RULES.cascade[i];
      if (percent == null) return;
      if (used + percent > RULES.cascadeCap) return;
      var amount = C.round2(pool * percent / 100);
      used += percent;
      royalties.push({
        level: item.level,
        blockId: item.block.id,
        blockTitle: item.block.title,
        beneficiaryAvatarId: item.block.ownerAvatarId,
        percent: percent,
        amount: amount
      });
    });
    var ownerAvatarId = (find(state.blocks, blockId) || {}).ownerAvatarId;
    var ownerShare = C.round2(pool - royalties.reduce(function (s, r) { return s + r.amount; }, 0));
    var check = C.round2(commission + royalties.reduce(function (s, r) { return s + r.amount; }, 0) + ownerShare);
    return {
      base: base, commissionPct: cpc, commission: commission, pool: pool,
      royalties: royalties, royaltyTotal: C.round2(royalties.reduce(function (s, r) { return s + r.amount; }, 0)),
      ownerAvatarId: ownerAvatarId, ownerShare: ownerShare,
      balanced: check === base, check: check
    };
  }

  /* ---------- журнал происхождения (append-only, hash chain) ---------- */
  function ledgerAppend(state, type, payload) {
    var prev = state.ledger.length ? state.ledger[state.ledger.length - 1].hash : '0'.repeat(64);
    var seq = state.ledger.length + 1;
    var body = { seq: seq, type: type, at: new Date().toISOString(), payload: payload, prevHash: prev };
    body.hash = C.sha256(JSON.stringify(body));
    state.ledger.push(body);
    return body;
  }

  function ledgerVerify(state) {
    var ok = true, broken = null;
    var prev = '0'.repeat(64);
    for (var i = 0; i < state.ledger.length; i++) {
      var e = state.ledger[i];
      if (e.prevHash !== prev) { ok = false; broken = e.seq; break; }
      var body = { seq: e.seq, type: e.type, at: e.at, payload: e.payload, prevHash: e.prevHash };
      if (C.sha256(JSON.stringify(body)) !== e.hash) { ok = false; broken = e.seq; break; }
      prev = e.hash;
    }
    return { ok: ok, count: state.ledger.length, brokenAt: broken };
  }

  /* ---------- договор аренды ---------- */
  function createContract(state, blockId, renterId, months) {
    var block = find(state.blocks, blockId);
    if (!block) return { ok: false, error: 'Блок не найден' };
    var ownerAccountId = (find(state.avatars, block.ownerAvatarId) || {}).ownerId;
    if (ownerAccountId === renterId) return { ok: false, error: 'Нельзя арендовать собственную методику' };
    var price = C.round2(block.priceRub * months);
    var split = calcSplit(state, blockId, price);
    var now = new Date();
    var contract = {
      id: C.uid('cnt'), blockId: blockId, renterId: renterId, ownerId: ownerAccountId,
      months: months, priceRub: price, commissionPct: split.commissionPct,
      status: 'active', startsAt: now.toISOString(),
      endsAt: new Date(now.getTime() + months * 30 * 864e5).toISOString(),
      contractVersion: 'v1.2', acceptedAt: now.toISOString()
    };
    state.contracts.push(contract);
    ledgerAppend(state, 'contract.paid', {
      contractId: contract.id, blockId: blockId, renterId: renterId,
      amount: price, commission: split.commission, royaltyTotal: split.royaltyTotal, ownerShare: split.ownerShare
    });
    split.royalties.forEach(function (r) {
      ledgerAppend(state, 'royalty.accrual', {
        contractId: contract.id, blockId: r.blockId, level: r.level,
        beneficiaryAvatarId: r.beneficiaryAvatarId, percent: r.percent, amount: r.amount
      });
    });
    ledgerAppend(state, 'owner.accrual', { contractId: contract.id, ownerId: ownerAccountId, amount: split.ownerShare });
    return { ok: true, contract: contract, split: split };
  }

  function contractActive(state, contractId, accountId) {
    var c = find(state.contracts, contractId);
    if (!c || c.renterId !== accountId) return false;
    return c.status === 'active' && new Date(c.endsAt) > new Date();
  }

  function hasAccess(state, blockId, accountId) {
    return state.contracts.some(function (c) {
      return c.blockId === blockId && c.renterId === accountId && c.status === 'active' && new Date(c.endsAt) > new Date();
    });
  }

  /* ---------- баллы (неконвертируемые) ---------- */
  function pointsBalance(state, accountId) {
    return state.pointTx.filter(function (t) { return t.accountId === accountId; })
      .reduce(function (s, t) { return s + t.delta; }, 0);
  }
  function awardPoints(state, accountId, delta, reason) {
    state.pointTx.push({ id: C.uid('pt'), accountId: accountId, delta: delta, reason: reason, at: new Date().toISOString() });
    ledgerAppend(state, 'points.award', { accountId: accountId, delta: delta, reason: reason });
  }

  /* ---------- денежные начисления по договорам ---------- */
  function earnings(state, accountId) {
    var out = { owner: 0, royalties: 0, total: 0, rows: [] };
    state.ledger.forEach(function (e) {
      if (e.type === 'owner.accrual' && e.payload.ownerId === accountId) out.owner += e.payload.amount;
      if (e.type === 'royalty.accrual') {
        var av = find(state.avatars, e.payload.beneficiaryAvatarId);
        if (av && av.ownerId === accountId) out.royalties += e.payload.amount;
      }
    });
    out.total = C.round2(out.owner + out.royalties);
    out.owner = C.round2(out.owner);
    out.royalties = C.round2(out.royalties);
    return out;
  }

  /* ---------- социальный индекс (прозрачная формула) ---------- */
  function socialScore(state, avatarId) {
    var av = find(state.avatars, avatarId);
    if (!av) return 0;
    var ach = (av.achievements || []).length;
    var res = state.results.filter(function (r) { return r.avatarId === avatarId && r.confirmed; }).length;
    var blocks = state.blocks.filter(function (b) { return b.ownerAvatarId === avatarId && b.status === 'published'; }).length;
    var trainings = (state.training[avatarId] || []).filter(function (t) { return t.done; }).length;
    var norm = function (v, max) { return Math.min(1, v / max); };
    var score =
      0.4 * norm(ach + res, 8) +
      0.3 * norm(trainings, 14) +
      0.2 * norm(blocks, 4) +
      0.1 * norm(av.rating ? 1 : 0, 1);
    return Math.round(score * 100) / 10; // 0..10
  }

  /* ---------- закрытие периода ---------- */
  function closePeriod(state, accountId) {
    var e = earnings(state, accountId);
    var already = state.payouts.filter(function (p) { return p.accountId === accountId && p.status !== 'cancelled'; })
      .reduce(function (s, p) { return s + p.amount; }, 0);
    var available = C.round2(e.total - already);
    return { available: available, total: e.total, paid: C.round2(already) };
  }

  function requestPayout(state, accountId) {
    var info = closePeriod(state, accountId);
    if (info.available <= 0) return { ok: false, error: 'Нет суммы к выплате' };
    var payout = {
      id: C.uid('pay'), accountId: accountId, period: new Date().toISOString().slice(0, 7),
      amount: info.available, status: 'processing', taxMode: 'НДФЛ 13 % (по договору)',
      paymentId: 'DEMO-' + Math.random().toString(36).slice(2, 10).toUpperCase(), at: new Date().toISOString()
    };
    state.payouts.push(payout);
    ledgerAppend(state, 'payout.requested', { payoutId: payout.id, accountId: accountId, amount: payout.amount });
    return { ok: true, payout: payout };
  }

  /* ---------- права доступа по ролям (демонстрация ABAC) ---------- */
  function canAccessPlane3(state, actorId, subjectAvatarId) {
    var actor = find(state.accounts, actorId);
    var avatar = find(state.avatars, subjectAvatarId);
    if (!actor || !avatar) return { allow: false, reason: 'Объект не найден' };
    if (avatar.ownerId === actorId) return { allow: true, reason: 'Владелец аватара' };
    var link = find(state.accounts, actorId);
    if (link && link.wardId && avatar.ownerId === link.wardId) return { allow: true, reason: 'Законный представитель' };
    if (actor.role === 'coach') {
      var consent = state.consents.some(function (c) { return c.accountId === avatar.ownerId && c.type === 'coach' && !c.revokedAt; });
      return consent ? { allow: true, reason: 'Согласие спортсмена на передачу тренировочных данных' }
        : { allow: false, reason: 'Согласие отозвано или отсутствует' };
    }
    if (actor.role === 'federation') return { allow: false, reason: 'Федерация видит только паспортные и соревновательные данные' };
    return { allow: false, reason: 'Нет основания обработки' };
  }

  global.CAS_ECON = {
    RULES: RULES, lineageChain: lineageChain, calcSplit: calcSplit, ledgerAppend: ledgerAppend,
    ledgerVerify: ledgerVerify, createContract: createContract, contractActive: contractActive,
    hasAccess: hasAccess, pointsBalance: pointsBalance, awardPoints: awardPoints,
    earnings: earnings, socialScore: socialScore, closePeriod: closePeriod, requestPayout: requestPayout,
    canAccessPlane3: canAccessPlane3, find: find
  };
})(window);
