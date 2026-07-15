// i18n module — supports ko, en, ja, zh
var SUPPORTED = ['ko', 'en', 'ja', 'zh'];
var DEFAULT = 'ko';

function getLang() {
  var saved = localStorage.getItem('zxzx_lang');
  if (saved && SUPPORTED.indexOf(saved) !== -1) return saved;
  var browser = navigator.language.slice(0, 2);
  return SUPPORTED.indexOf(browser) !== -1 ? browser : DEFAULT;
}

var currentLang = getLang();
var translations = {};

async function loadTranslations() {
  try {
    var res = await fetch('/src/i18n.json');
    translations = await res.json();
  } catch (e) {
    console.error('Failed to load translations:', e);
  }
}

function t(key) {
  return (translations[currentLang] && translations[currentLang][key]) || 
         (translations[DEFAULT] && translations[DEFAULT][key]) || key;
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(function(el) {
    var key = el.getAttribute('data-i18n');
    var text = t(key);
    if (text) {
      if (el.tagName === 'INPUT' && el.type !== 'submit') {
        el.placeholder = text;
      } else {
        el.innerHTML = text;
      }
    }
  });
  document.querySelectorAll('[data-i18n-title]').forEach(function(el) {
    el.setAttribute('title', t(el.getAttribute('data-i18n-title')));
  });
  document.querySelectorAll('[data-i18n-content]').forEach(function(el) {
    var key = el.getAttribute('data-i18n-content');
    var text = t(key);
    if (text) {
      el.setAttribute('content', text);
    }
  });
  document.documentElement.lang = currentLang;
  // Sync any existing select
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
  li.innerHTML = '<select id="lang-select" onchange="switchLang(this.value)" style="background:none;border:1px solid var(--color-border);padding:0.3rem 0.5rem;border-radius:6px;font-size:0.8rem;color:var(--color-muted);cursor:pointer;">' +
    SUPPORTED.map(function(l) {
      return '<option value="' + l + '"' + (l === currentLang ? ' selected' : '') + '>' + l.toUpperCase() + '</option>';
    }).join('') + '</select>';
  nav.appendChild(li);
}

// Also sync on DOMContentLoaded for static selects
document.addEventListener('DOMContentLoaded', function() {
  syncLangSelect();
});

// Auto-init
loadTranslations().then(function() {
  applyTranslations();
  createLangSwitcher();
});
