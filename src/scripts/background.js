export class Background {
    constructor(game, backgroundAsset) {
        this.game = game;
        this.container = new PIXI.Container();
        this.bgParts = [];
        this.bgX = 0;
        this.bgSpeed = 0.5;
        this.load(backgroundAsset)
    }

    async load(backgroundAsset) {

        let backgroundIterable = Object.keys(backgroundAsset).map((k) => backgroundAsset[k]);
        for (let i = 0; i < backgroundIterable.length / 3; i++) {
            let texture = backgroundAsset['background-' + (i + 1)];
            let backgroundTileSprite = new PIXI.TilingSprite({texture, width:this.game.app.screen.width, height:this.game.app.screen.height});
            backgroundTileSprite.position.set(0,0);
            this.bgParts.push(backgroundTileSprite);
            this.container.addChild(backgroundTileSprite);
        }

        this.game.app.stage.addChild(this.container);
    }

    async update() {
        this.bgX = (this.bgX + this.bgSpeed)
        this.bgParts.forEach((bg, i) => {
            bg.tilePosition.x = this.bgX / i;
        })
    }
}