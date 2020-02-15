import { fromEvent } from 'rxjs';
import { map } from 'rxjs/operators';
import Channel from '@/classes/Channel';

export default class DataHandler {
  constructor() {
    this.subjects = new Map();
    this.subscription = null;
    this.peer = null;
  }

  setup (peer) {
    this.peer = peer;
    this.subscription = fromEvent(peer, 'data')
      .pipe(map(([json]) => JSON.parse(json)))
      .subscribe(handleEvent.bind(this));

    this.subjects.forEach((subject) => subject.setup(this.peer));
  }

  get (type) {
    if (!this.subjects.has(type)) {
      this.subjects.set(type, new Channel(type, this.peer));
    }
    return this.subjects.get(type);
  }

  destroy () {
    this.subscription.unsubscribe();
    this.subjects.forEach((subject) => {
      subject.destroy();
    });
  }
}

function handleEvent (e) {
  if (this.subjects.has(e.type)) {
    this.subjects.get(e.type).notify(e.data);
  }
}
