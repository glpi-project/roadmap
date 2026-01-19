// Issue card component

import {
    getLuminance,
    highlightText,
    hexToRgb,
    hexToHsl,
    getPerceivedLightness,
    truncateText,
    escapeHtml,
} from "../utils/helpers.js";
import { state } from "../utils/state.js";

// Status color mapping based on GitHub Project colors
const STATUS_COLORS = {
    GREEN: {
        bg: "bg-green-100 dark:bg-green-900/30",
        text: "text-green-800 dark:text-green-300",
        dot: "bg-green-500",
    },
    YELLOW: {
        bg: "bg-yellow-100 dark:bg-yellow-900/30",
        text: "text-yellow-800 dark:text-yellow-300",
        dot: "bg-yellow-500",
    },
    PURPLE: {
        bg: "bg-purple-100 dark:bg-purple-900/30",
        text: "text-purple-800 dark:text-purple-300",
        dot: "bg-purple-500",
    },
    BLUE: {
        bg: "bg-blue-100 dark:bg-blue-900/30",
        text: "text-blue-800 dark:text-blue-300",
        dot: "bg-blue-500",
    },
    ORANGE: {
        bg: "bg-orange-100 dark:bg-orange-900/30",
        text: "text-orange-800 dark:text-orange-300",
        dot: "bg-orange-500",
    },
    RED: {
        bg: "bg-red-100 dark:bg-red-900/30",
        text: "text-red-800 dark:text-red-300",
        dot: "bg-red-500",
    },
    PINK: {
        bg: "bg-pink-100 dark:bg-pink-900/30",
        text: "text-pink-800 dark:text-pink-300",
        dot: "bg-pink-500",
    },
    GRAY: {
        bg: "bg-gray-100 dark:bg-gray-900/30",
        text: "text-gray-800 dark:text-gray-300",
        dot: "bg-gray-500",
    },
};

/**
 * Get color classes for a status option
 * @param {string} statusValue - Status value to look up
 * @returns {Object} Color classes
 */
function getStatusColors(statusValue) {
    const statusField = state.projectFields?.find((f) => f.name === "Status");
    const option = statusField?.options?.find((o) => o.name === statusValue);
    const colorKey = option?.color || "GRAY";
    return STATUS_COLORS[colorKey] || STATUS_COLORS.GRAY;
}

/**
 * Render sub-issues progress bar
 * @param {Object} subIssues - Sub-issues summary { total, completed }
 * @returns {string} HTML string
 */
function renderSubIssuesProgress(subIssues) {
    if (!subIssues || subIssues.total === 0) return "";

    const { total, completed } = subIssues;
    const percentage = Math.round((completed / total) * 100);

    // Create segments for the progress bar
    const segments = [];
    for (let i = 0; i < total; i++) {
        const isCompleted = i < completed;
        segments.push(
            `<div class="sub-issues-segment ${isCompleted ? "completed" : "pending"}"></div>`,
        );
    }

    return `
    <div class="sub-issues-progress" title="Sub-issues: ${completed}/${total} (${percentage}%)">
      <div class="sub-issues-bar">${segments.join("")}</div>
      <span class="sub-issues-count">${completed}/${total}</span>
    </div>
  `;
}

/**
 * Render an issue card
 * @param {Object} issue - Issue object
 * @returns {string} HTML string
 */
export function renderCard(issue) {
    const labelsHtml = renderLabels(issue.labels);
    const title = highlightText(issue.title, state.filters.text);
    const subIssuesHtml = renderSubIssuesProgress(issue.subIssues);

    // Get project status
    const projectStatus = issue.customFields?.Status?.value;
    const statusColors = getStatusColors(projectStatus);

    return `
    <div class="issue-card bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
      <div class="flex items-start gap-2 mb-2">
        ${
            projectStatus
                ? `
          <span class="status-dot flex-shrink-0 w-3 h-3 rounded-full ${statusColors.dot} mt-1 cursor-pointer"
                role="img"
                title="${projectStatus}"
                aria-label="Status: ${projectStatus}"
                data-status="${projectStatus}"></span>
        `
                : ""
        }
        ${
            issue.isPrivate
                ? `
          <span class="card-title font-medium text-gray-900 dark:text-white text-sm leading-snug flex-1">
            ${title}
          </span>
        `
                : `
          <a href="${issue.url}" target="_blank" rel="noopener" class="card-title font-medium text-gray-900 dark:text-white text-sm leading-snug hover:text-primary-600 dark:hover:text-primary-400 flex-1">
            ${title}
          </a>
        `
        }
      </div>
      ${
          issue.description
              ? `
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-2 mb-1 leading-relaxed line-clamp-3 whitespace-pre-wrap" title="${escapeHtml(issue.description)}">${truncateText(issue.description, 300)}</p>
      `
              : ""
      }
      ${subIssuesHtml}
      ${labelsHtml ? `<div class="flex flex-wrap gap-1.5 mt-3">${labelsHtml}</div>` : ""}
    </div>
  `;
}

/**
 * Render label pills for an issue
 * @param {Array} labels - Array of label objects
 * @returns {string} HTML string
 */
function renderLabels(labels) {
    return labels
        .map((label) => {
            const isLight = getLuminance(label.color) > 0.5;
            const isActive = state.filters.labels.includes(label.name);

            // Get color components for GitHub-style dark mode
            const { r, g, b } = hexToRgb(label.color);
            const { h, s, l } = hexToHsl(label.color);
            const perceivedLightness = getPerceivedLightness(label.color);

            // CSS variables for dark mode calculations
            const cssVars = `--label-r:${r}; --label-g:${g}; --label-b:${b}; --label-h:${h}; --label-s:${s}; --label-l:${l}; --perceived-lightness:${perceivedLightness.toFixed(3)}`;

            return `<span class="label-pill" style="--label-color: #${label.color}; ${cssVars}" data-label="${label.name}">${label.name}</span>`;
        })
        .join("");
}
