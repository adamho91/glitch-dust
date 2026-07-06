(function () {
  const PAGES = [
    { id: 'editor', key: '1', label: 'Glitch Dust', href: 'index.html' },
    { id: 'lite', key: '2', label: 'Lite', href: 'lite.html' },
    { id: 'lower-thirds', key: '3', label: 'Lower Thirds', href: 'lower-thirds.html' },
  ];

  function currentPageId() {
    const file = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    if (file === 'lite.html') return 'lite';
    if (file === 'lower-thirds.html') return 'lower-thirds';
    return 'editor';
  }

  function initAppNav() {
    if (document.getElementById('appPages')) return;

    const nav = document.createElement('nav');
    nav.id = 'appPages';
    nav.className = 'app-pages';
    nav.setAttribute('aria-label', 'Glitch Dust pages');

    const active = currentPageId();
    PAGES.forEach(page => {
      const link = document.createElement('a');
      link.href = page.href;
      link.className = 'app-page-link' + (page.id === active ? ' active' : '');
      link.innerHTML =
        `<span class="app-page-key">⇧${page.key}</span>` +
        `<span class="app-page-label">${page.label}</span>`;
      if (page.id === active) link.setAttribute('aria-current', 'page');
      nav.appendChild(link);
    });

    const subtitle = document.querySelector('.sidebar .subtitle');
    if (subtitle) subtitle.insertAdjacentElement('afterend', nav);
    else document.querySelector('.sidebar')?.prepend(nav);
  }

  function isTypingTarget(el) {
    if (!el || el.isContentEditable) return true;
    const tag = el.tagName;
    if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
    if (tag === 'INPUT') {
      const type = (el.type || '').toLowerCase();
      return type !== 'range' && type !== 'checkbox' && type !== 'radio' && type !== 'button';
    }
    return false;
  }

  document.addEventListener('keydown', e => {
    if (!e.shiftKey || e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
    if (isTypingTarget(e.target)) return;

    const page = PAGES.find(entry => entry.key === e.key);
    if (!page || page.id === currentPageId()) return;

    e.preventDefault();
    location.assign(page.href);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAppNav);
  } else {
    initAppNav();
  }
})();
