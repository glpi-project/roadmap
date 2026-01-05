// API utilities for fetching data

const DATA_URL = '../roadmap-data.json';

/**
 * Fetch roadmap data from JSON file
 * @returns {Promise<Object>} Roadmap data object
 */
export async function fetchRoadmapData() {
  const response = await fetch(DATA_URL);
  
  if (!response.ok) {
    throw new Error(`Failed to load data: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.milestones || data.milestones.length === 0) {
    throw new Error('No roadmap data available yet. Please check back later.');
  }

  return data;
}

/**
 * Extract all unique labels from roadmap data
 * @param {Object} data - Roadmap data
 * @returns {Array} Array of unique label objects sorted by name
 */
export function extractLabels(data) {
  const labelMap = new Map();
  
  data.milestones.forEach(milestone => {
    milestone.issues.forEach(issue => {
      issue.labels.forEach(label => {
        if (!labelMap.has(label.name)) {
          labelMap.set(label.name, label);
        }
      });
    });
  });
  
  return Array.from(labelMap.values()).sort((a, b) => 
    a.name.localeCompare(b.name)
  );
}
