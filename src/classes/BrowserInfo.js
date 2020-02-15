import DetectRTC from 'detectrtc';
import { fromEvent } from 'rxjs';
import { map, filter } from 'rxjs/operators';

export default class BrowserInfo {
  constructor() {
    this.load = new Promise((resolve) => DetectRTC.load(resolve));
  }

  async exchange (key, master, subjects) {
    await this.load;
    const entry = await getEntry(key);
    console.log('-> browserInfo: entry key', entry.key);

    const info = JSON.stringify(Object.assign(DetectRTC, { isMaster: master }));
    if (!master) {
      send(entry, info);
      console.log('-> browserInfo: send info as slave');
      subjects.get('local').next(JSON.parse(info));
    }
    return receive(entry, info, master, subjects.get('remote'));
  }

  async destroy () {
    this.load = null;
  }
}

async function getEntry (key) {
  return (await import('@/service/firebase')).default.getDatabase('info').get(key);
}

function send (entry, str) {
  entry.push(str);
}

function receive (entry, info, master, subject) {
  subject.next({});
  console.log('-> browserInfo: await info');
  return fromEvent(entry, 'child_added')
    .pipe(
      map(([snapshot]) => [snapshot.val(), snapshot]),
      filter(([result]) => result !== info),
      map(([result, snapshot]) => [JSON.parse(result), snapshot]),
    ).subscribe(([result, snapshot]) => {
      if (master) {
        send(entry, info);
        console.log('-> browserInfo: send info as master');
      }
      snapshot.ref.remove();
      subject.next(result);
      console.log('-> browserInfo: received info', result);
    });
}
