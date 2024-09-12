import {Character} from "./scripts/character.js"

export class Game {
    constructor() {
        this.app = new PIXI.Application();
        this.character;
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
        const playerCharacterAssets = await PIXI.Assets.loadBundle('player-bundle');

        this.character = new Character(this, playerCharacterAssets.character);
    }

    async gameLoop() {
        this.character.update();
    }

    async addCharacterInputsListeners() {
        window.onkeydown = (e) => {
            this.inputKeys[e.key.toLowerCase()] = true;
        }
        window.onkeyup = (e) => {
            delete this.inputKeys[e.key.toLowerCase()];
        }
    }
}

let game = new Game();