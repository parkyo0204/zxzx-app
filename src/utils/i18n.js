// i18n module — supports ko, en, ja, zh
// Load from /i18n.json (copied from public/ by Vite). Never fetch /src/...
// Missing keys leave existing DOM text intact (do not paint raw key names).
var SUPPORTED = ['ko', 'en', 'ja', 'zh'];
var DEFAULT = 'ko';

function getLang() {
  try {
    var params = new URLSearchParams(window.location.search);
    var q = params.get('lang');
    if (q && SUPPORTED.indexOf(q) !== -1) {
      localStorage.setItem('zxzx_lang', q);
      return q;
    }
  } catch (e) {}
  var saved = localStorage.getItem('zxzx_lang');
  if (saved && SUPPORTED.indexOf(saved) !== -1) return saved;
  var browser = (navigator.language || DEFAULT).slice(0, 2);
  return SUPPORTED.indexOf(browser) !== -1 ? browser : DEFAULT;
}

var currentLang = getLang();
var translations = {};

async function loadTranslations() {
  try {
    var res = await fetch('/i18n.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    translations = await res.json();
  } catch (e) {
    console.error('Failed to load translations:', e);
    translations = {};
  }
}

function t(key) {
  var v = translations[currentLang] && translations[currentLang][key];
  if (v != null && v !== '') return v;
  v = translations[DEFAULT] && translations[DEFAULT][key];
  if (v != null && v !== '') return v;
  return null;
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(function (el) {
    var key = el.getAttribute('data-i18n');
    var text = t(key);
    if (text == null) return;
    if (el.tagName === 'INPUT' && el.type !== 'submit') {
      el.placeholder = text;
    } else if (el.tagName === 'TITLE') {
      document.title = text;
    } else {
      el.innerHTML = text;
    }
  });
  document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
    var text = t(el.getAttribute('data-i18n-title'));
    if (text != null) el.setAttribute('title', text);
  });
  document.querySelectorAll('[data-i18n-content]').forEach(function (el) {
    var text = t(el.getAttribute('data-i18n-content'));
    if (text != null) el.setAttribute('content', text);
  });
  document.documentElement.lang = currentLang;
  syncLangSelect();
}

function syncLangSelect() {
  var sel = document.getElementById('lang-select');
  if (sel) sel.value = currentLang;
}

function switchLang(lang) {
  if (SUPPORTED.indexOf(lang) === -1) return;
  currentLang = lang;
  localStorage.setItem('zxzx_lang', lang);
  applyTranslations();
  updateLangButton();
}
window.switchLang = switchLang;

function updateLangButton() {
  var btn = document.getElementById('lang-btn');
  if (btn) btn.textContent = currentLang.toUpperCase();
  syncLangSelect();
}

function createLangSwitcher() {
  var nav = document.querySelector('header nav ul');
  if (!nav || document.getElementById('lang-btn')) return;

  var li = document.createElement('li');
  li.innerHTML =
    '<select id="lang-select" onchange="switchLang(this.value)" style="background:#fff;border:1px solid var(--color-border);padding:0.3rem 0.5rem;border-radius:6px;font-size:0.75rem;font-family:var(--font-mono);color:var(--color-text-secondary);cursor:pointer;">' +
    SUPPORTED.map(function (l) {
      return (
        '<option value="' +
        l +
        '"' +
        (l === currentLang ? ' selected' : '') +
        '>' +
        l.toUpperCase() +
        '</option>'
      );
    }).join('') +
    '</select>';
  nav.appendChild(li);
}

loadTranslations().then(function () {
  applyTranslations();
  createLangSwitcher();
});
