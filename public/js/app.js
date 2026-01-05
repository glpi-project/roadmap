// Main application entry point

import { fetchRoadmapData, extractLabels } from './utils/api.js';
import { formatDate } from './utils/helpers.js';
import { state } from './utils/state.js';
import { initTheme, setupThemeToggle } from './components/theme.js';
import { renderKanban } from './components/column.js';
import { initSearch, populateLabelsDropdown, populateStatusDropdown, handleLabelClick, handleStatusClick } from './components/search.js';

// DOM Elements
const elements = {
  loading: document.getElementById('loading'),
  error: document.getElementById('error'),
  errorMessage: document.getElementById('error-message'),
  kanban: document.getElementById('kanban'),
  columns: document.getElementById('columns'),
  lastUpdated: document.getElementById('last-updated'),
  projectLink: document.getElementById('project-link'),
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
  resultsCount: document.getElementById('results-count')
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

  // Update header info
  if (data.project) {
    const link = elements.projectLink.querySelector('a');
    link.href = data.project.url;
    elements.projectLink.classList.remove('hidden');
  }

  if (data.generated_at) {
    elements.lastUpdated.textContent = `Updated: ${formatDate(data.generated_at)}`;
    elements.lastUpdated.classList.remove('hidden');
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
 * Initialize the application
 */
function init() {
  initTheme();
  setupThemeToggle(elements.themeToggle);
  loadRoadmap();
}

// Start the app
init();
