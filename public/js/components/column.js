// Kanban column component

import { renderCard } from './card.js';
import { filterIssues, sortIssuesByStatus } from '../utils/state.js';
import { stringToHslColor, formatSimpleDate } from '../utils/helpers.js';
import { t } from '../utils/i18n.js';

/**
 * Render a milestone column with filtered issues
 * @param {Object} milestone - Milestone object
 * @param {boolean} hasAnyDescription - Whether any milestone in the board has a description
 * @param {number} index - Column index for specific styling
 * @param {boolean} isLast - Whether this is the last visible column
 * @returns {string} HTML string (empty if no issues match filters)
 */
export function renderColumn(milestone, hasAnyDescription = false, index = -1, isLast = false) {
  const filteredIssues = filterIssues(milestone.issues);
  const sortedIssues = sortIssuesByStatus(filteredIssues);
  
  if (sortedIssues.length === 0) return '';
  
  const issuesHtml = sortedIssues.map(renderCard).join('');
  const dueDate = milestone.dueOn ? formatSimpleDate(milestone.dueOn) : null;

  return `
    <div class="kanban-column overflow-hidden ${index >= 0 ? `column-${index}` : ''} ${isLast ? 'last-column' : ''}">
      <div class="column-header sticky top-0 px-4 py-6 flex flex-col items-center">
        <h2 class="milestone-title flex flex-col items-center gap-1">
          <span>${milestone.title}</span>
          ${dueDate ? `<span class="text-xs font-normal text-gray-500 dark:text-gray-400">${dueDate}</span>` : ''}
        </h2>
        ${milestone.description ? 
          `<p class="mt-1 text-sm text-gray-600 dark:text-gray-400 milestone-description line-clamp-1 text-center" title="${milestone.description.replace(/"/g, '&quot;')}">${milestone.description}</p>` : 
          (hasAnyDescription ? '<div class="mt-1 text-sm milestone-description-placeholder opacity-0 select-none">&nbsp;</div>' : '')
        }
      </div>
      <div class="p-3 space-y-3 mt-3 min-h-[200px]">
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
  // Check if any milestone that will be rendered has a description
  const hasAnyDescription = milestones.some(m => {
    const filtered = filterIssues(m.issues);
    return filtered.length > 0 && m.description;
  });

  // Filter out empty columns first if needed, but here we just render them all and rely on renderColumn to return empty string
  // To keep consistent indices for visible columns, we should filter milestones first
  const visibleMilestones = milestones.filter(m => filterIssues(m.issues).length > 0);

  const html = visibleMilestones.map((m, index) => {
    const isLast = index === visibleMilestones.length - 1;
    return renderColumn(m, hasAnyDescription, index, isLast);
  }).join('');
  return html || `<div class="text-center py-10 text-gray-500 dark:text-gray-400">${t('no_results')}</div>`;
}
