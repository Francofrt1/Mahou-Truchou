import { Character } from "./scripts/character.js"
import { Background } from "./scripts/background.js";
import { UserInterface } from "./scripts/userInterface.js";
import { Grid } from "./scripts/grid.js";
import { EnemySpawner } from "./scripts/enemySpawner.js";
import { lerp } from "./scripts/utility.js";

export class Game {
    constructor() {
        this.app = new PIXI.Application();
        this.ui;
        this.character;
        this.bgContainer = new PIXI.Container();
        this.backgroundsCicle = {}
        this.currentBackground;
        this.inputKeys = {};
        this.ellapsedFrames = 0;
        this.boardWidth = window.innerWidth;
        this.boardHeight = window.innerHeight * 0.99
        this.enemySpawner;
        this.canvasWidth = window.innerWidth * 2;
        this.canvasHeight = window.innerHeight * 1.1;
        this.grid = new Grid(50, this);
        this.projectiles = [];
        this.effectAssets = {};
        this.app.init({ 
            width: this.canvasWidth
            , height: this.canvasHeight
            , resizeTo: window,
        })
        .then(() => {
            this.setUp();
        });
    }

    async setUp() {
        document.body.appendChild(this.app.canvas);
        window.__PIXI_APP__ = this.app;

        await this.loadGameElements();
        this.addCharacterInputsListeners();
        this.loadUIElements();
        this.app.ticker.add((deltaTime) => {
            this.gameLoop(deltaTime)
        });
    }

    async loadGameElements() {
        await PIXI.Assets.init({manifest: "assets/manifest.json"});
        this.loadPlayerCharacter();
        await this.loadBackgroundsCicle();
        await this.initEnemies();
        await this.loadEffects();
    }

    async gameLoop(deltaTime) {
        this.ellapsedFrames += 1;
        this.character.update();
        this.currentBackground.update();
        this.ui.update();
        this.enemySpawner.update();
        this.projectiles.forEach((projectile) => {
            projectile.update();
        });

        if(this.ellapsedFrames % 4000 == 0) {
            this.cicleThroughBgs();
        }

        this.moveCamera();
    }

    async mouseDownEvent() {
        this.character.attack();
    }

    async onMouseMove(event) {
        this.mouse = { x: 0, y: 0 };
        const rect = this.app.view.getBoundingClientRect();
        this.mouse.x = event.clientX - rect.left;
        this.mouse.y = event.clientY - rect.top;
    }

    async addCharacterInputsListeners() {
        window.onkeydown = (e) => {
            let key = e.key.toLowerCase();
            if (["a","w","s","d"].includes(key)) {
                this.inputKeys[key] = true;
            } else if (["1","2","3","4"].includes(key)) {
                this.character.activateSkill(key);
            }
        }
        window.onkeyup = (e) => {
            delete this.inputKeys[e.key.toLowerCase()];
        }

        this.app.view.addEventListener("mousedown", () => {
            (this.mouse || {}).click = true;
            this.mouseDownEvent();
        });
        this.app.view.addEventListener("mouseup", () => {
            (this.mouse || {}).click = false;
        });

        this.app.view.addEventListener("mousemove", this.onMouseMove.bind(this));
    }

    async loadUIElements() {
        this.ui = new UserInterface(this);
    }

    async loadBackgroundsCicle() {
        const dayBackgroundAssets = await PIXI.Assets.loadBundle('day-background-bundle');
        let dayBg = new Background(this, dayBackgroundAssets);
        this.backgroundsCicle["day"] = dayBg;
        await this.setCurrentBackground(dayBg);
        this.app.stage.addChild(this.bgContainer);
        
        this.backgroundsCicle["day-2"] = new Background(this, await PIXI.Assets.loadBundle('day-background-2-bundle'));
        this.backgroundsCicle["evening"] = new Background(this, await PIXI.Assets.loadBundle('evening-background-bundle'));
        this.backgroundsCicle["evening-2"] = new Background(this, await PIXI.Assets.loadBundle('evening-background-2-bundle'));
        this.backgroundsCicle["night"] = new Background(this, await PIXI.Assets.loadBundle('night-background-bundle'));
        this.backgroundsCicle["night-2"] = new Background(this, await PIXI.Assets.loadBundle('night-background-2-bundle'));
        this.backgroundsCicle["morning"] = new Background(this, await PIXI.Assets.loadBundle('morning-background-bundle'));
        this.backgroundsCicle["morning-2"] = new Background(this, await PIXI.Assets.loadBundle('morning-background-2-bundle'));
    }

    async cicleThroughBgs() {
        const keys = Object.keys(this.backgroundsCicle).map((k) => this.backgroundsCicle[k]);
        let nextIndx = keys.indexOf(this.currentBackground) + 1;
        nextIndx = nextIndx >= keys.length ? 0 : nextIndx;
        const nextBg = keys.at(nextIndx);
        this.setCurrentBackground(nextBg);
    }

    async loadPlayerCharacter() {
        const playerCharacterAssets = await PIXI.Assets.loadBundle('player-bundle');
        this.character = new Character(this, playerCharacterAssets.character, 8, window.innerWidth / 2, window.innerHeight / 2);
    }

    async setCurrentBackground(newBg) {
        this.currentBackground = newBg ?? this.backgroundsCicle["day"];
        this.bgContainer.removeChildren();
        this.bgContainer.addChild(this.currentBackground.container);
    }

    async initEnemies() {
        this.enemySpawner = new EnemySpawner(this);
        await this.enemySpawner.loadEnemiesAssets();
        this.enemySpawner.spawnEnemies();
    }

    async loadEffects() {
        const assets = await PIXI.Assets.loadBundle('effects-bundle');
        this.effectAssets["fireball"] = [assets.fireball, assets.explosion];
        this.effectAssets["screenBomb"] = assets.screenBomb;
        this.effectAssets["shield"] = assets.shield;
        this.effectAssets["shockWave"] = assets.shockWave;
        this.effectAssets["blackHole"] = assets.blackHole;
    }

    async getProjectileAnims(type) {
        return this.effectAssets[type];
    }

    async moveCamera() {
        let lerpFactor = 0.05;
        const playerX = this.character.container.x;
        const playerY = this.character.container.y;
    
        const halfScreenWidth = this.app.screen.width / 2;
        const halfScreenHeight = this.app.screen.height / 2;
    
        const targetX = halfScreenWidth - playerX;
        const targetY = halfScreenHeight - playerY;
    
        const clampedX = Math.min(
          Math.max(targetX, -(this.canvasWidth - this.app.screen.width)),
          0
        );
        const clampedY = Math.min(
          Math.max(targetY, -(this.canvasHeight - this.app.screen.height)),
          0
        );
    
        this.app.stage.position.x = lerp(
          this.app.stage.position.x,
          clampedX,
          lerpFactor
        );
        this.app.stage.position.y = lerp(
          this.app.stage.position.y,
          clampedY,
          lerpFactor
        );
    }
}

let mainGame;
document.getElementById("playBtn").onclick = (e) => {
    e.target.parentElement.style.display = "none";

    mainGame = new Game();
}
