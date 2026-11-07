// Tiny typed event emitter (no deps), the analogue of Godot signals.
// Events map: event name -> payload type (use `void` for no payload).
export type Listener<T> = (payload: T) => void;

export class Emitter<E extends { [K in keyof E]: unknown }> {
  private listeners: { [K in keyof E]?: Set<Listener<E[K]>> } = {};

  on<K extends keyof E>(event: K, fn: Listener<E[K]>): void {
    (this.listeners[event] ??= new Set()).add(fn);
  }

  off<K extends keyof E>(event: K, fn: Listener<E[K]>): void {
    this.listeners[event]?.delete(fn);
  }

  emit<K extends keyof E>(
    event: K,
    ...args: E[K] extends void ? [] : [E[K]]
  ): void {
    const set = this.listeners[event];
    if (!set) return;
    // Copy so listeners may unsubscribe while handling.
    for (const fn of [...set]) fn(args[0] as E[K]);
  }
}
