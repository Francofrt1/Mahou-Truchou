import { GameObject } from "./gameObject.js";
import { Projectile } from "./projectile.js";
import { fastDistanceCalc } from "./utility.js";

export class Character extends GameObject {
    constructor(game, spritesheetAsset, maxVelocity = 8, x = 500, y = 500) {
        super(game, maxVelocity, x, y);

        this.exp = 0;
        this.expToLvl = 100;
        this.life = 1000;
        this.shielded = false;
        this.baseAttack = 10;
        this.skills = {"1": "shield", "2": "shockWave", "3": "blackHole", "4": "screenBomb"};
        this.usedSkills = {"1": false, "2": false, "3": false, "4": false};
        this.lockedSkills = {"1": true, "2": true, "3": true, "4": true};
        this.skillsCooldown = {"1": 7, "2": 10, "3": 15, "4": 60}; //seconds
        this.level = 1;
        this.maxLife = 1000;
        this.colorByLevel = {1: "orange", 2: "blue", 3: "green", 4: "yellow", 5: "white"
            , 6: "violet", 7: "dark-yellow", 8: "red", 9: "dark-violet", 10: "dark-violet"
        };

        this.shockWaveRange = 100;
        this.shockWaveForce = 130;
        this.blackHoleRange = 350;
        this.blackHoleActiveTime = 5;

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
        this.checkLevelUp();
        super.update();
    }

    async checkLevelUp() {
        if(this.exp >= this.expToLvl) {
            this.level += this.level < 10 ? 1 : 0;
            this.maxLife += this.level >= 10 ? 0 : 1000;
            this.life = this.maxLife;
            this.expToLvl += this.level * 700;
            this.baseAttack += 20;

            switch (this.level) {
                case 2:
                    this.lockedSkills["1"] = false;
                    this.game.ui.unlockSkill("1");
                    break;
                case 4:
                    this.lockedSkills["2"] = false;
                    this.game.ui.unlockSkill("2");
                    break;
                case 6:
                    this.lockedSkills["3"] = false;
                    this.game.ui.unlockSkill("3");
                    break;
                case 8:
                    this.lockedSkills["4"] = false;
                    this.game.ui.unlockSkill("4");
                    break;
                default:
                    break;
            }
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
            , this.baseAttack
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
        if(this.lockedSkills[key] || this.usedSkills[key]) {
            return;
        }
        const assets = await this.game.getProjectileAnims(this.skills[key]);
        this.usedSkills[key] = true;

        this.game.setCounter(this.skillsCooldown[key], () => { this.usedSkills[key] = false; })

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

        let actualExp = this.exp;
        await this.game.enemySpawner.deleteAllEnemies();
        this.exp = actualExp;
    }

    async shield(assets) {
        this.shielded = true;
        let shield = new GameObject(this.game, 0, 0, 0, null, false);
        await shield.loadAnimationsFromSpritesheet(assets);
        this.container.addChild(shield.container);
        await shield.setCurrentAnimation("shield-" + this.colorByLevel[this.level]);
        this.game.setCounter(5, () => { shield.delete(); this.shielded = false });
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

        this.game.enemySpawner.enemies.forEach(enemy => {

            let distanceToEnemy = fastDistanceCalc(
                enemy.container.x,
                enemy.container.y,
                this.container.x,
                this.container.y
            );

            if(distanceToEnemy < this.shockWaveRange) {
                enemy.getHit(this.baseAttack / 2);
                enemy.container.x += this.container.x < enemy.container.x ? this.shockWaveForce : -this.shockWaveForce
                enemy.container.y += this.container.y < enemy.container.y ? this.shockWaveForce : -this.shockWaveForce
            }
        });
    }

    async blackHole(assets) {
        let startX = this.game.mouse.x - this.game.app.stage.x;
        let startY = this.game.mouse.y - this.game.app.stage.y;

        for (let i = 0; i < this.blackHoleActiveTime; i++) {
            this.game.setCounter(0.1 + i, () => {
                let blackHole = new GameObject(this.game, 0, startX, startY);
                blackHole.loadAnimationsFromSpritesheet(assets, () => {
                    this.animation.animationSpeed = 0.3;
                    this.animation.anchor.set(0.4, 0.6);
                });
                blackHole.setCurrentAnimation("blackHole-" + this.colorByLevel[this.level]);
                blackHole.currentAnimation.setSize(100);
                blackHole.currentAnimation.loop = false;
                blackHole.currentAnimation.gotoAndPlay(0);
                blackHole.currentAnimation.onComplete = () => { blackHole.delete()};
    
                this.game.enemySpawner.enemies.forEach(enemy => {
    
                    let distanceToEnemy = fastDistanceCalc(
                        enemy.container.x,
                        enemy.container.y,
                        blackHole.container.x,
                        blackHole.container.y
                    );
    
                    if(distanceToEnemy < this.blackHoleRange) {
                        enemy.getHit(this.baseAttack / 4);
                        enemy.container.x = blackHole.container.x + distanceToEnemy * 0.2
                        enemy.container.y = blackHole.container.y + distanceToEnemy * 0.2
                    }
                });
            });
        }
    }

    async getHit(damage) {
        if(this.shielded) return;
        this.life -= damage;
        if(this.life <= 0) {
            await this.die();
        }
    }

    async die() {
        await this.setCurrentAnimation("death");
        this.currentAnimation.loop = false;
        this.currentAnimation.gotoAndPlay(0);
        this.currentAnimation.onComplete = () => { 
            this.container.x = 0;
            this.container.y = 0;
            this.delete();
            this.game.playerDied(); 
        };
    }
}