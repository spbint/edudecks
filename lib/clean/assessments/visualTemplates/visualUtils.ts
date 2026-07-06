export type VisualPoint = {
  x: number;
  y: number;
};

export function clampInteger(value: unknown, min: number, max: number, fallback: number) {
  const next = Math.floor(Number(value));
  if (!Number.isFinite(next)) return fallback;
  return Math.max(min, Math.min(max, next));
}

export function numberOrFallback(value: unknown, fallback: number) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

export function seededUnit(seed: number, index: number, salt: number) {
  const raw = Math.sin(seed * 97.13 + index * 41.7 + salt * 19.91) * 10000;
  return raw - Math.floor(raw);
}

export function buildScatteredPoints(
  count: number,
  seed: number,
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
  minDistance: number,
) {
  const points: VisualPoint[] = [];

  for (let index = 0; index < count; index += 1) {
    let candidate: VisualPoint = {
      x: bounds.minX + seededUnit(seed, index, 1) * (bounds.maxX - bounds.minX),
      y: bounds.minY + seededUnit(seed, index, 2) * (bounds.maxY - bounds.minY),
    };

    for (let attempt = 0; attempt < 16; attempt += 1) {
      const overlaps = points.some((point) => {
        const dx = point.x - candidate.x;
        const dy = point.y - candidate.y;
        return Math.sqrt(dx * dx + dy * dy) < minDistance;
      });

      if (!overlaps) break;

      candidate = {
        x: bounds.minX + seededUnit(seed + attempt + 1, index, 3) * (bounds.maxX - bounds.minX),
        y: bounds.minY + seededUnit(seed + attempt + 1, index, 4) * (bounds.maxY - bounds.minY),
      };
    }

    points.push({
      x: Math.round(candidate.x * 10) / 10,
      y: Math.round(candidate.y * 10) / 10,
    });
  }

  return points;
}

export function pluralise(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}
