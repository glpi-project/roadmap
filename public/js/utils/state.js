// Application state management

/**
 * Application state singleton
 */
export const state = {
  // Data
  roadmapData: null,
  allLabels: [],
  projectFields: [], // Custom fields from GitHub Project
  
  // Active filters
  filters: {
    text: '',
    issueState: null,    // OPEN/CLOSED
    projectStatus: null, // Custom Status field (Todo, In Progress, etc.)
    labels: []
  }
};

/**
 * Reset all filters to defaults
 */
export function resetFilters() {
  state.filters = {
    text: '',
    issueState: null,
    projectStatus: null,
    labels: []
  };
}

/**
 * Check if any filters are active
 * @returns {boolean}
 */
export function hasActiveFilters() {
  return state.filters.text || 
         state.filters.issueState || 
         state.filters.projectStatus ||
         state.filters.labels.length > 0;
}

/**
 * Add a label to filters
 * @param {string} label - Label name to add
 */
export function addLabelFilter(label) {
  if (!state.filters.labels.includes(label)) {
    state.filters.labels.push(label);
  }
}

/**
 * Remove a label from filters
 * @param {string} label - Label name to remove
 */
export function removeLabelFilter(label) {
  state.filters.labels = state.filters.labels.filter(l => l !== label);
}

/**
 * Set issue state filter (OPEN/CLOSED)
 * @param {string|null} issueState - State to filter by
 */
export function setIssueStateFilter(issueState) {
  state.filters.issueState = issueState;
}

/**
 * Set project status filter (custom field)
 * @param {string|null} status - Status to filter by
 */
export function setProjectStatusFilter(status) {
  state.filters.projectStatus = status;
}

/**
 * Set text filter
 * @param {string} text - Text to filter by
 */
export function setTextFilter(text) {
  state.filters.text = text;
}

/**
 * Get the Status field options from project fields
 * @returns {Array} Status options
 */
export function getStatusOptions() {
  const statusField = state.projectFields.find(f => f.name === 'Status');
  return statusField?.options || [];
}

/**
 * Sort issues by their Project Status custom field based on the defined options order
 * @param {Array} issues - Array of issues to sort
 * @returns {Array} Sorted issues
 */
export function sortIssuesByStatus(issues) {
  const statusOptions = getStatusOptions();
  if (statusOptions.length === 0) return issues;
  
  // Create a map of status name to its index for fast lookup
  const statusOrder = new Map();
  statusOptions.forEach((opt, index) => {
    statusOrder.set(opt.name, index);
  });
  
  return [...issues].sort((a, b) => {
    const statusA = a.customFields?.Status?.value;
    const statusB = b.customFields?.Status?.value;
    
    const indexA = statusOrder.has(statusA) ? statusOrder.get(statusA) : statusOptions.length;
    const indexB = statusOrder.has(statusB) ? statusOrder.get(statusB) : statusOptions.length;
    
    return indexA - indexB;
  });
}

/**
 * Filter issues based on active filters
 * @param {Array} issues - Array of issues to filter
 * @returns {Array} Filtered issues
 */
export function filterIssues(issues) {
  return issues.filter(issue => {
    // Text filter
    if (state.filters.text) {
      const searchText = state.filters.text.toLowerCase();
      const titleMatch = issue.title.toLowerCase().includes(searchText);
      const labelMatch = issue.labels.some(l => l.name.toLowerCase().includes(searchText));
      if (!titleMatch && !labelMatch) return false;
    }
    
    // Issue state filter (OPEN/CLOSED)
    if (state.filters.issueState && issue.state !== state.filters.issueState) {
      return false;
    }
    
    // Project status filter (custom field)
    if (state.filters.projectStatus) {
      const issueStatus = issue.customFields?.Status?.value;
      if (issueStatus !== state.filters.projectStatus) {
        return false;
      }
    }
    
    // Labels filter (must have ALL selected labels)
    if (state.filters.labels.length > 0) {
      const issueLabels = issue.labels.map(l => l.name);
      const hasAllLabels = state.filters.labels.every(label => issueLabels.includes(label));
      if (!hasAllLabels) return false;
    }
    
    return true;
  });
}

/**
 * Count total filtered issues across all milestones
 * @returns {number}
 */
export function countFilteredIssues() {
  if (!state.roadmapData) return 0;
  
  let total = 0;
  state.roadmapData.milestones.forEach(milestone => {
    total += filterIssues(milestone.issues).length;
  });
  return total;
}

/**
 * Get total issues count
 * @returns {number}
 */
export function getTotalIssues() {
  if (!state.roadmapData) return 0;
  return state.roadmapData.milestones.reduce((sum, m) => sum + m.issues.length, 0);
}
