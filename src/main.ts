import Phaser from 'phaser';

// Temporary placeholder scene for P0; replaced by Boot/Garden/UI in step 4.
class HelloScene extends Phaser.Scene {
  constructor() {
    super('Hello');
  }

  create(): void {
    const { width, height } = this.scale;
    this.add
      .text(width / 2, height / 2, 'Under the Orchard', {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#f4ecd8',
      })
      .setOrigin(0.5);
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  width: 480,
  height: 270,
  pixelArt: true,
  backgroundColor: '#5a8f3c',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [HelloScene],
});
