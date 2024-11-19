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
        this.counters = [];
        this.bossSpawnTime = 301;
        this.spawnEnemyInterval = 30;
        this.currentSong;
        this.songs;
        this.attackCounterIndex;

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
        await this.loadBackgroundsCicle();
        await this.loadEffects();
        await this.loadSongs();
        await this.loadPlayerCharacter();
        await this.initEnemies();
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

        this.counters = this.counters.filter(x => !x.executed);
        this.counters.forEach((counter, i) => {
            counter.fn(this.ellapsedFrames, i);
        });

        this.moveCamera();
    }

    async mouseDownEvent() {
        this.character.attack();
        this.attackCounterIndex = await this.setCounter(0.5, () => { this.character.attack(); }, true);
    }

    async mouseUpEvent() {
        this.counters[this.attackCounterIndex].executed = true;
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
            this.mouseUpEvent();
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

        this.setCounter(35, () => { this.cicleThroughBgs() }, true);
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

        this.setCounter(this.spawnEnemyInterval, () => {
            this.enemySpawner.spawnEnemies();
        }, true);

        this.setCounter(this.bossSpawnTime, () => {
            this.enemySpawner.spawnBoss();
            this.playBossSong();
        });

        this.setCounter(1, () => {
            this.ui.updateClock();
        }, true);
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

    async setCounter(seconds, fnToExecute = () => {}, loop = false) {
        let startFrames = this.ellapsedFrames;
        this.counters.push(
            {
                executed: false,
                fn: (ellapsedFrames, index) => {
                        if((ellapsedFrames - startFrames) % (seconds * 60) == 0) 
                        { 
                            fnToExecute();
                            if(!loop) {
                                this.counters[index].executed = true; 
                            }
                        }
                    }
            }
        );

        return this.counters.length - 1;
    }

    async secondsSinceGameStarted() {
        return this.ellapsedFrames / 60;
    }

    async winGame() {
        await this.ui.winMessage();
        this.setCounter(10, () => {
            this.app.ticker.stop();
            document.getElementById("mainScreen").style.display = "flex";
            document.getElementById("replayBtn").style.display = "flex";
        });
    }

    async playerDied() {
        this.ui.deathMessage();
        this.setCounter(10, () => {
            this.app.ticker.stop();
            document.getElementById("mainScreen").style.display = "flex";
            document.getElementById("replayBtn").style.display = "flex";
        });
    }

    async loadSongs() {
        const songAssets = await PIXI.Assets.loadBundle('music-bundle');
        this.songs = Object.keys(songAssets).map((key) => [key, songAssets[key]]).filter(x => x[0].split('_')[0] == "song").map(x => x[1]);

        this.songs[0].play();
        this.currentSong = this.songs[0];
        this.setCounter(35, () => 
            {
                if(this.enemySpawner.bossSpawned) return;
                this.currentSong.stop();
                let i = this.songs.findIndex(x => x == this.currentSong) + 1;
                i = i <= 7 ? i : 0; 
                this.currentSong = this.songs[i];
                this.currentSong.play();
            }, true
        );
    }

    async playBossSong() {
        this.currentSong.stop();
        this.currentSong = this.songs[8];
        this.currentSong.play();
    }
}

let mainGame;
document.getElementById("playBtn").onclick = (e) => {
    e.target.parentElement.style.display = "none";
    e.target.style.display = "none";

    mainGame = new Game();
}

document.getElementById("replayBtn").onclick = (e) => {
    location.reload();
}
