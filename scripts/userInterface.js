import { lerp } from "./utility.js";

export class UserInterface {
    constructor(game) {
        this.game = game;
        this.container = new PIXI.Container();
        this.pointerContainer = new PIXI.Container();
        this.lifeText;
        this.expText;
        this.lvlText;
        this.shieldIcon = new PIXI.Container();
        this.shockWaveIcon = new PIXI.Container();
        this.blackHoleIcon = new PIXI.Container();
        this.screenBombIcon = new PIXI.Container();
        this.skillIconsContainers = { "1": this.shieldIcon, "2": this.shockWaveIcon, "3": this.blackHoleIcon, "4": this.screenBombIcon }
        this.ready = false;
        this.icons;
        this.skillIcons = {};
        this.clock;
        this.setUp();
    }

    async setUp() {
        await this.loadFontBundles();
        this.icons = await this.loadIcons();
        this.skillIcons = { "1": this.icons.shieldIcon, "2": this.icons.shockWaveIcon, "3": this.icons.blackHoleIcon, "4": this.icons.screenBombIcon }

        this.game.app.stage.addChild(this.container);
        this.game.app.stage.addChild(this.pointerContainer);

        await this.startHUD(this.icons);
        this.ready = true;
    }

    async loadFontBundles() {
        await PIXI.Assets.loadBundle('bitmap-fonts-bundle');
    }

    async loadIcons() {
        return await PIXI.Assets.loadBundle('ui-icons-bundle');
    }

    async startHUD() {
        await this.startFonts();
        await this.startIcons();
        await this.startClock();
    }

    async startIcons() {
        const pointer = new PIXI.Sprite(this.icons.pointer);
        pointer.scale.set(0.3, 0.3);
        pointer.anchor.set(0.5);
        this.pointerContainer.addChild(pointer);

        let array = [this.shieldIcon, this.shockWaveIcon, this.blackHoleIcon, this.screenBombIcon];

        array.forEach((e, i) => {
            let lock = new PIXI.Sprite(this.icons.lockIcon);
            lock.scale.set(0.3, 0.3);
            lock.anchor.set(0.5);

            e.addChild(lock);
            e.x = this.game.boardWidth / 2.35 + i * 100;
            e.y = this.game.boardHeight - 50;

            this.container.addChild(e);
        });
    }

    async startFonts() {

        let hp = this.game.character.maxLife;
        this.lifeText = new PIXI.BitmapText({
            text: `${hp}/${hp}HP`,
            style: {
                fontFamily: 'BoldBubblegum',
                fontSize: 55,
                align: 'left'
            }
        });

        this.lifeText.x = 50;
        this.lifeText.y = 100;

        this.container.addChild(this.lifeText);

        let xp = this.game.character.expToLvl;
        this.expText = new PIXI.BitmapText({
            text: `0/${xp}XP`,
            style: {
                fontFamily: 'BoldTwilight',
                fontSize: 55,
                align: 'left'
            }
        });

        this.expText.x = 50;
        this.expText.y = 200;

        this.container.addChild(this.expText);

        let lvl = this.game.character.level;
        this.lvlText = new PIXI.BitmapText({
            text: `Lvl. ${lvl}`,
            style: {
                fontFamily: 'BoldTwilight',
                fontSize: 55,
                align: 'left'
            }
        });

        this.lvlText.x = 50;
        this.lvlText.y = 50;

        this.container.addChild(this.lvlText);
    }

    async winMessage() {
        this.container.removeChildren();
        let bitmapFontText = new PIXI.BitmapText({
            text: 'YOU WIN!',
            style: {
                fontFamily: 'BoldTwilight',
                fontSize: 80,
                align: 'center'
            }
        });

        bitmapFontText.x = window.innerWidth / 2;
        bitmapFontText.y = window.innerHeight / 2;

        this.container.addChild(bitmapFontText);
    }

