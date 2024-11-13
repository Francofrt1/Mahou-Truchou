import { GameObject } from "./gameObject.js";

export class Character extends GameObject {
    constructor(game, spritesheetAsset, maxVelocity = 5, x = 500, y = 500) {
        super(game, maxVelocity, x, y);

        this.exp = 0;
        this.life = 100;
        this.baseAttack = 50;
        
        this.loadAnimationsFromSpritesheet(spritesheetAsset, () => {
            this.animation.animationSpeed = 0.3;
            this.animation.anchor.set(0.4, 0.6);
        });
        this.setCurrentAnimation("idle");
    }

    async handleMovementInputs() {
        this.velocity.x = this.game.inputKeys.a ? -1 : this.game.inputKeys.d ? 1 : 0;
        this.velocity.y = this.game.inputKeys.w ? -1 : this.game.inputKeys.s ? 1 : 0;
    }

    async update() {    
        await this.handleMovementInputs();
    
        if (Math.abs(this.velocity.y) > 0 || Math.abs(this.velocity.x) > 0) {
          this.setCurrentAnimation("running");
        } else if (this.currentAnimation == this.animatedSprites["running"]) {
          this.setCurrentAnimation("idle");
        }
    
        super.update();
    }

    attack() {
        this.setCurrentAnimation("attack");
        this.currentAnimation.loop = false;
        this.currentAnimation.gotoAndPlay(0);
        this.currentAnimation.onComplete = () => {
            this.setCurrentAnimation("idle");
        };
    
        // let angle = Math.atan2(
        //   this.game.mouse.x - this.app.stage.x - this.container.x,
        //   this.game.mouse.y - this.app.stage.y - this.container.y
        // );
        // this.juego.balas.push(
        //   new Bala(
        //     this.container.x,
        //     this.container.y - 40,
        //     this.game,
        //     Math.sin(angle),
        //     Math.cos(angle)
        //   )
        // );
    
        this.velocity.x = 0;
        this.velocity.y = 0;
    }

    async updateFacingDirection() {
        this.container.scale.x = this.game.mouse.x - this.game.app.stage.x - this.container.x >= 0 ? 1 : -1
    }
}