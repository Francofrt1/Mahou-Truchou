import { Enemy } from "./enemy.js";
import { GameObject } from "./gameObject.js";
import { fastDistanceCalc } from "./utility.js";

export class Projectile extends GameObject {
    constructor(x, y, game, velX, velY, spritesheetAsset = [], color = "orange") {
        super(game, 10, x, y);
        this.velocity.x = velX;
        this.velocity.y = velY;
        this.color = color;
        this.travelAmin = spritesheetAsset[0];
        this.hitAnim = spritesheetAsset[1];

        this.game = game;
        this.grid = game.grid;
        this.vision = 2;
        this.loadAnimationsFromSpritesheet(this.travelAmin, () => {
            this.animation.animationSpeed = 0.3;
            this.animation.anchor.set(0.4, 0.6);
        });

        const mouse = this.game.mouse;
        if(!mouse) return;
        const dx = mouse.x - this.container.x;
        const dy = mouse.y - this.container.y;
        this.container.rotation =  Math.atan2(dy, dx);

        this.setCurrentAnimation("traveling-" + color);
    }
  
    async update() {
        await super.update();

        let outOfBounds = this.container.x < 0 || this.container.y > this.game.boardHeight || this.container.y < 0 || this.container.x > this.game.boardWidth
        if (outOfBounds) {
            this.delete();
        }
  
        let objs = Object.values((this.currentCell || {}).presentObjects || {}).filter((k) => k instanceof Enemy);
        if (objs.length > 0) {
            let distMin = 99999;
            let closest = null;
            for (let i = 0; i < objs.length; i++) {
                let dist = fastDistanceCalc(
                    this.container.x,
                    this.container.y,
                    objs[i].container.x,
                    objs[i].container.y
                );

                if (dist < distMin) {
                    distMin = dist;
                    closest = i;
                }
            }

            if (closest != null) {
                objs[closest].getHit();
                this.delete();
            }
        }
    }

    async delete() {
        this.loadAnimationsFromSpritesheet(this.hitAnim, () => {
            this.animation.animationSpeed = 0.3;
            this.animation.anchor.set(0.4, 0.6);
        });

        this.setCurrentAnimation("hit-" + this.color);
        this.currentAnimation.loop = false;
        this.currentAnimation.gotoAndPlay(0);
        this.game.projectiles = this.game.projectiles.filter((k) => k != this);
        let deleteFn = () => { super.delete(); };
        this.currentAnimation.onComplete = () => deleteFn;
    }
}
  