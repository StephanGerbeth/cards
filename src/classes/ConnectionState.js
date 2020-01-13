import { Subject } from 'rxjs';

export default class Data {
  constructor(...args) {
    this.subjects = new Map(args.map((name) => {
      return [name, new Subject()];
    }));
  }

  get (name) {
    return this.subjects.get(name);
  }

  destroy () {
    this.subjects.forEach((subject) => {
      subject.observers.forEach((observers) => {
        observers.unsubscribe();
      });
    });
  }
}
