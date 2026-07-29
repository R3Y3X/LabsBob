export function setTheme(theme) {
  if (theme === 'dark') {
    document.body.classList.add('cds--g100');
    document.body.classList.remove('cds--white');
  } else {
    document.body.classList.remove('cds--g100');
  }
  window.localStorage.setItem('theme', theme);
}

export function initializeTheme() {
  const savedTheme = window.localStorage.getItem('theme') || 'light';
  setTheme(savedTheme);
}

export function toggleTheme() {
  const isDark = document.body.classList.contains('cds--g100');
  setTheme(isDark ? 'light' : 'dark');
}
