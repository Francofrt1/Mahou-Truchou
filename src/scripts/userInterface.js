export class UserInterface {
    constructor(game) {
        this.game = game;
        this.container = new PIXI.Container();

        this.setUp();
    }

    async setUp() {
        await this.loadFontBundles();

        this.game.app.stage.addChild(this.container);

        this.startHUD();
    }

    async loadFontBundles() {
        await PIXI.Assets.loadBundle('bitmap-fonts-bundle');
    }

    async startHUD() {
        let bitmapFontText = new PIXI.BitmapText({
            text: '100%abcABC#$',
            style: {
                fontFamily: 'BoldTwilight',
                fontSize: 55,
                align: 'left'
            }
        });

        bitmapFontText.x = 50;
        bitmapFontText.y = 200;

        this.container.addChild(bitmapFontText);

        bitmapFontText = new PIXI.BitmapText({
            text: '100%abcABC#$',
            style: {
                fontFamily: 'BoldBubblegum',
                fontSize: 55,
                align: 'left'
            }
        });

        bitmapFontText.x = 50;
        bitmapFontText.y = 100;

        this.container.addChild(bitmapFontText);
    }
}