export function fastDistanceCalc(x1, y1, x2, y2) {
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
  
    return dx > dy ? dx + 0.4 * dy : dy + 0.4 * dx;
}

/**
* Calculates the squared distance between 2 points.
* @param {number} x1 - The x coordinate of 1st point.
* @param {number} y1 - The y coordinate of 1st point.
* @param {number} x2 - The x coordinate of 2nd point.
* @param {number} y2 - The y coordinate of 2nd point.
* @returns {number} The squared distance between 2 points.
*/
export function squaredDistance(x1, y1, x2, y2) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return dx * dx + dy * dy;
}

export function normalizeVector(x, y) {
    if (x == 0 && y == 0) {
        return null;
    }
  
    let magnitude = fastDistanceCalc(0, 0, x, y);
  
    if (magnitude == 0) return null;
  
    let rta = { x, y };
  
    rta.x /= magnitude;
    rta.y /= magnitude;
  
    return rta;
}

export function generateId(size = 8) {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let id = "";
    for (let i = 0; i < size; i++) {
      id += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return id;
}