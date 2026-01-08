// Kanban column component

import { renderCard } from './card.js';
import { filterIssues, sortIssuesByStatus } from '../utils/state.js';
import { stringToHslColor, formatSimpleDate } from '../utils/helpers.js';
import { t } from '../utils/i18n.js';

/**
 * Render a milestone column with filtered issues
 * @param {Object} milestone - Milestone object
 * @returns {string} HTML string (empty if no issues match filters)
 */
export function renderColumn(milestone) {
  const filteredIssues = filterIssues(milestone.issues);
  const sortedIssues = sortIssuesByStatus(filteredIssues);
  
  if (sortedIssues.length === 0) return '';
  
  const issuesHtml = sortedIssues.map(renderCard).join('');
  const dueDate = milestone.dueOn ? formatSimpleDate(milestone.dueOn) : null;

  return `
    <div class="kanban-column overflow-hidden">
      <div class="column-header sticky top-0 px-4 py-3">
        <h2 class="font-semibold text-gray-900 dark:text-white text-xl flex items-center justify-between gap-2">
          <span>${milestone.title}</span>
          ${dueDate ? `<span class="text-xs font-normal text-gray-500 dark:text-gray-400">${dueDate}</span>` : ''}
        </h2>
      </div>
      <div class="p-3 space-y-3 min-h-[200px]">
        ${issuesHtml}
      </div>
    </div>
  `;
}

/**
 * Render all columns for the kanban board
 * @param {Array} milestones - Array of milestone objects
 * @returns {string} HTML string
 */
export function renderKanban(milestones) {
  const html = milestones.map(renderColumn).join('');
  return html || `<div class="text-center py-10 text-gray-500 dark:text-gray-400">${t('no_results')}</div>`;
}
