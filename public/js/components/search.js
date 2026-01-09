// Search bar component

import {
    getLuminance,
    hexToHsl,
    getPerceivedLightness,
} from "../utils/helpers.js";
import {
    state,
    hasActiveFilters,
    resetFilters,
    addLabelFilter,
    removeLabelFilter,
    setProjectStatusFilter,
    setTextFilter,
    countFilteredIssues,
    getTotalIssues,
    getStatusOptions,
} from "../utils/state.js";
import { t } from "../utils/i18n.js";

// Status color classes mapping (matches GitHub project colors)
const STATUS_COLOR_CLASSES = {
    GREEN: { bg: "bg-green-500", text: "text-green-600 dark:text-green-400" },
    YELLOW: {
        bg: "bg-yellow-500",
        text: "text-yellow-600 dark:text-yellow-400",
    },
    PURPLE: {
        bg: "bg-purple-500",
        text: "text-purple-600 dark:text-purple-400",
    },
    BLUE: { bg: "bg-blue-500", text: "text-blue-600 dark:text-blue-400" },
    ORANGE: {
        bg: "bg-orange-500",
        text: "text-orange-600 dark:text-orange-400",
    },
    RED: { bg: "bg-red-500", text: "text-red-600 dark:text-red-400" },
    PINK: { bg: "bg-pink-500", text: "text-pink-600 dark:text-pink-400" },
    GRAY: { bg: "bg-gray-500", text: "text-gray-600 dark:text-gray-400" },
};

// DOM element references (set during init)
let elements = {};

// Callback for re-rendering
let onFilterChange = null;

/**
 * Initialize search component
 * @param {Object} els - DOM element references
 * @param {Function} onChange - Callback when filters change
 */
export function initSearch(els, onChange) {
    elements = els;
    onFilterChange = onChange;

    setupEventListeners();
}

/**
 * Populate the status dropdown with project status options
 */
export function populateStatusDropdown() {
    if (!elements.statusDropdown) return;

    const options = getStatusOptions();

    if (options.length === 0) {
        // Hide status dropdown if no status field
        elements.statusDropdownBtn?.parentElement?.classList.add("hidden");
        return;
    }

    elements.statusDropdown.innerHTML = options
        .map((opt, i) => {
            const colorKey = opt.color || "GRAY";
            const colors =
                STATUS_COLOR_CLASSES[colorKey] || STATUS_COLOR_CLASSES.GRAY;
            const isSelected = state.filters.projectStatus === opt.name;
            const isFirst = i === 0;
            const isLast = i === options.length - 1;

            return `
      <button class="status-option w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${isFirst ? "rounded-t-lg" : ""} ${isLast ? "rounded-b-lg" : ""} ${isSelected ? "bg-gray-100 dark:bg-gray-700" : ""}" data-status="${opt.name}">
        <span class="w-2.5 h-2.5 rounded-full ${colors.bg}"></span>
        <span class="truncate">${opt.name}</span>
        ${isSelected ? '<svg class="w-4 h-4 ml-auto text-primary-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>' : ""}
      </button>
    `;
        })
        .join("");
}

/**
 * Populate the labels dropdown with available labels
 */
export function populateLabelsDropdown() {
    if (!elements.labelsDropdown) return;

    elements.labelsDropdown.innerHTML = state.allLabels
        .map((label) => {
            const isLight = getLuminance(label.color) > 0.5;
            const isSelected = state.filters.labels.includes(label.name);
            return `
      <button class="label-option w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${isSelected ? "bg-gray-100 dark:bg-gray-700" : ""}" data-label="${label.name}">
        <span class="truncate">${label.name}</span>
        ${isSelected ? '<svg class="w-4 h-4 ml-auto text-primary-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>' : ""}
      </button>
    `;
        })
        .join("");
}

/**
 * Render active filter badges in the search input
 */
