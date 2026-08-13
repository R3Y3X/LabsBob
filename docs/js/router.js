export function parseRoute(hash) {
  const raw = (hash || '').replace(/^#?\/?/, '');

  if (!raw) {
    return { view: 'home' };
  }

  const [path, query] = raw.split('?');
  const params = new URLSearchParams(query || '');
  const parts = path.split('/').filter(Boolean);

  if (parts.length >= 2 && parts[0] === 'lab') {
    return {
      view: 'lab',
      labSlug: parts[1],
      stepSlug: parts[2] || 'overview',
      headingId: params.get('h') || null
    };
  }

  return { view: 'home' };
}

export function getHomeRoute() {
  return '#/';
}

export function getLabRoute(labSlug, stepSlug = 'overview', headingId) {
  const base = `#/lab/${labSlug}/${stepSlug}`;
  return headingId ? `${base}?h=${encodeURIComponent(headingId)}` : base;
}
