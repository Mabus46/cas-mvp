/* ЦАС · приложение: навигация, роли, делегирование действий */
(function (global) {
  'use strict';
  var C = global.CAS;
  var esc = C.esc;

  var NAV = [
    { group: 'Платформа', items: [
      { path: '/', title: 'Обзор системы', ico: '◈' },
      { path: '/avatar', title: 'Паспорт аватара', ico: '👤', tag: 'M1' },
      { path: '/sport', title: 'Соревнования', ico: '🏆', tag: 'M2' },
      { path: '/training', title: 'Тренировки', ico: '📈', tag: 'M3' },
      { path: '/ai', title: 'ИИ-коучинг', ico: '🤖', tag: 'M9' }
    ]},
    { group: 'Методика', items: [
      { path: '/methods', title: 'Методическое ядро', ico: '📚', tag: 'M4' },
      { path: '/lineage', title: 'Граф и роялти', ico: '🌳', tag: 'M6' },
      { path: '/catalog', title: 'Каталог аренды', ico: '🔑', tag: 'M5' },
      { path: '/legacy', title: 'Наследование', ico: '🕯', tag: 'M7' }
    ]},
    { group: 'Экономика', items: [
      { path: '/earnings', title: 'Доходы и расчёты', ico: '💰', tag: 'M8' },
      { path: '/sponsor', title: 'Кабинет спонсора', ico: '📣', tag: 'M10' }
    ]},
    { group: 'Управление', items: [
      { path: '/coach', title: 'Кабинет тренера', ico: '🎓' },
      { path: '/federation', title: 'Федерация', ico: '🏛', tag: 'M12' }
    ]},
    { group: 'Доверие', items: [
      { path: '/privacy', title: 'Приватность', ico: '🔐', tag: 'M14' },
      { path: '/legal', title: 'Правовой контур', ico: '⚖️' }
    ]}
  ];

  var ROLES = [
    { key: 'athlete', title: 'Спортсмен', accountId: 'acc-artem' },
    { key: 'coach', title: 'Тренер', accountId: 'acc-coach' },
    { key: 'sponsor', title: 'Спонсор', accountId: 'acc-sponsor' },
    { key: 'federation', title: 'Федерация', accountId: 'acc-fed' }
  ];

  function currentPath() {
    return C.Router.current();
  }

  function titleFor(path) {
    for (var i = 0; i < NAV.length; i++) {
      for (var j = 0; j < NAV[i].items.length; j++) {
        if (NAV[i].items[j].path === path) return NAV[i].items[j].title;
      }
    }
    return 'Цифровой аватар спортсмена';
  }

  function renderNav(state) {
    var path = currentPath();
    var html = NAV.map(function (group) {
      return '<div class="nav__group">' + esc(group.group) + '</div>' +
        group.items.map(function (it) {
          var active = path === it.path ? ' is-active' : '';
          return '<button class="nav__item' + active + '" data-nav="' + it.path + '">' +
            '<span class="ico" aria-hidden="true">' + it.ico + '</span>' +
            '<span class="lbl">' + esc(it.title) + '</span>' +
            (it.tag ? '<span class="tag">' + esc(it.tag) + '</span>' : '') +
            '</button>';
        }).join('');
    }).join('');
    var nav = document.getElementById('nav');
    if (nav) nav.innerHTML = html;
  }

  function renderRoles(state) {
    var box = document.getElementById('role-switch');
    if (!box) return;
    var me = state.accounts.filter(function (a) { return a.id === state.session.accountId; })[0] || {};
    var roleKey = me.role || 'athlete';
    box.innerHTML = ROLES.map(function (r) {
      return '<button data-role="' + r.key + '" class="' + (r.key === roleKey ? 'is-active' : '') + '">' + esc(r.title) + '</button>';
    }).join('');
  }

  function setRole(key) {
    var role = ROLES.filter(function (r) { return r.key === key; })[0];
    if (!role) return;
    var state = C.Store.state;
    state.session.accountId = role.accountId;
    state.role = key;
    C.Store.save();
    renderRoles(state);
    C.Router.render();
    C.toast('Демонстрация роли: ' + role.title, 'ok');
  }

  function onNavClick(path) {
    C.Router.go(path);
    closeDrawer();
  }

  function openDrawer() {
    var sb = document.getElementById('sidebar');
    var veil = document.getElementById('drawer-veil');
    if (sb) sb.classList.add('is-open');
    if (veil) veil.hidden = false;
  }
  function closeDrawer() {
    var sb = document.getElementById('sidebar');
    var veil = document.getElementById('drawer-veil');
    if (sb) sb.classList.remove('is-open');
    if (veil) veil.hidden = true;
  }

  /* ---------- делегирование кликов ---------- */
  document.addEventListener('click', function (ev) {
    var navBtn = ev.target.closest ? ev.target.closest('[data-nav]') : null;
    if (navBtn) { ev.preventDefault(); onNavClick(navBtn.getAttribute('data-nav')); return; }

    var node = ev.target.closest ? ev.target.closest('[data-block]') : null;
    if (node) { ev.preventDefault(); C.Router.go('/lineage?block=' + node.getAttribute('data-block')); return; }

    var roleBtn = ev.target.closest ? ev.target.closest('[data-role]') : null;
    if (roleBtn) { ev.preventDefault(); setRole(roleBtn.getAttribute('data-role')); return; }

    var actEl = ev.target.closest ? ev.target.closest('[data-act]') : null;
    if (actEl && actEl.getAttribute('data-act')) {
      var name = actEl.getAttribute('data-act');
      ev.preventDefault();
      if (name === 'modal-close') { C.modal.close(); return; }
      if (name === 'reset') {
        C.modal.open('<h3>Сбросить демо-контур?</h3><div class="small">Все изменения (договоры, рекомендации, согласия) вернутся к исходному состоянию.</div>' +
          '<div class="btn-row" style="margin-top:12px"><button class="btn btn--danger" data-act="reset-confirm">Сбросить</button><button class="btn" data-act="modal-close">Отмена</button></div>');
        return;
      }
      if (name === 'reset-confirm') {
        C.Store.reset();
        C.modal.close();
        C.toast('Демо-данные восстановлены', 'ok');
        renderRoles(C.Store.state);
        C.Router.render();
        return;
      }
      var fn = window.ACTIONS[name];
      if (typeof fn === 'function') {
        try {
          fn(C.Store.state, actEl);
          C.Store.save();
        } catch (err) {
          console.error(err);
          C.toast('Ошибка действия: ' + err.message, 'err');
        }
      }
      return;
    }
    if (ev.target.id === 'drawer-veil') closeDrawer();
  });

  /* смена выбора условий аренды */
  document.addEventListener('change', function (ev) {
    var t = ev.target;
    if (t && t.getAttribute && t.getAttribute('data-act') === 'rent-term') {
      var m = (location.hash || '').match(/block=([^&]+)/);
      location.hash = '/catalog?block=' + (m ? m[1] : '') + '&months=' + t.value;
    }
  });

  /* ---------- клавиатура ---------- */
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape') { C.modal.close(); closeDrawer(); }
  });

  /* ---------- запуск ---------- */
  function boot() {
    var state = C.Store.load();

    var menuBtn = document.getElementById('menu-btn');
    if (menuBtn) menuBtn.addEventListener('click', openDrawer);
    var veil = document.getElementById('drawer-veil');
    if (veil) veil.addEventListener('click', closeDrawer);

    var back = document.getElementById('back-to-fund');
    if (back) {
      var isSubfolder = /^\/[^/]+\/?$/.test(location.pathname) && location.protocol !== 'file:';
      back.hidden = !isSubfolder;
    }

    C.on('route', function (path) {
      renderNav(C.Store.state);
      var t = document.getElementById('screen-title');
      if (t) t.textContent = titleFor(path);
    });

    window.addEventListener('hashchange', function () {
      C.Router.render();
    });

    renderNav(state);
    renderRoles(state);
    if (!location.hash) location.hash = '#/';
    C.Router.render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window);
