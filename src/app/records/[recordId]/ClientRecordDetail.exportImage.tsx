import html2canvas from 'html2canvas';

export async function exportScoreTableToImage(targetId: string) {
  const target = document.getElementById(targetId);
  if (!target) return;

  // 1. Temporarily expand width for capture (prevent cropping)
  const prevMinWidth = target.style.minWidth;
  const prevWidth = target.style.width;
  target.style.minWidth = '600px';
  target.style.width = 'auto';
  target.style.overflow = 'visible';
  target.style.boxSizing = 'border-box';

  // 2. Capture with html2canvas (higher scale, CORS)
  let canvas;
  try {
    canvas = await html2canvas(target, { scale: 2, useCORS: true });
  } finally {
    // 3. Restore previous style
    target.style.minWidth = prevMinWidth;
    target.style.width = prevWidth;
    target.style.overflow = '';
    target.style.boxSizing = '';
  }

  // 4. Save image
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = 'golf_score_table.png';
  link.click();
}
