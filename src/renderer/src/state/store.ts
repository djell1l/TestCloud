type Listener<T> = (value: T) => void

export class Store<T> {
  private value: T
  private listeners = new Set<Listener<T>>()

  constructor(initial: T) {
    this.value = initial
  }

  get(): T {
    return this.value
  }

  set(next: T): void {
    this.value = next
    this.listeners.forEach((l) => l(this.value))
  }

  update(fn: (current: T) => T): void {
    this.set(fn(this.value))
  }

  subscribe(listener: Listener<T>): () => void {
    this.listeners.add(listener)
    listener(this.value)
    return () => this.listeners.delete(listener)
  }
}
