// Brand micro-shapes in a 24 × 24 box (the logo's flower, a sparkle, a heart, a star). Shared by inline icons,
// stickers and the cursor-sparkle trail.
export const SHAPES = {
  flower: "M7.02 5.15A5.06 5.06 0 1 1 16.98 5.15A5.06 5.06 0 1 1 20.05 14.62A5.06 5.06 0 1 1 12 20.47A5.06 5.06 0 1 1 3.95 14.62A5.06 5.06 0 1 1 7.02 5.15Z",
  flowerCentre: "M8.7 12a3.3 3.3 0 1 0 6.6 0a3.3 3.3 0 1 0 -6.6 0Z",
  spark: "M12 1C12.97 9.58 14.42 11.03 23 12C14.42 12.97 12.97 14.42 12 23C11.03 14.42 9.58 12.97 1 12C9.58 11.03 11.03 9.58 12 1Z",
  heart: "M12 21s-7.5-4.6-9.6-9.3C.9 8.2 3 4.5 6.7 4.5c2.1 0 3.6 1.2 5.3 3.1 1.7-1.9 3.2-3.1 5.3-3.1 3.7 0 5.8 3.7 4.3 7.2C19.5 16.4 12 21 12 21Z",
  star: "M12 2.5l2.7 6.1 6.6.6-5 4.4 1.5 6.5L12 16.7l-5.8 3.4 1.5-6.5-5-4.4 6.6-.6Z",
} as const;

/** viewBox that fits the flower's overhanging petals plus an outline (the other shapes fit 0 0 24 24). */
export const FLOWER_VIEWBOX = "-1.4 -1.8 26.8 26.8";
