import FastRTCPeer from '@mattkrick/fast-rtc-peer';
import { fromEvent } from 'rxjs';
import { take } from 'rxjs/operators';
import EventEmitter from 'eventemitter3';

const DESCRIPTION = [
  'answer', 'offer'
];

export default class Connection extends EventEmitter {
  constructor(key) {
    super();
    console.log('--- NEW WEBRTC CLIENT ---');
    this.key = key;
    this.database = null;
    this.peer = null;
    this.entry = null;
    this.subscriptions = [];
    this.localStream = null;
    this.audio = true;
  }

  async open (stream = new Promise((resolve) => resolve(null))) {
    this.localStream = stream;
    this.database = await loadDatabase();
    this.entry = await this.database.get(this.key);
    this.emit('key', this.entry.key);
    this.peer = new FastRTCPeer({ isOfferer: !!this.key, streams: { mediaStream: await this.localStream.getStream() } });
    detectStream(this.peer, this.emit.bind(this)),
      this.subscriptions = this.subscriptions.concat(observeSignal(this.peer, this.entry));
    await detectConnect(this.peer, this.emit.bind(this));
    console.log('-> connection: open');

    await detectDisconnect(this.peer);
    this.cleanup();
    this.emit('close', this.peer);
    if (!this.key) {
      this.open(stream);
    }
  }

  async addStream (stream) {
    console.log('-> connection: add local stream');
    this.localStream = stream;
    updateStream(this.peer, await this.localStream.getStream(this.audio));
  }

  async muteStream () {
    console.log('-> connection: mute local stream');
    this.audio = !this.audio;
    updateStream(this.peer, await this.localStream.getStream(this.audio));
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

function updateStream (peer, stream) {
  console.log('-> connetion: update local stream');
  peer.addStreams({
    stream: stream.getTracks().reduce((result, track) => {
      result[String(track.kind)] = { track };
      return result;
    }, {})
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

async function loadDatabase () {
  const { default: Database } = await import('@/service/firebase/database');
  return new Database('handshake');
}
