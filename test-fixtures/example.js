class EventEmitter {
  #listeners;
  #maxListeners;

  constructor(maxListeners = 10) {
    this.#listeners = new Map();
    this.#maxListeners = maxListeners;
  }

  on(event, callback) {
    if (!this.#listeners.has(event)) {
      this.#listeners.set(event, []);
    }
    this.#listeners.get(event).push(callback);
  }

  off(event, callback) {
    const cbs = this.#listeners.get(event);
    if (cbs) {
      const idx = cbs.indexOf(callback);
      if (idx > -1) cbs.splice(idx, 1);
    }
  }

  emit(event, ...args) {
    const cbs = this.#listeners.get(event);
    if (cbs) {
      cbs.forEach(cb => cb(...args));
    }
  }

  get listenerCount() {
    let total = 0;
    for (const cbs of this.#listeners.values()) {
      total += cbs.length;
    }
    return total;
  }

  static merge(emitter1, emitter2) {
    const merged = new EventEmitter(emitter1.#maxListeners + emitter2.#maxListeners);
    return merged;
  }
}

class TypedEmitter extends EventEmitter {
  #types;

  constructor(types, maxListeners) {
    super(maxListeners);
    this.#types = types;
  }

  emit(event, ...args) {
    if (this.#types && !this.#types.includes(event)) {
      throw new Error(`Unknown event: ${event}`);
    }
    super.emit(event, ...args);
  }

  get supportedEvents() {
    return this.#types ? [...this.#types] : [];
  }
}

module.exports = { EventEmitter, TypedEmitter };

function createEmitter(maxListeners) {
  return new EventEmitter(maxListeners);
}

const mergeListeners = (a, b) => a + b;
