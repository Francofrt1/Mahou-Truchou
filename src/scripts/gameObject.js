import { fastDistanceCalc } from './utility.js' 

export class GameObject {
    constructor(game, maxVelocity = 10, x = 100, y = 100) {
        this.container = new PIXI.Container();
        this.game = game;
        this.animatedSprites = {};
        this.currentAnimation;
        this.velocity = new PIXI.Point(0, 0);
        this.maxVelocity = maxVelocity;
        this.container.x = x;
        this.container.y = y;

        this.addSelfToCanvas();
    }

    async addSelfToCanvas() {
        this.game.app.stage.addChild(this.container);
    }

    async loadAnimationsFromSpritesheet(spritesheet) {
        for(let key in spritesheet.animations) {
            let animationSprite = spritesheet.animations[key];
            let animation = new PIXI.AnimatedSprite(animationSprite);
            this.animatedSprites[key] = animation;
        }
    }

    async setCurrentAnimation(newAnimationName
        , animSetUp = (animation) => {
            animation.animationSpeed = 0.3;
            animation.anchor.set(0.4, 0.6);
        }) {
        this.currentAnimation = this.animatedSprites[newAnimationName];
        animSetUp(this.currentAnimation);
        this.currentAnimation.play()
        this.container.removeChildren();
        this.container.addChild(this.currentAnimation);
    }

    async updateFacingDirection() {
        this.container.scale.x = this.velocity.x >= 0 ? 1 : -1
    }

    async normalizeVelocity() {
        if (this.velocity.x == 0 && this.velocity.y == 0) {
          return;
        }
    
        let magnitude = fastDistanceCalc(
          0,
          0,
          this.velocity.x,
          this.velocity.y
        );
    
        if (magnitude == 0) return;
    
        this.velocity.x /= magnitude;
        this.velocity.y /= magnitude;
    
        this.velocity.x *= this.maxVelocity;
        this.velocity.y *= this.maxVelocity;
    }

    async update() {
        this.normalizeVelocity();

        this.container.x += this.velocity.x;
        this.container.y += this.velocity.y;

        this.updateFacingDirection();
    }
}