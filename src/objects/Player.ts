import Phaser from 'phaser';
import { TILE } from '../constants';
import { cellInFront, resolveFacing, type Cell, type Facing } from '../logic/facing';

const PLAYER_SPEED = 80; // px/s, ~5 tiles/s
// Placeholder square smaller than a tile so 1-tile gaps are easy to pass.
// Hitbox == whole sprite: a flat square must never visually overlap solids.
export const PLAYER_SIZE = 12;

type Keys = Record<'up' | 'down' | 'left' | 'right' | 'w' | 'a' | 's' | 'd', Phaser.Input.Keyboard.Key>;

export class Player extends Phaser.Physics.Arcade.Sprite {
  private readonly keys: Keys;
  facing: Facing = 'down';

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(PLAYER_SIZE, PLAYER_SIZE);
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
  }

  // Player cell = cell of the body centre.
  frontCell(): Cell {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const col = Math.floor(body.center.x / TILE);
    const row = Math.floor(body.center.y / TILE);
    return cellInFront(col, row, this.facing);
  }
}
