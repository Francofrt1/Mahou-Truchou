export function fastDistanceCalc(x1, y1, x2, y2) {
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
  
    return dx > dy ? dx + 0.4 * dy : dy + 0.4 * dx;
}