    async deathMessage() {
        this.container.removeChildren();
        let bitmapFontText = new PIXI.BitmapText({
            text: 'You Failed...',
            style: {
                fontFamily: 'BoldTwilight',
                fontSize: 80,
                align: 'center'
            }
        });

        bitmapFontText.x = window.innerWidth / 2 - 100;
        bitmapFontText.y = window.innerHeight / 2 - 400;

        this.container.addChild(bitmapFontText);
    }

    async update() {
        await this.moveInterface();
        this.updateTexts();

        this.updatePointerRotation();
        this.updateUsedSkills();
    }

    async updateUsedSkills() {
        for(let key in this.game.character.usedSkills) {
            let used = this.game.character.usedSkills[key];
            if(used) {
                this.skillIconsContainers[key].tint = "grey";
            } else {
                this.skillIconsContainers[key].tint = "white";
            }
        }
    }

    async moveInterface() {
        let lerpFactor = 0.05;
        const playerX = this.game.character.container.x;
        const playerY = this.game.character.container.y;
    
        const halfScreenWidth = this.game.app.screen.width / 2;
        const halfScreenHeight = this.game.app.screen.height / 2;
    
        const targetX = halfScreenWidth - playerX;
        const targetY = halfScreenHeight - playerY;
    
        const clampedX = Math.min(
          Math.max(targetX, -(this.game.canvasWidth - this.game.app.screen.width)),
          0
        );
        const clampedY = Math.min(
          Math.max(targetY, -(this.game.canvasHeight - this.game.app.screen.height)),
          0
        );
    
        this.container.position.x = -lerp(
          this.game.app.stage.position.x,
          clampedX,
          lerpFactor
        );
        this.container.position.y = -lerp(
          this.game.app.stage.position.y,
          clampedY,
          lerpFactor
        );
    }

    async updatePointerRotation() {
        const mouse = this.game.mouse;
        if(!mouse) return;
        const dx = mouse.x - this.game.app.stage.x - this.pointerContainer.x;
        const dy = mouse.y - this.game.app.stage.y - this.pointerContainer.y;
        this.pointerContainer.rotation =  Math.atan2(dy, dx);
        this.pointerContainer.position = this.game.character.container.position;
    }

    async updateTexts() {
        if(!this.ready || !this.game.character) return;
        let currentLife = this.game.character.life;
        let maxLife = this.game.character.maxLife;
        this.lifeText.text = `${currentLife}/${maxLife}HP`;

        let xp = this.game.character.exp;
        let xpL = this.game.character.expToLvl;
        this.expText.text = `${xp}/${xpL}XP`;

        let lvl = this.game.character.level;
        this.lvlText.text = `Lvl. ${lvl}`;
    }

    async unlockSkill(skill) {
        let container = this.skillIconsContainers[skill];
        const sprite = new PIXI.Sprite(this.skillIcons[skill]);
        sprite.scale.set(0.3, 0.3);
        sprite.anchor.set(0.5);

        container.removeChildren();
        container.addChild(sprite);
    }

    async makeClockString(time) {
        const minutes = Math.floor(time / 60);
        const seconds = time - minutes * 60;

        const fn = (string, pad, length) => {
            return (new Array(length + 1).join(pad) + string).slice(-length);
        }
          
        const finalTime = fn(minutes, '0', 2) + ':' + fn(seconds, '0', 2);

        return finalTime;
    }

    async startClock() {
        let time = this.game.bossSpawnTime;
        this.clock = new PIXI.BitmapText({
            text: `${await this.makeClockString(time)}`,
            style: {
                fontFamily: 'BoldTwilight',
                fontSize: 55,
                align: 'right'
            }
        });

        this.clock.x = this.game.boardWidth - 250;
        this.clock.y = 50;

        this.container.addChild(this.clock);
    }

    async updateClock() {
        let time = this.game.bossSpawnTime;
        let ellapsedTime = await this.game.secondsSinceGameStarted();
        let remainingTime = time - ellapsedTime;
        if (remainingTime < 0) return;
        this.clock.text = `${await this.makeClockString(remainingTime)}`;
    }
}