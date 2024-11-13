import { Enemy } from "./enemy.js";

export class EnemySpawner {
    constructor(game) {
        this.game = game;
        this.enemyAssets;
        this.enemies = [];
        this.grid = game.grid;
    }

    async loadEnemiesAssets() {
        this.enemyAssets = await PIXI.Assets.loadBundle('enemies-bundle');
    }

    async spawnEnemies(quantity = 10) {
        for (let i = 0; i < quantity; i++) {
            const enemy = new Enemy(
                this.game,
                this.enemyAssets.bat,
                5,
                Math.random() * this.game.canvasWidth,
                Math.random() * this.game.canvasHeight,
            );
            this.enemies.push(enemy);
            this.grid.add(enemy);
        }
    }

    async update() {
        this.enemies.forEach((enemy) => {
            enemy.update();
        });
    }
}