import { Subject } from 'rxjs';

export default class DataSubject {
  constructor(type, peer = null) {
    this.type = type;
    this.subject = new Subject();

    if (peer) {
      this.setup(peer);
    }
  }

  setup (peer) {
    this.publish = (data) => {
      peer.send(JSON.stringify({ type: this.type, data }));
    };
  }

  publish () {
    throw 'no peer connection available';
  }

  subscribe (fn) {
    return this.subject.subscribe(fn);
  }

  notify (data) {
    this.subject.next(data);
  }

  destroy () {
    this.subject.observers.forEach((observer) => {
      observer.unsubscribe();
    });
  }
}
