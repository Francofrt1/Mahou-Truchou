export class Background {
    constructor(game, backgroundAsset) {
        this.game = game;
        this.container = new PIXI.Container();
        this.bgParts = [];
        this.bgX = 0;
        this.bgSpeed = 0.1;
        this.load(backgroundAsset)
    }

    async load(backgroundAsset) {

        let backgroundIterable = Object.keys(backgroundAsset).map((k) => backgroundAsset[k]);
        for (let i = 0; i < backgroundIterable.length / 3; i++) {
            let texture = backgroundAsset['background-' + (i + 1)];
            let backgroundTileSprite = new PIXI.TilingSprite({texture, width:this.game.app.screen.width, height:this.game.app.screen.height});
            backgroundTileSprite.position.set(0,0);
            
            
            let scale = Math.max( window.innerWidth / backgroundTileSprite.texture.width, window.innerHeight / backgroundTileSprite.texture.height);
            backgroundTileSprite.scale.set(scale,scale);
            backgroundTileSprite.x = Math.round( ( window.innerWidth - backgroundTileSprite.width ) / 2);
            backgroundTileSprite.y = Math.round( ( window.innerHeight - backgroundTileSprite.height ) / 2);
            this.bgParts.push(backgroundTileSprite);
            this.container.addChild(backgroundTileSprite);
        }
    }

    async update() {
        this.bgX = (this.bgX + this.bgSpeed)
        this.bgParts.forEach((bg, i) => {
            bg.tilePosition.x = this.bgX / i;
        })
    }
}