import { GameObject } from "./gameObject.js";

export class Enemy extends GameObject {
    constructor(game, spritesheetAsset, maxVelocity = 5, x = 500, y = 500) {
        super(game, maxVelocity, x, y);
        
        this.loadAnimationsFromSpritesheet(spritesheetAsset, () => {
            this.animation.animationSpeed = 0.3;
            this.animation.anchor.set(0.4, 0.6);
        });
        this.setCurrentAnimation("idle");
    }
}