import Phaser from 'phaser';
import { TILE } from '../constants';
import { cellInFront, resolveFacing, type Cell, type Facing } from '../logic/facing';
import { FRAME_H, FRAME_W, idleKey, walkKey } from './playerAnims';

const PLAYER_SPEED = 80; // px/s, ~5 tiles/s
// Small hitbox at the feet: 1-tile gaps are easy to pass, and the head may overlap
// solids visually (top-down perspective).
const BODY_W = 10;
const BODY_H = 6;
// Body centre sits this far below the sprite centre.
const BODY_CENTER_DY = FRAME_H - BODY_H / 2 - FRAME_H / 2;

type Keys = Record<'up' | 'down' | 'left' | 'right' | 'w' | 'a' | 's' | 'd', Phaser.Input.Keyboard.Key>;

export class Player extends Phaser.Physics.Arcade.Sprite {
  private readonly keys: Keys;
  private readonly textureKey: string;
  facing: Facing = 'down';

  // (feetX, feetY) is where the body centre starts; texture is a character sheet key.
  constructor(scene: Phaser.Scene, feetX: number, feetY: number, texture: string) {
    super(scene, feetX, feetY - BODY_CENTER_DY, texture, 0);
    this.textureKey = texture;
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(BODY_W, BODY_H);
    body.setOffset((FRAME_W - BODY_W) / 2, FRAME_H - BODY_H);
    this.setCollideWorldBounds(true);

    const keyboard = scene.input.keyboard;
    if (!keyboard) throw new Error('Keyboard plugin is unavailable');
    this.keys = keyboard.addKeys('up,down,left,right,w,a,s,d') as Keys;
  }

  update(): void {
    const k = this.keys;
    // Opposite keys cancel out.
    const dx = Number(k.right.isDown || k.d.isDown) - Number(k.left.isDown || k.a.isDown);
    const dy = Number(k.down.isDown || k.s.isDown) - Number(k.up.isDown || k.w.isDown);

    // Normalize so diagonals are not faster; zero input stops instantly.
    const v = new Phaser.Math.Vector2(dx, dy);
    if (v.lengthSq() > 0) v.normalize().scale(PLAYER_SPEED);
    this.setVelocity(v.x, v.y);

    this.facing = resolveFacing(this.facing, dx, dy);
    const moving = dx !== 0 || dy !== 0;
    this.anims.play(moving ? walkKey(this.textureKey, this.facing) : idleKey(this.textureKey, this.facing), true);

    // Depth sorting by the feet line.
    this.setDepth((this.body as Phaser.Physics.Arcade.Body).bottom);
  }

  // Player cell = cell of the body centre (the feet).
  frontCell(): Cell {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const col = Math.floor(body.center.x / TILE);
    const row = Math.floor(body.center.y / TILE);
    return cellInFront(col, row, this.facing);
  }
}
