import {Character} from "./scripts/character.js"

export class Game {
    constructor() {
        this.app = new PIXI.Application();
        this.character;
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
        this.app.ticker.add(() => {
            this.gameLoop()
        });
        await this.loadGameElements();
        this.addCharacterInputsListeners();
    }

    async loadGameElements() {
        
        await PIXI.Assets.init({manifest: "./assets/manifest.json"});
        const playerCharacterAssets = await PIXI.Assets.loadBundle('player-bundle');

        this.character = new Character(this, playerCharacterAssets.character);
    }

    async gameLoop() {

    }

    addCharacterInputsListeners() {
        window.onkeydown = (e) => {
            if(this.character) {
                switch (e.key) {
                    case "w":
                        this.character.up(e.repeat);
                        break;
                    case "a":
                        this.character.left(e.repeat);
                        break;
                    case "d":
                        this.character.right(e.repeat);
                        break;
                    case "s":
                        this.character.down(e.repeat);
                        break;
                    case "e":
                        if(e.repeat) return;
                        this.character.attack();
                    default:
                        break;
                }
            }
        }
    }
}

let game = new Game();