import { Projectile } from "./projectile.js";

export class BossProjectile extends Projectile {
    constructor(x, y, game, velX, velY, spritesheetAsset, color, damage) {
        super(x, y, game, velX, velY, spritesheetAsset, color, damage);
        
        const dx = this.game.character.container.x - this.game.app.stage.x - this.container.x;
        const dy = this.game.character.container.y - this.game.app.stage.y - this.container.y;
        this.container.rotation =  Math.atan2(dy, dx);
        this.distMin = 50;
    }

    async getObjectsToHit() {
        return [this.game.character];
    }
}