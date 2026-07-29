export async function loadContent(file) {
  const response = await fetch(file);

  if (!response.ok) {
    return '<div class="content-panel"><p class="empty-state">Content unavailable.</p></div>';
  }

  const content = await response.text();
  return content;
}
