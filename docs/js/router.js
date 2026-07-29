export function parseRoute(hash) {
  const cleanHash = hash.replace(/^#?\/?/, '');

  if (!cleanHash) {
    return { view: 'home' };
  }

  const parts = cleanHash.split('/').filter(Boolean);

  if (parts.length >= 2 && parts[0] === 'lab') {
    return {
      view: 'lab',
      labSlug: parts[1],
      stepSlug: parts[2] || 'overview'
    };
  }

  return { view: 'home' };
}

export function getHomeRoute() {
  return '#/';
}

export function getLabRoute(labSlug, stepSlug = 'overview') {
  return `#/lab/${labSlug}/${stepSlug}`;
}
