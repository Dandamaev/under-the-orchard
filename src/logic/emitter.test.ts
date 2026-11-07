import { describe, expect, it, vi } from 'vitest';
import { Emitter } from './emitter';

type Ev = { dayChanged: number; ping: void };

describe('Emitter', () => {
  it('calls a subscribed listener with event data', () => {
    const e = new Emitter<Ev>();
    const fn = vi.fn();
    e.on('dayChanged', fn);
    e.emit('dayChanged', 3);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(3);
  });

  it('stops calling a listener after off', () => {
    const e = new Emitter<Ev>();
    const fn = vi.fn();
    e.on('dayChanged', fn);
    e.off('dayChanged', fn);
    e.emit('dayChanged', 2);
    expect(fn).not.toHaveBeenCalled();
  });

  it('calls multiple listeners', () => {
    const e = new Emitter<Ev>();
    const a = vi.fn();
    const b = vi.fn();
    e.on('ping', a);
    e.on('ping', b);
    e.emit('ping');
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
  });

  it('does not mix up different events', () => {
    const e = new Emitter<Ev>();
    const fn = vi.fn();
    e.on('ping', fn);
    e.emit('dayChanged', 1);
    expect(fn).not.toHaveBeenCalled();
  });

  it('allows unsubscribing inside a handler', () => {
    const e = new Emitter<Ev>();
    const other = vi.fn();
    const self = (): void => e.off('ping', self);
    e.on('ping', self);
    e.on('ping', other);
    e.emit('ping');
    e.emit('ping');
    expect(other).toHaveBeenCalledTimes(2);
  });
});
