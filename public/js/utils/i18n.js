/**
 * Simple i18n utility for client-side translations
 */

const DEFAULT_LANG = 'en';
const SUPPORTED_LANGS = ['en', 'fr'];
const STORAGE_KEY = 'glpi_roadmap_lang';

export let currentLang = localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;
let translations = {};

/**
 * Initialize the translation system
 */
export async function initI18n() {
  if (!SUPPORTED_LANGS.includes(currentLang)) {
    currentLang = DEFAULT_LANG;
  }
  await loadTranslations(currentLang);
  translatePage();
}

/**
 * Load translation file for a specific language
 * @param {string} lang - Language code
 */
async function loadTranslations(lang) {
  try {
    const response = await fetch(`./js/utils/locales/${lang}.json`);
    translations = await response.json();
  } catch (error) {
    console.error(`Failed to load translations for ${lang}:`, error);
  }
}

/**
 * Get a translated string by key
 * @param {string} key - Translation key
 * @param {Object} variables - Optional variables to replace in the string
 * @returns {string} Translated string
 */
export function t(key, variables = {}) {
  let text = translations[key] || key;
  
  // Replace variables in the format {variableName}
  Object.keys(variables).forEach(varName => {
    text = text.replace(`{${varName}}`, variables[varName]);
  });
  
  return text;
}

/**
 * Switch the current language
 * @param {string} lang - New language code
 */
export async function switchLanguage(lang) {
  if (!SUPPORTED_LANGS.includes(lang) || lang === currentLang) return;
  
  currentLang = lang;
  localStorage.setItem(STORAGE_KEY, lang);
  await loadTranslations(lang);
  
  // Update page content
  translatePage();
  
  // Dispatch event for components to react
  window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
}

/**
 * Translate all elements with data-i18n attribute
 */
export function translatePage() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const target = el.getAttribute('data-i18n-target') || 'textContent';
    const translated = t(key);
    
    if (target === 'placeholder') {
      el.placeholder = translated;
    } else if (target === 'title') {
      el.title = translated;
    } else if (target === 'aria-label') {
      el.setAttribute('aria-label', translated);
    } else {
      el.textContent = translated;
    }
  });
  
  // Update document title and description if available
  if (translations['title']) document.title = translations['title'];
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc && translations['description']) {
    metaDesc.setAttribute('content', translations['description']);
  }
}
