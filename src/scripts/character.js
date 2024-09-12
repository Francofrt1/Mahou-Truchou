export class Character {
    constructor(game, spritesheetAsset) {
        this.container = new PIXI.Container();
        this.game = game;
        this.animation;
        this.spritesheetAsset = spritesheetAsset;
        this.game.app.stage.addChild(this.container);
        this.speed = 5;

        this.idle();
    }

    async idle() {
        this.updateSprite("idle");
    }

    async up(pressingKey) {
        this.container.y -= this.speed;
        if(!pressingKey) {
            this.updateSprite("running");
        }
    }

    async down(pressingKey) {
        this.container.y += this.speed;
        if(!pressingKey) {
            this.updateSprite("running");
        }
    }

    async left(pressingKey) {
        this.container.x -= this.speed;
        if(!pressingKey) {
            this.updateSprite("running", () => {if(this.animation) this.animation.scale.x *= -1;})
        }
    }

    async right(pressingKey) {
        this.container.x += this.speed;
        if(!pressingKey) {
            this.updateSprite("running");
        }
    }

    async attack() {
        this.updateSprite("attack", () => {this.animation.loop = false; this.animation.onComplete = () => {this.updateSprite("idle");}});
        // setTimeout(() => {
        //      //
        //   }, 100);
    }

    async updateSprite(
        name
        , animSetUp = () => {

    }) {
        this.animation = await this.getAnimatedSprite(name);
        this.animation.animationSpeed = 0.3;
        this.animation.anchor.set(0.4, 0.6);
        animSetUp();
        this.animation.play();
        this.container.removeChildren(0);
        this.container.addChild(this.animation);
    }

    async getAnimatedSprite(name) {
        return await new PIXI.AnimatedSprite(this.spritesheetAsset.animations[name])
    }

    async update() {
        
    }
}