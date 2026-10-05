export function transformFromLandmarks(landmarks, width, height, settings) {
  if (!(landmarks == null ? void 0 : landmarks.length) || width <= 0 || height <= 0) return null;
  let minX = 1, minY = 1, maxX = 0, maxY = 0;
  for (const point of landmarks) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }
  const faceWidth = (maxX - minX) * width;
  const faceHeight = (maxY - minY) * height;
  if (faceWidth < 8 || faceHeight < 8) return null;
  const cx = (minX + maxX) * 0.5 * width;
  const cy = (minY + maxY) * 0.5 * height;
  const side = Math.max(faceWidth, faceHeight) * 1.36 * settings.scale;
  return { x: cx, y: cy, size: side, rotation: 0, visible: true };
}

export function transformFromDetection(detection, width, height, settings) {
  const box = detection == null ? void 0 : detection.boundingBox;
  if (!box || width <= 0 || height <= 0) return null;
  let originX = Number(box.originX ?? 0);
  let originY = Number(box.originY ?? 0);
  let boxWidth = Number(box.width ?? 0);
  let boxHeight = Number(box.height ?? 0);
  if (boxWidth > 0 && boxWidth <= 2 && boxHeight > 0 && boxHeight <= 2) {
    originX *= width;
    originY *= height;
    boxWidth *= width;
    boxHeight *= height;
  }
  if (boxWidth < 6 || boxHeight < 6) return null;
  const cx = originX + boxWidth * 0.5;
  const cy = originY + boxHeight * 0.5;
  const side = Math.max(boxWidth, boxHeight) * 1.24 * settings.scale;
  return { x: cx, y: cy, size: side, rotation: 0, visible: true };
}

export function smoothTransform(previous, next, smoothing) {
  if (!next) return previous ? { ...previous, visible: false } : null;
  if (!previous || !previous.visible) return next;
  const alpha = Math.min(0.95, Math.max(0.05, smoothing));
  return {
    x: previous.x + (next.x - previous.x) * alpha,
    y: previous.y + (next.y - previous.y) * alpha,
    size: previous.size + (next.size - previous.size) * alpha,
    rotation: 0,
    visible: true
  };
}
