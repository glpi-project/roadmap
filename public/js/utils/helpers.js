// Utility functions shared across the application

/**
 * Calculate luminance to determine if text should be light or dark
 * @param {string} hex - Hex color code without #
 * @returns {number} Luminance value between 0 and 1
 */
export function getLuminance(hex) {
  const rgb = parseInt(hex, 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = rgb & 0xff;
  
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

/**
 * Format ISO date string for display
 * @param {string} isoString - ISO date string
 * @returns {string} Formatted date string
 */
export function formatDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const lang = localStorage.getItem('glpi_roadmap_lang') || 'en';
  return date.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format ISO date string for simple display (e.g., Dec 31, 2025)
 * @param {string} isoString - ISO date string
 * @returns {string} Formatted date string
 */
export function formatSimpleDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const lang = localStorage.getItem('glpi_roadmap_lang') || 'en';
  return date.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Escape HTML to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Highlight search text in a string
 * @param {string} text - Text to highlight in
 * @param {string} query - Search query to highlight
 * @returns {string} HTML string with highlighted matches
 */
export function highlightText(text, query) {
  if (!query) return escapeHtml(text);
  const escaped = escapeHtml(text);
  const regex = new RegExp(`(${escapeHtml(query)})`, 'gi');
  return escaped.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">$1</mark>');
}

/**
 * Truncate text to a maximum length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * Generate a consistent HSL color from a string
 * @param {string} str - Input string
 * @param {number} saturation - Saturation percentage (default 65)
 * @param {number} lightness - Lightness percentage (default 55)
 * @returns {string} HSL color string
 */
export function stringToHslColor(str, saturation = 65, lightness = 55) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Brighten a hex color for dark mode text/border
 * @param {string} hex - Hex color without #
 * @param {number} amount - Amount to brighten (0-1, default 0.4)
 * @returns {string} Brightened hex color with #
 */
export function brightenColor(hex, amount = 0.4) {
  const rgb = parseInt(hex, 16);
  let r = (rgb >> 16) & 0xff;
  let g = (rgb >> 8) & 0xff;
  let b = rgb & 0xff;
  
  // Brighten by mixing with white
  r = Math.round(r + (255 - r) * amount);
  g = Math.round(g + (255 - g) * amount);
  b = Math.round(b + (255 - b) * amount);
  
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * Convert hex color to RGB components
 * @param {string} hex - Hex color without #
 * @returns {Object} { r, g, b }
 */
export function hexToRgb(hex) {
  const rgb = parseInt(hex, 16);
  return {
    r: (rgb >> 16) & 0xff,
    g: (rgb >> 8) & 0xff,
    b: rgb & 0xff
  };
}

/**
 * Convert hex color to HSL components
 * @param {string} hex - Hex color without #
 * @returns {Object} { h, s, l }
 */
export function hexToHsl(hex) {
  const { r, g, b } = hexToRgb(hex);
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const l = (max + min) / 2;
  
  let h = 0;
  let s = 0;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case rNorm: h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6; break;
      case gNorm: h = ((bNorm - rNorm) / d + 2) / 6; break;
      case bNorm: h = ((rNorm - gNorm) / d + 4) / 6; break;
    }
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

/**
 * Calculate perceived lightness for a color
 * Uses sRGB luminance formula
 * @param {string} hex - Hex color without #
 * @returns {number} Perceived lightness 0-1
 */
export function getPerceivedLightness(hex) {
  const { r, g, b } = hexToRgb(hex);
  // sRGB luminance formula
  return (r * 0.2126 + g * 0.7152 + b * 0.0722) / 255;
}
