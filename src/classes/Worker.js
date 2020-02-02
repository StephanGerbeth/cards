import { fromEvent } from 'rxjs';
import { take, filter } from 'rxjs/operators';

export default class Worker {
  constructor(Module, num = 1) {
    this.pool = [...new Array(num)].map(() => new Module());
    this.waiting = [...this.pool];
    this.workersReady = onWorkersReady(this.pool);
  }

  ready (fn) {
    return this.workersReady.then(fn);
  }

  isIdle () {
    return this.waiting.length > 0;
  }

  async setup (fn, data, shared) {
    return this.ready(() => {
      return fn(this.process(data, shared));
    });
  }

  async process (data, shared) {
    const entry = this.waiting.shift();
    let result = null;
    try {
      result = await process(entry, data, shared);
    } catch (e) {
      skippedFrame();
    } finally {
      this.waiting.push(entry);
    }
    return result.data;
  }

  destroy () {
    this.pool.forEach((entry) => {
      entry.terminate();
    });
  }
}

function onWorkersReady (workers) {
  return Promise.all(workers.map((instance) => {
    return fromEvent(instance, 'message')
      .pipe(
        filter((e) => e.data.type === 'ready'),
        take(1)
      ).toPromise();
  }));
}

function process (entry, data, shared) {
  return new Promise((resolve) => {
    resolve(fromEvent(entry, 'message')
      .pipe(take(1))
      .toPromise());
    entry.postMessage(data, shared);
  });
}

function skippedFrame () {
  throw {
    name: 'Worker',
    message: 'skipped frame',
    toString: function () {
      return this.name + ': ' + this.message;
    }
  };
}
