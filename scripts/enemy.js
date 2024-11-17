import { GameObject } from "./gameObject.js";
import { fastDistanceCalc, squaredDistance, normalizeVector } from "./utility.js";

export class Enemy extends GameObject {
    constructor(game, spritesheetAsset, maxVelocity = 4, x = 800, y = 500, life = 10, expGiven = 5, damage = 5, animSize = null, vision = null) {
        super(game, maxVelocity, x, y, animSize);
        this.neighbors = [];

        this.expGiven = expGiven;
        this.damage = damage;

        this.vision = vision != null ? vision : 100 + Math.floor(Math.random() * 150);
        this.life = life;
        this.hitted = false;
        this.dead = false;
        this.shooting = false;

        this.loadAnimationsFromSpritesheet(spritesheetAsset, () => {
            this.animation.animationSpeed = 0.3;
            this.animation.anchor.set(0.4, 0.6);
        });
        this.setCurrentAnimation("idle");

        this.states = { IDLE: 0, CHASING: 1, ATTACKING: 2, GETTING_HIT: 3, DYING: 4, RANGE_ATTACKING: 5 };
        this.state = this.states.IDLE;
    }

    async lookAround() {
        this.neighbors = await this.obtainNeighbors();
        this.neighborCells = await this.currentCell?.getNeighborsCells();
        this.seeingPlayer = await this.evaluateSeeingPlayer();
        this.neighborToPlayer = false;
        this.touchingPlayer = false;
    
        if (this.seeingPlayer) {
            this.neighborToPlayer = this.neighbors.includes(this.game.character);
        }
    
        if (this.neighborToPlayer) {
            this.distanceToPlayer = fastDistanceCalc(
                this.container.x,
                this.container.y,
                this.game.character.container.x,
                this.game.character.container.y
            );
            if (this.distanceToPlayer < this.game.grid.cellSize) {
                this.touchingPlayer = true;
            }
        } else {
            this.distanceToPlayer = null;
        }
    }
    
    async doActionsByState() {
        let vecPlaterAttraction,
        vecSeparation,
        vecAlignment,
        vecCohesion,
        borders;
        let vectorsSum = new PIXI.Point(0, 0);
        
        borders = await this.adjustForBorders();
        
        if (this.state == this.states.CHASING) {
            vecPlaterAttraction = await this.playerAttraction();
            this.setCurrentAnimation("running");
        } else if (this.state == this.states.IDLE) {
            vecAlignment = await this.alignment(this.neighbors);
            vecCohesion = await this.cohesion(this.neighbors);
            
            this.setCurrentAnimation("idle");
        }
        
        if (this.state == this.states.IDLE || this.state == this.states.CHASING || this.state == this.states.RANGE_ATTACKING) {
            vecSeparation = await this.separation(this.neighbors);
            
            vectorsSum.x += (vecSeparation || {}).x || 0;
            vectorsSum.x += (vecAlignment || {}).x || 0;
            vectorsSum.x += (vecCohesion || {}).x || 0;
            vectorsSum.x += (vecPlaterAttraction || {}).x || 0;
            vectorsSum.x += (borders || {}).x || 0;
            
            vectorsSum.y += (vecSeparation || {}).y || 0;
            vectorsSum.y += (vecAlignment || {}).y || 0;
            vectorsSum.y += (vecCohesion || {}).y || 0;
            vectorsSum.y += (vecPlaterAttraction || {}).y || 0;
            vectorsSum.y += (borders || {}).y || 0;
                       
            this.applyForce(vectorsSum);
        }
    
        if (this.state == this.states.ATTACKING) {
          this.velocity.x = 0;
          this.velocity.y = 0;
          this.attack();
        }

        if (this.state == this.states.RANGE_ATTACKING) {
            if (this.currentAnimation == this.animatedSprites["rangeAttack"]) return;
            this.playRangeAttackAnim();
        }

        if(this.state == this.states.GETTING_HIT) {
            if (this.currentAnimation == this.animatedSprites["hit"]) return;
            await this.playHitAnimation();
        }

        if(this.state == this.states.DYING) {
            if (this.currentAnimation == this.animatedSprites["death"]) return;
            await this.playDeathAnimation();
        }
    }
    
    async update() {
        this.changeStateOnData();
        this.doActionsByState();
    
        await super.update();
        this.lookAround();
    }

    async changeStateOnData() {
        if(this.dead) {
            this.state = this.states.DYING;
        } else if(this.hitted) {
            this.state = this.states.GETTING_HIT;
        }else if(this.touchingPlayer) {
            this.state = this.states.ATTACKING;
        } else if(this.shooting) {
            this.state = this.states.RANGE_ATTACKING;
        } else if(this.seeingPlayer) {
            this.state = this.states.CHASING;
        } else {
            this.state = this.states.IDLE;
        }
    }
    
    async attack() {
        if (this.currentAnimation == this.animatedSprites["attack"]) return;
        this.setCurrentAnimation("attack");
        this.game.character.getHit(this.damage);
    }
    
