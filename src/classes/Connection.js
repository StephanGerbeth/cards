import FastRTCPeer from '@mattkrick/fast-rtc-peer';
import { fromEvent } from 'rxjs';
import { take } from 'rxjs/operators';
import EventEmitter from 'eventemitter3';
// import { Subject } from '@@/node_modules/rxjs/index';

const DESCRIPTION = [
  'answer', 'offer'
];

export default class Connection extends EventEmitter {
  constructor(key, info) {
    super();
    console.log('--- NEW WEBRTC CLIENT ---');
    this.key = key;
    this.info = info;
    this.database = null;
    this.peer = null;
    this.entry = null;
    this.subscriptions = [];
    this.localStream = null;
    this.audio = true;
    // this.key = new Subject();
  }

  async open (localStream = new Promise((resolve) => resolve(null))) {
    this.localStream = localStream;
    this.database = await loadDatabase('handshake');
    console.log('-> connection: key', this.key);
    this.entry = await this.database.get(this.key);
    publishInfo(this.entry.key, this.info, !this.key, this.emit.bind(this));
    console.log('-> connection: entry key', this.entry.key);
    // this.key.next(this.entry.key);
    this.emit('key', this.entry.key);
    const stream = await this.localStream.getStream(this.audio);
    this.peer = new FastRTCPeer({ isOfferer: !!this.key, streams: { mediaStream: stream } });
    console.log('-> connection: update capabilities');
    this.emit('stream:change', getCapabilitiesOfStream(stream));
    console.log('-> connection: subsribe to stream update');
    detectStream(this.peer, this.emit.bind(this));
    console.log('-> connection: add subscriptions');
    this.subscriptions = this.subscriptions.concat(observeSignal(this.peer, this.entry));
    console.log('-> connection: subscribe to open event');
    await detectConnect(this.peer, this.emit.bind(this));
    console.log('-> connection: open');

    await detectDisconnect(this.peer);
    this.cleanup();
    this.emit('close', this.peer);
    if (!this.key) {
      this.open(localStream);
    }
  }

  send (type, data) {
    this.peer.send(JSON.stringify({ type, data }));
  }

  async addStream (stream) {
    console.log('-> connection: add local stream');
    this.localStream = stream;
    this.updateStream(this.localStream, this.audio);
  }

  async muteStream () {
    console.log('-> connection: mute local stream');
    this.updateStream(this.localStream, !this.audio);
  }

  async updateStream (mediaStream, audio) {
    console.log('-> connetion: update local stream');
    this.audio = audio;
    const stream = await mediaStream.getStream(this.audio);
    this.peer.addStreams({
      stream: stream.getTracks().reduce((result, track) => {
        result[String(track.kind)] = { track };
        return result;
      }, {})
    });
    this.emit('stream:change', getCapabilitiesOfStream(stream));
  }

  close () {
    console.log('-> connection: close');
    this.peer.close();
  }

  cleanup () {
    console.log('-> connection: cleanup');
    this.peer.close();
    this.peer = null;
    this.subscriptions.reduce((result, subscription) => {
      subscription.unsubscribe();
      return result;
    }, []);
    this.entry.remove();
    this.entry = null;
  }

  destroy () {
    console.log('-> connection: destroy');
    this.close();
    this.database.destroy();
    this.database = null;
  }
}

async function publishInfo (key, info, master, emit) {
  info.isMaster = master;
  const database = await loadDatabase('info');
  const entry = database.get(key);
  const str = JSON.stringify(info);
  entry.push(str);
  const subscription = fromEvent(entry, 'child_added')
    .subscribe(([
      snapshot
    ]) => {
      const result = snapshot.val();
      if (result !== str) {
        emit('remote:info', JSON.parse(result));
        subscription.unsubscribe();
        snapshot.ref.remove();
        database.destroy();
      }
    });
}

function observeSignal (peer, entry) {
  return [
    fromEvent(global, 'beforeunload')
      .subscribe(() => entry.remove()),
    fromEvent(peer, 'signal')
      .subscribe((info) => entry.push(prepareSignal(...info))),
    fromEvent(entry.orderByChild('description').equalTo(DESCRIPTION[Number(!peer.isOfferer)]), 'child_added')
      .subscribe((snapshot) => processSignal(peer, ...snapshot))
  ];
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

async function detectConnect (peer, emit) {
  const p = await detect(peer, 'open');
  emit('open', p);
  return p;
}

async function detectStream (peer, emit) {
  const [
    stream
  ] = await detect(peer, 'stream');
  console.log('-> connection: got remote stream');
  emit('stream', stream);
  return stream;
}

function detectDisconnect (peer) {
  return Promise.race([
    detect(peer, 'close'),
    detect(peer, 'error')
  ]);
}

function detect (obj, type) {
  return fromEvent(obj, type)
    .pipe(take(1))
    .toPromise();
}

function getCapabilitiesOfStream (stream) {
  return stream.getTracks().map((track) => {
    return track.getCapabilities();
  });
}

async function loadDatabase (name) {
  const { default: Database } = await import('@/service/firebase/database');
  return new Database(name);
}
