export class UserInterface {
    constructor(game) {
        this.game = game;
        this.container = new PIXI.Container();
        this.pointerContainer = new PIXI.Container();

        this.setUp();
    }

    async setUp() {
        await this.loadFontBundles();
        const icons = await this.loadIcons();

        this.game.app.stage.addChild(this.container);

        this.startHUD(icons);
    }

    async loadFontBundles() {
        await PIXI.Assets.loadBundle('bitmap-fonts-bundle');
    }

    async loadIcons() {
        return await PIXI.Assets.loadBundle('ui-icons-bundle');
    }

    async startHUD(icons) {
        await this.startFonts();
        await this.startIcons(icons);
    }

    async startIcons(icons) {
        this.container.addChild(this.pointerContainer);
        const pointer = new PIXI.Sprite(icons.pointer);
        pointer.scale.set(0.5, 0.5);
        pointer.anchor.set(0.5);
        this.pointerContainer.addChild(pointer);
    }

    async startFonts() {
        let bitmapFontText = new PIXI.BitmapText({
            text: '100XP',
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
            text: '100HP',
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

    async update() {
        const mouse = this.game.mouse;
        if(!mouse) return;
        const dx = mouse.x - this.pointerContainer.x;
        const dy = mouse.y - this.pointerContainer.y;
        this.pointerContainer.rotation =  Math.atan2(dy, dx);
        this.pointerContainer.position = this.game.character.container.position;
    }
}