import { Enemy } from "./enemy.js";

export class EnemySpawner {
    constructor(game) {
        this.game = game;
        this.enemyAssets;
    }

    async loadEnemiesAssets() {
        this.enemyAssets = await PIXI.Assets.loadBundle('enemies-bundle');
    }

    async spawnEnemies() {
        new Enemy(this.game, this.enemyAssets.bat);
    }
}