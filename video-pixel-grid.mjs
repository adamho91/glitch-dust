// Align solid square edges to the actual drawing buffer, including thumbnails
// and scaled exports. Fractional coverage otherwise leaves faint seams when
// differently colored oversized tiles overlap. Keep subpixel dust antialiased.
export function pixelAlignedRect(matrix, x, y, width, height) {
  const { a, b, c, d, e, f } = matrix;
  if (b !== 0 || c !== 0 || a <= 0 || d <= 0 || width * a < 1 || height * d < 1)
    return [x, y, width, height];
  const left = Math.round(x * a + e),
    top = Math.round(y * d + f),
    right = Math.round((x + width) * a + e),
    bottom = Math.round((y + height) * d + f);
  return [
    (left - e) / a,
    (top - f) / d,
    (right - left) / a,
    (bottom - top) / d,
  ];
}
