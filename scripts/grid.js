import { Cell } from "./cell.js";

export class Grid {
    constructor(cellSize, game) {
        this.game = game;
        this.app = game.app;
        this.cellSize = cellSize;
        this.numColumns = Math.ceil(this.game.canvasWidth / cellSize);
        this.numRows = Math.ceil(this.game.canvasHeight / cellSize);

        this.cells = [];
        for (let x = 0; x < this.numColumns; x++) {
            this.cells[x] = [];
            for (let y = 0; y < this.numRows; y++) {
              this.cells[x][y] = new Cell(x, y, this.game);
            }
        }
    }
  
  async getCell(x, y) {
      let newx = Math.max(0, Math.min(this.numColumns - 1, x));
      let newy = Math.max(0, Math.min(this.numRows - 1, y));
  
      return this.cells[newx][newy];
  }
  
  async add(object) {
      const xIndex = Math.floor(object.container.x / this.cellSize);
      const yIndex = Math.floor(object.container.y / this.cellSize);
  
      const cell = await this.getCell(xIndex, yIndex);
      if (!cell) return;
      cell.add(object);
  }
  
  async remove(object) {
      if (object.currentCell) {
        object.currentCell.remove(object);
      }
  }
  
  async update(object) {
      this.remove(object);
      this.add(object);
  }
}
  