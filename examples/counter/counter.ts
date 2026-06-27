/** A mutable integer counter. */
export class Counter {
  private value = 0;

  /** Add one and return the new total. */
  increment(): number {
    return ++this.value;
  }
}

/** Create a fresh counter starting at zero. */
export function createCounter(): Counter {
  return new Counter();
}