export function renderActiveFilters() {
    const badges = [];
    const statusOptions = getStatusOptions();

    if (state.filters.text) {
        badges.push(`
      <span class="filter-badge inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <span class="opacity-70 font-normal">${t("filter_text")}:</span>${state.filters.text}
        <button class="remove-filter ml-1 hover:text-blue-600 dark:hover:text-blue-300 transition-colors" data-type="text">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </span>
    `);
    }

    if (state.filters.projectStatus) {
        const statusOpt = statusOptions.find(
            (o) => o.name === state.filters.projectStatus,
        );
        const colorKey = statusOpt?.color || "GRAY";
        const colors =
            STATUS_COLOR_CLASSES[colorKey] || STATUS_COLOR_CLASSES.GRAY;
        badges.push(`
      <span class="filter-badge inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-800 ${colors.text} border border-gray-200 dark:border-gray-700">
        <span class="w-2.5 h-2.5 rounded-full ${colors.bg}"></span>
        <span class="opacity-70 font-normal">${t("filter_status")}:</span>${state.filters.projectStatus}
        <button class="remove-filter ml-1 hover:opacity-70 transition-opacity" data-type="projectStatus">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </span>
    `);
    }

    state.filters.labels.forEach((label) => {
        const labelObj = state.allLabels.find((l) => l.name === label);
        const labelColor = labelObj ? `#${labelObj.color}` : "#6b7280";

        // Get color components for dark mode calculations
        let cssVars = "";
        if (labelObj) {
            const { h, s, l } = hexToHsl(labelObj.color);
            const perceivedLightness = getPerceivedLightness(labelObj.color);
            cssVars = `--label-color: ${labelColor}; --label-h:${h}; --label-s:${s}; --label-l:${l}; --perceived-lightness:${perceivedLightness.toFixed(3)}`;
        } else {
            cssVars = `--label-color: ${labelColor}`;
        }

        badges.push(`
      <span class="filter-badge label-pill inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs" style="${cssVars}">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"/>
        </svg>
        <span class="opacity-70 font-normal text-gray-600 dark:text-gray-400">${t("filter_label")}:</span><span>${label}</span>
        <button class="remove-filter ml-1 hover:opacity-70 transition-opacity" data-type="label" data-value="${label}">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </span>
    `);
    });

    elements.activeFilters.innerHTML = badges.join("");
    elements.clearSearch.classList.toggle(
        "hidden",
        badges.length === 0 && !elements.searchInput.value,
    );

    // Hide placeholder when there are active filter badges
    if (badges.length > 0) {
        elements.searchInput.dataset.originalPlaceholder =
            elements.searchInput.placeholder;
        elements.searchInput.placeholder = "";
    } else if (elements.searchInput.dataset.originalPlaceholder) {
        elements.searchInput.placeholder =
            elements.searchInput.dataset.originalPlaceholder;
    }
}

/**
 * Update results count display
 */
export function updateResultsCount() {
    const count = countFilteredIssues();
    const total = getTotalIssues();

    if (hasActiveFilters()) {
        elements.resultsCount.textContent = t("showing_results", {
            count,
            total,
        });
    } else {
        elements.resultsCount.textContent = "";
    }
}

/**
 * Show suggestions dropdown based on query
 * @param {string} query - Search query
 */
function showSuggestions(query) {
    if (!query) {
        elements.searchSuggestions.classList.add("hidden");
        return;
    }

    const suggestions = [];
    const q = query.toLowerCase();
    const statusOptions = getStatusOptions();

    // Status suggestions from project field
    statusOptions.forEach((opt) => {
        if (
            opt.name.toLowerCase().includes(q) &&
            state.filters.projectStatus !== opt.name
        ) {
            const colorKey = opt.color || "GRAY";
            const colors =
                STATUS_COLOR_CLASSES[colorKey] || STATUS_COLOR_CLASSES.GRAY;
            suggestions.push({
                type: "projectStatus",
                value: opt.name,
                display: `${t("filter_status")}:${opt.name}`,
                icon: `<span class="w-2.5 h-2.5 rounded-full ${colors.bg}"></span>`,
            });
        }
    });

    // Label suggestions
    state.allLabels.forEach((label) => {
        if (
            label.name.toLowerCase().includes(q) &&
            !state.filters.labels.includes(label.name)
        ) {
            suggestions.push({
                type: "label",
                value: label.name,
                display: `${t("filter_label")}:${label.name}`,
                icon: `<span class="w-2.5 h-2.5 rounded-full flex-shrink-0" style="background-color: #${label.color}"></span>`,
            });
        }
    });

    // Issue title suggestions
    state.roadmapData?.milestones.forEach((milestone) => {
        milestone.issues.forEach((issue) => {
            if (issue.title.toLowerCase().includes(q)) {
                suggestions.push({
                    type: "text",
                    value: issue.title,
                    display: issue.title,
                    icon: '<svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>',
                });
            }
        });
    });

    if (suggestions.length === 0) {
        elements.searchSuggestions.classList.add("hidden");
        return;
    }

    const limitedSuggestions = suggestions.slice(0, 10);

    elements.searchSuggestions.innerHTML = `
    <div class="py-1">
      ${limitedSuggestions
          .map(
              (s, i) => `
        <button class="suggestion-item w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${i === 0 ? "bg-gray-50 dark:bg-gray-700/50" : ""}" data-type="${s.type}" data-value="${s.value.replace(/"/g, "&quot;")}">
          ${s.icon}
          <span class="truncate">${s.display}</span>
          <span class="ml-auto text-xs text-gray-400">${s.type === "projectStatus" ? t("filter_status") : s.type === "label" ? t("filter_label") : t("filter_text")}</span>
        </button>
      `,
          )
          .join("")}
    </div>
  `;
    elements.searchSuggestions.classList.remove("hidden");
}

/**
 * Apply filters and trigger re-render
 */
function applyFilters() {
    renderActiveFilters();
    updateResultsCount();
    populateLabelsDropdown();
    populateStatusDropdown();
    if (onFilterChange) onFilterChange();
}

/**
 * Setup all event listeners for search
 */
