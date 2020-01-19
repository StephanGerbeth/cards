import { fromEvent } from 'rxjs';
import { take, filter } from 'rxjs/operators';

export default class Worker {
  constructor(Module, num = 1) {
    this.count = 0;
    this.pool = [...new Array(num)].map(() => new Module());
    this.waiting = [...this.pool];
    this.observable = Promise.all(this.waiting.map((instance) => {
      return fromEvent(instance, 'message')
        .pipe(
          filter((e) => e.data.type === 'ready'),
          take(1)
        ).toPromise();
    }));
  }

  ready (fn) {
    return this.observable.then(fn);
  }

  isIdle () {
    return this.waiting.length > 0;
  }

  async publish (data, shared) {
    const entry = this.waiting.shift();
    return transmit(entry, data, shared)
      .then((result) => {
        this.waiting.push(entry);
        return result;
      }).catch(skippedFrame);
  }

  destroy () {
    this.pool.forEach((entry) => {
      entry.terminate();
    });
  }
}

function transmit (entry, data, shared) {
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
