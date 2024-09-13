import {Character} from "./scripts/character.js"
import { Background } from "./scripts/background.js";

export class Game {
    constructor() {
        this.app = new PIXI.Application();
        this.character;
        this.bgContainer = new PIXI.Container();
        this.backgroundsCicle = {}
        this.currentBackground;
        this.inputKeys = {};

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
        this.app.ticker.add(() => {
            this.gameLoop()
        });
    }

    async loadGameElements() {
        await PIXI.Assets.init({manifest: "./assets/manifest.json"});
        this.loadPlayerCharacter();
        await this.loadBackgroundsCicle();
    }

    async gameLoop() {
        this.character.update();
        this.currentBackground.update();
    }

    async addCharacterInputsListeners() {
        window.onkeydown = (e) => {
            this.inputKeys[e.key.toLowerCase()] = true;
        }
        window.onkeyup = (e) => {
            delete this.inputKeys[e.key.toLowerCase()];
        }
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

        this.cicleThroughBgs();
    }

    async cicleThroughBgs() {
        setInterval(
            (e) => {
                const keys = Object.keys(e.backgroundsCicle).map((k) => e.backgroundsCicle[k]);
                let nextIndx = keys.indexOf(e.currentBackground) + 1;
                nextIndx = nextIndx >= keys.length ? 0 : nextIndx;
                const nextBg = keys.at(nextIndx);
                e.setCurrentBackground(nextBg);
            }
        , 40000
        , this
        );
    }

    async loadPlayerCharacter() {
        const playerCharacterAssets = await PIXI.Assets.loadBundle('player-bundle');
        this.character = new Character(this, playerCharacterAssets.character);
    }

    async setCurrentBackground(newBg) {
        this.currentBackground = newBg;
        this.bgContainer.removeChildren();
        this.bgContainer.addChild(this.currentBackground.container);
    }
}

let game = new Game();