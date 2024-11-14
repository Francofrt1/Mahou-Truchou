import { GameObject } from "./gameObject.js";
import { Projectile } from "./projectile.js";

export class Character extends GameObject {
    constructor(game, spritesheetAsset, maxVelocity = 8, x = 500, y = 500) {
        super(game, maxVelocity, x, y);

        this.exp = 0;
        this.life = 100;
        this.baseAttack = 50;
        this.skills = {"1": "screenBomb"};
        
        this.loadAnimationsFromSpritesheet(spritesheetAsset, () => {
            this.animation.animationSpeed = 0.3;
            this.animation.anchor.set(0.4, 0.6);
        });
        this.setCurrentAnimation("idle");
    }

    async handleMovementInputs() {
        this.velocity.x = this.game.inputKeys.a ? -1 : this.game.inputKeys.d ? 1 : 0;
        this.velocity.y = this.game.inputKeys.w ? -1 : this.game.inputKeys.s ? 1 : 0;

        if (this.container.x < 0) this.velocity.x = -this.container.x;
        if (this.container.y < 0) this.velocity.y = -this.container.y;
        if (this.container.x > this.game.boardWidth)
            this.velocity.x = -(this.container.x - this.game.boardWidth);
        if (this.container.y > this.game.boardHeight)
            this.velocity.y = -(this.container.y - this.game.boardHeight);
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

    async attack() {
        this.setCurrentAnimation("attack");
        this.currentAnimation.loop = false;
        this.currentAnimation.gotoAndPlay(0);
        this.currentAnimation.onComplete = () => {
            this.setCurrentAnimation("idle");
        };
    
        let angle = Math.atan2(
          this.game.mouse.x - this.game.app.stage.x - this.container.x,
          this.game.mouse.y - this.game.app.stage.y - this.container.y
        );

        let projAnims = await this.game.getProjectileAnims("fireball");
        this.game.projectiles.push(
          new Projectile(
            this.container.x,
            this.container.y,
            this.game,
            Math.sin(angle),
            Math.cos(angle),
            projAnims,
            "orange"
          )
        );
    
        this.velocity.x = 0;
        this.velocity.y = 0;
    }

    async updateFacingDirection() {
        if(!this.game.mouse) return;
        this.container.scale.x = this.game.mouse.x - this.game.app.stage.x - this.container.x >= 0 ? 1 : -1
    }

    async activateSkill(key) {
        const assets = await this.game.getProjectileAnims(this.skills[key]);
        switch (this.skills[key]) {
            case "screenBomb":
                this.screenBomb(assets);
                break;
        }
    }

    async screenBomb(assets) {
        let startX = 50;
        let startY = 50;

        for (let j = 0; j < 9; j++) {
            for (let i = 0; i < 28; i++) {
                let bomb = new GameObject(this.game, 0, startX, startY);
                await bomb.loadAnimationsFromSpritesheet(assets, () => {
                    this.animation.animationSpeed = 0.3;
                    this.animation.anchor.set(0.4, 0.6);
                });
                await bomb.setCurrentAnimation("screenBomb");
                bomb.currentAnimation.setSize(150);
                bomb.currentAnimation.loop = false;
                bomb.currentAnimation.gotoAndPlay(0);
                bomb.currentAnimation.onComplete = () => { bomb.delete()};
                startX += 100;
            }
            startY += 100;
            startX = 50;
        }

        this.game.enemySpawner.deleteAllEnemies();
    }
}