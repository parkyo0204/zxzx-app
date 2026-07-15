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
      } else if (el.tagName === 'OPTION') {
        el.textContent = text;
      } else {
        el.textContent = text;
      }
    }
  });
  document.documentElement.lang = currentLang;
}

function switchLang(lang) {
  if (SUPPORTED.indexOf(lang) === -1) return;
  currentLang = lang;
  localStorage.setItem('zxzx_lang', lang);
  applyTranslations();
  updateLangButton();
}

function updateLangButton() {
  var btn = document.getElementById('lang-btn');
  if (btn) btn.textContent = currentLang.toUpperCase();
}

function createLangSwitcher() {
  var nav = document.querySelector('header nav ul');
  if (!nav) return;

  var li = document.createElement('li');
  li.style.position = 'relative';
  li.innerHTML = '<button id="lang-btn" style="background:none;border:1px solid var(--color-border);padding:0.3rem 0.6rem;border-radius:6px;cursor:pointer;font-size:0.85rem;color:var(--color-muted);">' + currentLang.toUpperCase() + '</button>' +
    '<div id="lang-menu" style="display:none;position:absolute;right:0;top:100%;background:white;border:1px solid var(--color-border);border-radius:8px;box-shadow:0 10px 15px -3px rgba(0,0,0,0.1);overflow:hidden;z-index:200;min-width:80px;">' +
    SUPPORTED.map(function(l) {
      return '<button data-lang="' + l + '" style="display:block;width:100%;padding:0.5rem 1rem;border:none;background:none;cursor:pointer;text-align:left;font-size:0.85rem;' + 
        (l === currentLang ? 'color:#2563eb;font-weight:600;' : 'color:#64748b;') + '">' + l.toUpperCase() + '</button>';
    }).join('') + '</div>';
  nav.appendChild(li);

  var btn = document.getElementById('lang-btn');
  var menu = document.getElementById('lang-menu');

  btn.addEventListener('click', function(e) {
    e.stopPropagation();
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
  });

  menu.querySelectorAll('[data-lang]').forEach(function(el) {
    el.addEventListener('click', function() {
      switchLang(el.dataset.lang);
      menu.style.display = 'none';
    });
  });

  document.addEventListener('click', function() { menu.style.display = 'none'; });
}

// Auto-init
loadTranslations().then(function() {
  applyTranslations();
  // createLangSwitcher(); // disabled — using static HTML select
});
