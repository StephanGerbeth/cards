import FastRTCPeer from '@mattkrick/fast-rtc-peer';
import { fromEvent } from 'rxjs';
import { take } from 'rxjs/operators';

const DESCRIPTION = [
  'answer', 'offer'
];

export default class WebRTC {
  constructor(key) {
    console.log('--- NEW WEBRTC CLIENT ---');
    this.key = key;
    this.database = loadDatabase();
    this.peer = null;
    this.entry = null;
    this.subscriptions = [];
  }

  async prepare () {
    const database = await this.database;
    this.entry = await getDbEntry(database, this.key);
    return `${global.location.origin}/?key=${this.entry.key}`;
  }

  async connect () {
    this.peer = new FastRTCPeer({
      isOfferer: !!this.key
    });
    this.subscriptions = this.subscriptions.concat([
      // prevents reconnecting to unique session for slave by page reload
      // fromEvent(global, 'beforeunload')
      //   .subscribe(() => this.disconnect()),
      fromEvent(this.peer, 'signal')
        .subscribe((info) => this.entry.push(prepareSignal(...info))),
      fromEvent(this.entry.orderByChild('description').equalTo(DESCRIPTION[Number(!this.peer.isOfferer)]), 'child_added')
        .subscribe((snapshot) => processSignal(this.peer, ...snapshot))
    ]);

    return this.listenTo(this.peer, 'open');
  }

  async onDisconnect () {
    return new Promise((resolve) => {
      this.subscriptions = this.subscriptions.concat([
        fromEvent(this.peer, 'close').subscribe(() => {
          resolve();
        }),
        fromEvent(this.peer, 'error').subscribe(() => {
          resolve();
        }),
        fromEvent(this.peer, 'connection').subscribe(() => {
          resolve();
        })
      ]);
    });
  }

  disconnect () {
    if (this.peer) {
      this.peer.close();
    }
  }

  async destroy () {
    console.log('-> webrtc: destroy');
    this.peer.close();
    this.peer = null;
    this.subscriptions.reduce((result, subscription) => {
      subscription.unsubscribe();
      return result;
    }, []);
    this.entry.remove();
    this.entry = null;
    const database = await this.database;
    database.destroy();
    this.database = null;

  }

  listenTo (obj, type) {
    return fromEvent(obj, type)
      .pipe(take(1))
      .toPromise();
  }

  getDataObserver () {
    return fromEvent(this.peer, 'data');
  }
}

function prepareSignal (signal, peer) {
  signal = JSON.parse(JSON.stringify(signal));
  signal.description = DESCRIPTION[Number(peer.isOfferer)];
  return signal;
}

function processSignal (peer, snapshot) {
  snapshot.getRef().remove();
  peer.dispatch(snapshot.val());
}

async function getDbEntry (database, key) {
  database = await database;
  try {
    return database.get(key);
  } catch (e) {
    return database.add();
  }
}

async function loadDatabase () {
  const { default: Database } = await import('@/service/firebase/database');
  return new Database('handshake');
}
