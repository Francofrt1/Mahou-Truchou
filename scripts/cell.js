export class Cell {
    constructor(x, y, game) {
      this.x = x;
      this.y = y;
      this.game = game;
  
      this.presentObjects = {};
    }

    async add(obj) {
      this.presentObjects[obj.id] = obj;
      obj.currentCell = this;
    }

    async remove(obj) {
      obj.currentCell = null;
      delete this.presentObjects[obj.id];
    }

    async objectsCount() {
      return Object.keys(this.presentObjects).length;
    }

    // async updateIfCanPass() {
    //   if (this.objectsCount() > 2) {
    //     this.passable = false;
    //   } else {
    //     this.passable = true;
    //   }
    // }
  
    async getNeighborsCells() {
      let neighbors = [];
  
      const margin = 1;
      for (let i = this.x - margin; i <= this.x + margin; i++) {
        for (let j = this.y - margin; j <= this.y + margin; j++) {
          const cell = this.game.grid.getCell(i, j);
  
          if (cell && cell != this) {
            neighbors.push(cell);
          }
        }
      }
      return neighbors;
    }
}
  