function setupEventListeners() {
    // Text input
    elements.searchInput.addEventListener("input", (e) => {
        showSuggestions(e.target.value);
    });

    elements.searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            setTextFilter(elements.searchInput.value.trim());
            elements.searchInput.value = "";
            elements.searchSuggestions.classList.add("hidden");
            applyFilters();
        } else if (e.key === "Escape") {
            elements.searchSuggestions.classList.add("hidden");
        } else if (e.key === "Backspace" && elements.searchInput.value === "") {
            // Remove the last filter badge when backspace is pressed on empty input
            if (state.filters.labels.length > 0) {
                // Remove the last label filter
                const lastLabel =
                    state.filters.labels[state.filters.labels.length - 1];
                removeLabelFilter(lastLabel);
                applyFilters();
                e.preventDefault();
            } else if (state.filters.projectStatus) {
                // Remove the status filter
                setProjectStatusFilter(null);
                applyFilters();
                e.preventDefault();
            } else if (state.filters.text) {
                // Remove the text filter
                setTextFilter("");
                applyFilters();
                e.preventDefault();
            }
        }
    });

    // Suggestion click
    elements.searchSuggestions.addEventListener("click", (e) => {
        const item = e.target.closest(".suggestion-item");
        if (item) {
            const type = item.dataset.type;
            const value = item.dataset.value;

            if (type === "projectStatus") {
                setProjectStatusFilter(value);
            } else if (type === "label") {
                addLabelFilter(value);
            } else if (type === "text") {
                setTextFilter(value);
            }

            elements.searchInput.value = "";
            elements.searchSuggestions.classList.add("hidden");
            applyFilters();
        }
    });

    // Remove filter badge
    elements.activeFilters.addEventListener("click", (e) => {
        const btn = e.target.closest(".remove-filter");
        if (btn) {
            const type = btn.dataset.type;
            const value = btn.dataset.value;

            if (type === "text") {
                setTextFilter("");
            } else if (type === "projectStatus") {
                setProjectStatusFilter(null);
            } else if (type === "label") {
                removeLabelFilter(value);
            }
            applyFilters();
        }
    });

    // Clear all
    elements.clearSearch.addEventListener("click", () => {
        resetFilters();
        elements.searchInput.value = "";
        elements.searchSuggestions.classList.add("hidden");
        applyFilters();
    });

    // Status dropdown (only if elements exist)
    if (elements.statusDropdownBtn && elements.statusDropdown) {
        elements.statusDropdownBtn.addEventListener("click", () => {
            elements.statusDropdown.classList.toggle("hidden");
            elements.labelsDropdown?.classList.add("hidden");
        });

        // Status dropdown click (event delegation for dynamic content)
        elements.statusDropdown.addEventListener("click", (e) => {
            const option = e.target.closest(".status-option");
            if (option) {
                const status = option.dataset.status;
                if (state.filters.projectStatus === status) {
                    setProjectStatusFilter(null); // Toggle off if already selected
                } else {
                    setProjectStatusFilter(status);
                }
                elements.statusDropdown.classList.add("hidden");
                applyFilters();
            }
        });
    }

    // Labels dropdown (only if elements exist)
    if (elements.labelsDropdownBtn && elements.labelsDropdown) {
        elements.labelsDropdownBtn.addEventListener("click", () => {
            elements.labelsDropdown.classList.toggle("hidden");
            elements.statusDropdown?.classList.add("hidden");
        });

        elements.labelsDropdown.addEventListener("click", (e) => {
            const option = e.target.closest(".label-option");
            if (option) {
                const label = option.dataset.label;
                if (state.filters.labels.includes(label)) {
                    removeLabelFilter(label);
                } else {
                    addLabelFilter(label);
                }
                applyFilters();
            }
        });
    }

    // Close dropdowns on outside click
    document.addEventListener("click", (e) => {
        if (
            elements.statusDropdown &&
            !e.target.closest("#status-dropdown-btn") &&
            !e.target.closest("#status-dropdown")
        ) {
            elements.statusDropdown.classList.add("hidden");
        }
        if (
            elements.labelsDropdown &&
            !e.target.closest("#labels-dropdown-btn") &&
            !e.target.closest("#labels-dropdown")
        ) {
            elements.labelsDropdown.classList.add("hidden");
        }
        if (
            !e.target.closest("#search-input") &&
            !e.target.closest("#search-suggestions")
        ) {
            elements.searchSuggestions.classList.add("hidden");
        }
    });
}

/**
 * Handle label click on issue cards (to be called from main app with event delegation)
 * @param {string} label - Label name
 */
export function handleLabelClick(label) {
    if (!state.filters.labels.includes(label)) {
        addLabelFilter(label);
        applyFilters();
    }
}

/**
 * Handle status click on issue cards
 * @param {string} status - Status value
 */
export function handleStatusClick(status) {
    if (state.filters.projectStatus !== status) {
        setProjectStatusFilter(status);
        applyFilters();
    }
}
