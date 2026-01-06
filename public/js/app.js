// Main application entry point

import { fetchRoadmapData, extractLabels } from './utils/api.js';
import { formatDate } from './utils/helpers.js';
import { state } from './utils/state.js';
import { initTheme, setupThemeToggle } from './components/theme.js';
import { renderKanban } from './components/column.js';
import { initSearch, populateLabelsDropdown, populateStatusDropdown, handleLabelClick, handleStatusClick } from './components/search.js';
import { initI18n, switchLanguage, currentLang, t } from './utils/i18n.js';

// DOM Elements
const elements = {
  loading: document.getElementById('loading'),
  error: document.getElementById('error'),
  errorMessage: document.getElementById('error-message'),
  kanban: document.getElementById('kanban'),
  columns: document.getElementById('columns'),
  lastUpdated: document.getElementById('last-updated'),
  themeToggle: document.getElementById('theme-toggle'),
  searchBar: document.getElementById('search-bar'),
  // Search elements
  searchInput: document.getElementById('search-input'),
  activeFilters: document.getElementById('active-filters'),
  clearSearch: document.getElementById('clear-search'),
  searchSuggestions: document.getElementById('search-suggestions'),
  statusDropdownBtn: document.getElementById('status-dropdown-btn'),
  statusDropdown: document.getElementById('status-dropdown'),
  labelsDropdownBtn: document.getElementById('labels-dropdown-btn'),
  labelsDropdown: document.getElementById('labels-dropdown'),
  resultsCount: document.getElementById('results-count'),
  // Language switcher
  langDropdownBtn: document.getElementById('lang-dropdown-btn'),
  langDropdown: document.getElementById('lang-dropdown'),
  currentLangText: document.getElementById('current-lang-text')
};

/**
 * Show error state
 * @param {string} message - Error message
 */
function showError(message) {
  elements.loading.classList.add('hidden');
  elements.kanban.classList.add('hidden');
  elements.error.classList.remove('hidden');
  elements.errorMessage.textContent = message;
}

/**
 * Re-render the kanban board with current filters
 */
function renderBoard() {
  elements.columns.innerHTML = renderKanban(state.roadmapData.milestones);
}

/**
 * Show kanban board with data
 * @param {Object} data - Roadmap data
 */
function showKanban(data) {
  elements.loading.classList.add('hidden');
  elements.error.classList.add('hidden');
  elements.kanban.classList.remove('hidden');
  elements.searchBar.classList.remove('hidden');

  updateLastUpdated(data.generated_at);



/**
 * Update the last updated timestamp
 * @param {string} date - ISO date string
 */
function updateLastUpdated(date) {
  if (date) {
    elements.lastUpdated.textContent = t('last_updated', { date: formatDate(date) });
  }
}

  // Store data in state
  state.roadmapData = data;
  state.allLabels = extractLabels(data);
  state.projectFields = data.fields || []; // Store custom project fields
  
  // Initialize search with callback for re-rendering
  initSearch({
    searchInput: elements.searchInput,
    activeFilters: elements.activeFilters,
    clearSearch: elements.clearSearch,
    searchSuggestions: elements.searchSuggestions,
    statusDropdownBtn: elements.statusDropdownBtn,
    statusDropdown: elements.statusDropdown,
    labelsDropdownBtn: elements.labelsDropdownBtn,
    labelsDropdown: elements.labelsDropdown,
    resultsCount: elements.resultsCount
  }, renderBoard);
  
  // Populate dropdowns
  populateLabelsDropdown();
  populateStatusDropdown();

  // Initial render
  renderBoard();
  
  // Update last updated on language change
  window.addEventListener('languageChanged', () => {
    updateLastUpdated(state.roadmapData.generated_at);
    renderBoard();
  });

  // Setup click delegation on kanban
  elements.columns.addEventListener('click', (e) => {
    // Label click
    const labelPill = e.target.closest('.label-pill');
    if (labelPill && labelPill.dataset.label) {
      handleLabelClick(labelPill.dataset.label);
      return;
    }
    
    // Status badge click
    const statusBadge = e.target.closest('.status-badge');
    if (statusBadge && statusBadge.dataset.status) {
      handleStatusClick(statusBadge.dataset.status);
    }
  });
}

/**
 * Load and display roadmap data
 */
async function loadRoadmap() {
  try {
    const data = await fetchRoadmapData();
    showKanban(data);
  } catch (error) {
    console.error('Error loading roadmap:', error);
    showError(error.message);
  }
}

/**
 * Setup language switcher buttons
 */
function setupLanguageSwitcher() {
  const updateActiveLang = (lang) => {
    if (elements.currentLangText) {
      elements.currentLangText.textContent = lang;
    }
    document.querySelectorAll('.lang-option').forEach(opt => {
      const isSelected = opt.dataset.lang === lang;
      opt.classList.toggle('bg-gray-100', isSelected);
      opt.classList.toggle('dark:bg-gray-700', isSelected);
    });
  };

  updateActiveLang(currentLang);

  elements.langDropdownBtn.addEventListener('click', () => {
    elements.langDropdown.classList.toggle('hidden');
  });

  elements.langDropdown.addEventListener('click', (e) => {
    const option = e.target.closest('.lang-option');
    if (option) {
      const lang = option.dataset.lang;
      switchLanguage(lang);
      updateActiveLang(lang);
      elements.langDropdown.classList.add('hidden');
    }
  });

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (!elements.langDropdownBtn.contains(e.target) && !elements.langDropdown.contains(e.target)) {
      elements.langDropdown.classList.add('hidden');
    }
  });
}

/**
 * Initialize the application
 */
async function init() {
  initTheme();
  setupThemeToggle(elements.themeToggle);
  await initI18n();
  setupLanguageSwitcher();
  loadRoadmap();
}

// Start the app
init();
