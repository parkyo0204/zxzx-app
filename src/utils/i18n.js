const SUPPORTED = ['ko', 'en', 'ja', 'zh'];
const DEFAULT = 'ko';

function getLang() {
  const saved = localStorage.getItem('zxzx_lang');
  if (saved && SUPPORTED.includes(saved)) return saved;
  const browser = navigator.language.slice(0, 2);
  return SUPPORTED.includes(browser) ? browser : DEFAULT;
}

let currentLang = getLang();
let translations = {};

async function loadTranslations() {
  try {
    const res = await fetch('/src/i18n.json');
    translations = await res.json();
  } catch (e) {
    console.error('Failed to load translations:', e);
  }
}

function t(key) {
  return translations[currentLang]?.[key] || translations[DEFAULT]?.[key] || key;
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const text = t(key);
    if (text) {
      if (el.tagName === 'INPUT' && el.type !== 'submit') {
        el.placeholder = text;
      } else {
        el.textContent = text;
      }
    }
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = t(el.getAttribute('data-i18n-title'));
  });
  document.documentElement.lang = currentLang;
}

function switchLang(lang) {
  if (!SUPPORTED.includes(lang)) return;
  currentLang = lang;
  localStorage.setItem('zxzx_lang', lang);
  applyTranslations();
  updateLangButton();
}

function updateLangButton() {
  const btn = document.getElementById('lang-btn');
  if (btn) btn.textContent = currentLang.toUpperCase();
}

function createLangSwitcher() {
  const nav = document.querySelector('header nav ul');
  if (!nav) return;

  const li = document.createElement('li');
  li.style.position = 'relative';
  li.innerHTML = `
    <button id="lang-btn" style="background:none;border:1px solid var(--color-border);padding:0.3rem 0.6rem;border-radius:6px;cursor:pointer;font-size:0.85rem;color:var(--color-muted);">${currentLang.toUpperCase()}</button>
    <div id="lang-menu" style="display:none;position:absolute;right:0;top:100%;background:white;border:1px solid var(--color-border);border-radius:8px;box-shadow:var(--shadow-lg);overflow:hidden;z-index:200;min-width:80px;">
      ${SUPPORTED.map(l => `<button data-lang="${l}" style="display:block;width:100%;padding:0.5rem 1rem;border:none;background:none;cursor:pointer;text-align:left;font-size:0.85rem;${l === currentLang ? 'color:var(--color-primary);font-weight:600;' : 'color:var(--color-muted);'}">${l.toUpperCase()}</button>`).join('')}
    </div>
  `;
  nav.appendChild(li);

  const btn = document.getElementById('lang-btn');
  const menu = document.getElementById('lang-menu');

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
  });

  menu.querySelectorAll('[data-lang]').forEach(el => {
    el.addEventListener('click', () => {
      switchLang(el.dataset.lang);
      menu.style.display = 'none';
    });
  });

  document.addEventListener('click', () => menu.style.display = 'none');
}

loadTranslations().then(() => {
  applyTranslations();
  createLangSwitcher();
});
