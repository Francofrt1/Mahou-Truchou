import { GameObject } from "./gameObject.js";
import { Projectile } from "./projectile.js";

export class Character extends GameObject {
    constructor(game, spritesheetAsset, maxVelocity = 8, x = 500, y = 500) {
        super(game, maxVelocity, x, y);

        this.exp = 0;
        this.life = 100;
        this.shielded = false;
        this.baseAttack = 50;
        this.skills = {"1": "shield", "2": "shockWave", "3": "blackHole", "4": "screenBomb"};
        this.usedSkills = {"1": false, "2": false, "3": false, "4": false};
        this.skillsCooldown = {"1": 15, "2": 30, "3": 60, "4": 120}; //seconds
        this.level = 1;
        this.maxLife = 100;
        this.colorByLevel = {1: "orange", 2: "blue", 3: "green", 4: "yellow", 5: "white"
            , 6: "violet", 7: "dark-yellow", 8: "red", 9: "dark-violet", 10: "dark-violet"
        };
        this.initSkillsCooldown();

        this.loadAnimationsFromSpritesheet(spritesheetAsset, () => {
            this.animation.animationSpeed = 0.3;
            this.animation.anchor.set(0.4, 0.6);
        });
        this.setCurrentAnimation("idle");
    }
    
    initSkillsCooldown() {
        for (const [key, value] of Object.entries(this.skillsCooldown)) {
            this.skillsCooldown[key] = value * 60; //convert to frames at 60fps
        }
    }

    async handleMovementInputs() {
        this.velocity.x = this.game.inputKeys.a ? -1 : this.game.inputKeys.d ? 1 : 0;
        this.velocity.y = this.game.inputKeys.w ? -1 : this.game.inputKeys.s ? 1 : 0;

        if (this.container.x < 0) this.velocity.x = -this.container.x;
        if (this.container.y < 0) this.velocity.y = -this.container.y;
        if (this.container.x > this.game.canvasWidth)
            this.velocity.x = -(this.container.x - this.game.canvasWidth);
        if (this.container.y > this.game.canvasHeight)
            this.velocity.y = -(this.container.y - this.game.canvasHeight);
    }

    async update() {    
        await this.handleMovementInputs();
    
        if (Math.abs(this.velocity.y) > 0 || Math.abs(this.velocity.x) > 0) {
          this.setCurrentAnimation("running");
        } else if (this.currentAnimation == this.animatedSprites["running"]) {
          this.setCurrentAnimation("idle");
        }
        this.skillsUpdate();
        this.checkLevelUp();
        super.update();
    }

    async checkLevelUp() {
        if(this.exp >= this.level * 100) {
            this.level += this.level < 10 ? 1 : 0;
            this.maxLife += 100;
            this.life = this.maxLife;
        }
    }

    async skillsUpdate() {
        let ellapsedFrames = this.game.ellapsedFrames;
        if(this.shielded && ellapsedFrames % 200 == 0) {
            this.shielded = false;
        }

        for (const [key, value] of Object.entries(this.usedSkills)) {
            this.usedSkills[key] = ellapsedFrames % this.skillsCooldown[key] == 0;
        }
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
            this.colorByLevel[this.level]
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
        if(this.usedSkills[key]) {
            return;
        }
        const assets = await this.game.getProjectileAnims(this.skills[key]);
        this.usedSkills[key] = true;
        switch (this.skills[key]) {
            case "screenBomb":
                this.screenBomb(assets);
                break;
            case "shield":
                this.shield(assets);
                break;
            case "shockWave":
                this.shockWave(assets);
                break;
            case "blackHole":
                this.blackHole(assets);
                break;
        }
    }

    async screenBomb(assets) {
        let startX = 50;
        let startY = 50;

        for (let j = 0; j < 13; j++) {
            for (let i = 0; i < 55; i++) {
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

    async shield(assets) {
        this.shielded = true;
        let shield = new GameObject(this.game, 0, this.container.x, this.container.y);
        await shield.loadAnimationsFromSpritesheet(assets, () => {
            this.animation.animationSpeed = 0.3;
            this.animation.anchor.set(0.4, 0.6);
        });
        await shield.setCurrentAnimation("shield-" + this.colorByLevel[this.level]);
        shield.currentAnimation.setSize(100);
        shield.currentAnimation.loop = false;
        shield.currentAnimation.gotoAndPlay(0);
        shield.currentAnimation.onComplete = () => { shield.delete()};
    }

    async shockWave(assets) {
        let shockWave = new GameObject(this.game, 0, this.container.x, this.container.y);
        await shockWave.loadAnimationsFromSpritesheet(assets, () => {
            this.animation.animationSpeed = 0.3;
            this.animation.anchor.set(0.4, 0.6);
        });
        await shockWave.setCurrentAnimation("shockWave-" + this.colorByLevel[this.level]);
        shockWave.currentAnimation.setSize(100);
        shockWave.currentAnimation.loop = false;
        shockWave.currentAnimation.gotoAndPlay(0);
        shockWave.currentAnimation.onComplete = () => { shockWave.delete()};
    }

    async blackHole(assets) {
        let blackHole = new GameObject(this.game, 0, this.container.x, this.container.y);
        await blackHole.loadAnimationsFromSpritesheet(assets, () => {
            this.animation.animationSpeed = 0.3;
            this.animation.anchor.set(0.4, 0.6);
        });
        await blackHole.setCurrentAnimation("blackHole-" + this.colorByLevel[this.level]);
        blackHole.currentAnimation.setSize(100);
        blackHole.currentAnimation.loop = false;
        blackHole.currentAnimation.gotoAndPlay(0);
        blackHole.currentAnimation.onComplete = () => { blackHole.delete()};
    }

    async getHit(damage) {
        if(this.shielded) return;
        this.life -= damage;
    }
}