    async evaluateSeeingPlayer() {
        const sqrDistance = squaredDistance(
          this.container.x,
          this.container.y,
          this.game.character.container.x,
          this.game.character.container.y
        );
    
        if (sqrDistance < this.vision ** 2) {
          return true;
        }
        return false;
    }
    
    async playerAttraction() {
        const vecDistance = new PIXI.Point(
          this.game.character.container.x - this.container.x,
          this.game.character.container.y - this.container.y
        );
    
        let vecNormalized = normalizeVector(vecDistance.x, vecDistance.y);
    
        vecDistance.x = vecNormalized.x;
        vecDistance.y = vecNormalized.y;
        return vecDistance;
    }
    
    async cohesion(neighbors) {
        const vecAverage = new PIXI.Point(0, 0);
        let total = 0;
    
        neighbors.forEach((enemy) => {
            vecAverage.x += enemy.container.x;
            vecAverage.y += enemy.container.y;
            total++;
        });
    
        if (total > 0) {
            vecAverage.x /= total;
            vecAverage.y /= total;
    
            vecAverage.x = vecAverage.x - this.container.x;
            vecAverage.y = vecAverage.y - this.container.y;
    
            vecAverage.x *= 0.02;
            vecAverage.y *= 0.02;
        }
    
        return vecAverage;
    }
    
    async separation(neighbors) {
        const vecForce = new PIXI.Point(0, 0);
    
        neighbors.forEach((enemy) => {
            const distance = squaredDistance(
              this.container.x,
              this.container.y,
              enemy.container.x,
              enemy.container.y
            );
          
            const dif = new PIXI.Point(
              this.container.x - enemy.container.x,
              this.container.y - enemy.container.y
            );
            dif.x /= distance;
            dif.y /= distance;
            vecForce.x += dif.x;
            vecForce.y += dif.y;
        });
    
        vecForce.x *= 2;
        vecForce.y *= 2;
        return vecForce;
    }
    
    async alignment(neighbors) {
        const vecAverage = new PIXI.Point(0, 0);
        let total = 0;
    
        neighbors.forEach((enemy) => {
            vecAverage.x += enemy.velocity.x;
            vecAverage.y += enemy.velocity.y;
            total++;
        });
    
        if (total > 0) {
            vecAverage.x /= total;
            vecAverage.y /= total;
    
            vecAverage.x *= 0.2;
            vecAverage.y *= 0.2;
        }
    
        return vecAverage;
    }
      
    async adjustForBorders() {
        let force = new PIXI.Point(0, 0);
    
        if (this.container.x < 0) force.x = -this.container.x;
        if (this.container.y < 0) force.y = -this.container.y;
        if (this.container.x > this.game.canvasWidth)
            force.x = -(this.container.x - this.game.canvasWidth);
        if (this.container.y > this.game.canvasHeight)
            force.y = -(this.container.y - this.game.canvasHeight);
    
        return force;
    }

    async getHit(damage) {
        this.life -= damage;
        if (this.life <= 0) {
            if(this.state == this.states.DYING) return;
            this.delete();
        } else {
            this.hitted = true;
            this.velocity.x = 0;
            this.velocity.y = 0;
        }
    }

    async playHitAnimation() {
        let animFn = (animation) => {
            animation.animationSpeed = 0.3;
            animation.anchor.set(0.4, 0.6);
            if(this.animSize != null) {
                animation.setSize(this.animSize);
            }
        }
        await this.setCurrentAnimation("hit", animFn);
        this.currentAnimation.loop = false;
        this.currentAnimation.gotoAndPlay(0);
        this.currentAnimation.onComplete = () => { this.hitted = false };
    }

    async delete() {
        if(this.dead) return;
        this.dead = true;
        this.game.character.exp += this.expGiven;
    }

    async playDeathAnimation() {
        let animFn = (animation) => {
            animation.animationSpeed = 0.3;
            animation.anchor.set(0.4, 0.6);
            if(this.animSize != null) {
                animation.setSize(this.animSize);
            }
        }
        await this.setCurrentAnimation("death", animFn);
        this.currentAnimation.loop = false;
        this.currentAnimation.gotoAndPlay(0);
        this.currentAnimation.onComplete = () => { this.game.enemySpawner.enemies = this.game.enemySpawner.enemies.filter((k) => k != this); super.delete(); };
    }

    async rangeAttack() {

    }

    async playRangeAttackAnim() {
        let animFn = (animation) => {
            animation.animationSpeed = 0.3;
            animation.anchor.set(0.4, 0.6);
            if(this.animSize != null) {
                animation.setSize(this.animSize);
            }
        }
        await this.setCurrentAnimation("rangeAttack", animFn);
        this.currentAnimation.loop = false;
        this.currentAnimation.gotoAndPlay(0);
        this.currentAnimation.onComplete = () => { this.shooting = false };
    }
}