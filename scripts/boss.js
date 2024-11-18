import { Enemy } from "./enemy.js";
import { normalizeVector } from "./utility.js";
import { BossProjectile } from "./bossProjectile.js";

export class Boss extends Enemy {
    constructor(game, spritesheetAsset, maxVelocity = 3.5, x = 800, y = 500, life = 2000, expGiven = 100000, damage = 500) {
        super(game, spritesheetAsset, maxVelocity, x, y, life, expGiven, damage, 500, 5000);
        this.rangeDamage = 100;

        this.initBoss();
    }

    async initBoss() {
        this.game.setCounter(10, () => {
            if(this.game.enemySpawner.boss == null) return;

            this.rangeAttack();
        }, true);

        this.life = this.game.character.baseAttack * 200;
    }

    async playerAttraction() {
        const vecDistance = new PIXI.Point(
            this.game.character.container.x - this.container.x,
            this.game.character.container.y - this.container.y
          );
      
          let vecNormalized = normalizeVector(vecDistance.x, vecDistance.y);
      
          vecDistance.x = vecNormalized.x * 10000;
          vecDistance.y = vecNormalized.y * 10000;
          return vecDistance;
    }

    async rangeAttack() {
        this.shooting = true;
        let playerX = this.game.character.container.x;
        let playerY = this.game.character.container.y

        

        for (let index = 1; index < 15; index++) {
            let startX = playerX + 200 * Math.cos(index * 30);
            let startY = playerY + 200 * Math.sin(index * 30);

            let angle = Math.atan2(
                playerX - startX,
                playerY - startY
            );

            let projAnims = await this.game.getProjectileAnims("fireball");
            this.game.projectiles.push(
              new BossProjectile(
                startX,
                startY,
                this.game,
                Math.sin(angle),
                Math.cos(angle),
                projAnims,
                "red",
                this.rangeDamage
              )
            );
        }
    }

    async delete() {
        super.delete();
        this.game.setCounter(10, () => {
            this.game.winGame();
        })
    }
}