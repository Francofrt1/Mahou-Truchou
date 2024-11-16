import { Enemy } from "./enemy.js";

export class EnemySpawner {
    constructor(game, baseQuantity = 50) {
        this.game = game;
        this.enemyAssets;
        this.enemies = [];
        this.grid = game.grid;
        this.baseQuantity = baseQuantity;
        this.baseLife = 10;
        this.baseExp = 10;
        this.baseDmg = 10;
        this.baseVelocity = 5;
        this.easyEnemyDist = 70;
        this.normalEnemyDist = 30;
        this.hardEnemyDist = 0;
        this.maxQuantity = 1300;
    }

    async loadEnemiesAssets() {
        this.enemyAssets = await PIXI.Assets.loadBundle('enemies-bundle');
    }

    async spawnEnemies() {

        let gameTime = await this.game.secondsSinceGameStarted();
        let timesSpawned = Math.trunc(gameTime / 20);
        gameTime = gameTime > 0 ? gameTime : 1;
        
        let quantity =  this.baseQuantity * (timesSpawned != 0 ? timesSpawned : 1);

        if(this.enemies.length >= this.maxQuantity) {
            quantity = 0;
        } else if(this.enemies.length + quantity > 1600) {
            quantity = this.maxQuantity - this.enemies.length;
        }

        if(timesSpawned > 3) {
            this.easyEnemyDist = 60;
            this.normalEnemyDist = 35;
            this.hardEnemyDist = 5;
        }

        if(timesSpawned > 6) {
            this.easyEnemyDist = 55;
            this.normalEnemyDist = 30;
            this.hardEnemyDist = 10;
        }

        if(timesSpawned > 8) {
            this.easyEnemyDist = 45;
            this.normalEnemyDist = 35;
            this.hardEnemyDist = 20;
        }

        if(timesSpawned > 11) {
            this.easyEnemyDist = 20;
            this.normalEnemyDist = 50;
            this.hardEnemyDist = 30;
        }

        for (let i = 0; i < (quantity * this.easyEnemyDist/100); i++) {
            const enemy = new Enemy(
                this.game,
                this.enemyAssets.bat,
                this.baseVelocity,
                Math.random() * this.game.canvasWidth,
                Math.random() * this.game.canvasHeight,
                this.baseLife / 2 + gameTime / 2,
                this.baseExp / 2 + gameTime / 2,
                this.baseDmg / 2 + gameTime / 2
            );
            this.enemies.push(enemy);
            this.grid.add(enemy);
        }

        for (let i = 0; i < quantity * this.normalEnemyDist/100; i++) {
            const enemy = new Enemy(
                this.game,
                this.enemyAssets.demon,
                this.baseVelocity * 0.6,
                Math.random() * this.game.canvasWidth,
                Math.random() * this.game.canvasHeight,
                this.baseLife + gameTime / 2,
                this.baseExp + gameTime / 2,
                this.baseDmg + gameTime / 2,
                30
            );
            this.enemies.push(enemy);
            this.grid.add(enemy);
        }

        for (let i = 0; i < quantity * this.hardEnemyDist/100; i++) {
            const enemy = new Enemy(
                this.game,
                this.enemyAssets.undead,
                this.baseVelocity * 0.4,
                Math.random() * this.game.canvasWidth,
                Math.random() * this.game.canvasHeight,
                this.baseLife * 2 + gameTime / 2,
                this.baseExp * 2 + gameTime / 2,
                this.baseDmg * 2 + gameTime / 2
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

    async deleteAllEnemies() {
        this.enemies.forEach((enemy) => {
            enemy.delete();
        });
    }
}