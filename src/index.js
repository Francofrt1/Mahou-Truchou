import { Character } from "./scripts/character.js"
import { Background } from "./scripts/background.js";
import { UserInterface } from "./scripts/userInterface.js";
import { Grid } from "./scripts/grid.js";
import { EnemySpawner } from "./scripts/enemySpawner.js";

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
        this.grid = new Grid(50, this); // Cellsize 50
        this.boardWidth = window.innerWidth * 0.99
        this.boardHeight = window.innerWidth * 0.99
        this.enemySpawner;

        this.app.init({ 
            width: window.innerWidth * 0.99
            , height: window.innerHeight * 0.98
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
        await PIXI.Assets.init({manifest: "./assets/manifest.json"});
        this.loadPlayerCharacter();
        await this.loadBackgroundsCicle();
        await this.initEnemies();
    }

    async gameLoop(deltaTime) {
        this.ellapsedFrames += 1;
        this.character.update();
        this.currentBackground.update();
        this.ui.update();

        if(this.ellapsedFrames % 4000 == 0) {
            this.cicleThroughBgs();
        }
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
            this.inputKeys[e.key.toLowerCase()] = true;
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
        this.character = new Character(this, playerCharacterAssets.character);
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
}

let game = new Game();