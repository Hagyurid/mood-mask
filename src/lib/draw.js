let paperTile = null;
export function drawSticker(ctx, transform, expressionText, settings) {
  if (!(transform == null ? void 0 : transform.visible)) return;
  const { x, y, size } = transform;
  const boxWidth = size * 1.22;
  const boxHeight = size * 0.92;
  const halfW = boxWidth / 2;
  const halfH = boxHeight / 2;
  const radius = Math.min(boxHeight, boxWidth) * settings.radiusRatio;
  ctx.save();
  ctx.translate(x, y);
  if (settings.shadowOpacity > 0) {
    ctx.shadowColor = `rgba(78, 69, 61, ${settings.shadowOpacity})`;
    ctx.shadowBlur = Math.max(4, boxWidth * 0.032);
    ctx.shadowOffsetY = Math.max(1, boxHeight * 0.035);
  }
  roundedRect(ctx, -halfW, -halfH, boxWidth, boxHeight, radius);
  ctx.fillStyle = settings.background;
  ctx.fill();
  const texture = getPaperPattern(ctx);
  if (texture) {
    ctx.save();
    ctx.clip();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = texture;
    ctx.fillRect(-halfW, -halfH, boxWidth, boxHeight);
    ctx.restore();
  }
  ctx.shadowColor = "transparent";
  ctx.lineWidth = Math.max(1, boxWidth * 0.006);
  ctx.strokeStyle = settings.border;
  ctx.stroke();
  ctx.fillStyle = settings.foreground;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 ${Math.round(boxHeight * 0.34)}px "Marker Felt", "Chalkboard SE", "Comic Sans MS", "Apple SD Gothic Neo", sans-serif`;
  ctx.fillText(expressionText, 0, boxHeight * 0.015, boxWidth * 0.82);
  ctx.restore();
}
function getPaperPattern(ctx) {
  if (!paperTile) {
    paperTile = document.createElement("canvas");
    paperTile.width = 72;
    paperTile.height = 72;
    const pctx = paperTile.getContext("2d");
    if (!pctx) return null;
    pctx.fillStyle = "#f7f3ea";
    pctx.fillRect(0, 0, paperTile.width, paperTile.height);
    for (let i = 0; i < 110; i += 1) {
      const x = Math.random() * paperTile.width;
      const y = Math.random() * paperTile.height;
      const a = 0.035 + Math.random() * 0.045;
      const r = 0.6 + Math.random() * 1.3;
      pctx.fillStyle = `rgba(122, 108, 95, ${a})`;
      pctx.beginPath();
      pctx.arc(x, y, r, 0, Math.PI * 2);
      pctx.fill();
    }
    for (let i = 0; i < 18; i += 1) {
      const x = Math.random() * paperTile.width;
      const y = Math.random() * paperTile.height;
      const len = 7 + Math.random() * 15;
      pctx.strokeStyle = `rgba(144, 126, 110, ${0.05 + Math.random() * 0.05})`;
      pctx.lineWidth = 0.7;
      pctx.beginPath();
      pctx.moveTo(x, y);
      pctx.lineTo(x + len, y + (Math.random() * 4 - 2));
      pctx.stroke();
    }
  }
  return ctx.createPattern(paperTile, "repeat");
}
function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}
