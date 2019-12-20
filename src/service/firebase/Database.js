import service from '../firebase';

export default class Database {
  constructor(name) {
    this.entry = service.getDatabase(name);
  }

  add (data) {
    return this.entry.push(data);
  }

  get (key) {
    try {
      return this.entry.child(key);
    } catch (e) {
      return this.add();
    }
  }

  update (key, data) {
    return this.entry.child(key).set(data);
  }

  getTimestamp () {
    return service.getTimestamp();
  }

  destroy () {
    // this.app.delete();
  }
}
