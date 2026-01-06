// Theme toggle component

/**
 * Initialize theme based on saved preference or system preference
 */
export function initTheme() {
  const params = new URLSearchParams(window.location.search);
  const urlTheme = params.get('theme');

  if (urlTheme === 'dark' || urlTheme === 'light') {
    document.documentElement.classList.toggle('dark', urlTheme === 'dark');
    return;
  }

  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.documentElement.classList.add('dark');
  }
}

/**
 * Toggle between light and dark theme
 */
export function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

/**
 * Setup theme toggle button
 * @param {HTMLElement} button - Theme toggle button element
 */
export function setupThemeToggle(button) {
  button.addEventListener('click', toggleTheme);
}
