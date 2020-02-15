export default class Database {
  constructor(entry) {
    this.entry = entry;
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

  destroy () {
    // this.app.delete();
  }
}
