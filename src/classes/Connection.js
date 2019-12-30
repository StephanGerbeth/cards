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
  }

  async open (mediaStream = null) {
    this.mediaStream = mediaStream;
    this.database = await loadDatabase();
    this.entry = await this.database.get(this.key);
    this.emit('key', this.entry.key);

    this.peer = new FastRTCPeer({ isOfferer: !!this.key, streams: { mediaStream } });
    this.subscriptions = this.subscriptions.concat(observeSignal(this.peer, this.entry));
    await detectConnect(this.peer, this.emit.bind(this));
    console.log('-> connection: open');

    await detectDisconnect(this.peer);
    this.cleanup();
    this.emit('close', this.peer);
    if (!this.key) {
      this.open(mediaStream);
    }
  }

  replaceTracks (stream) {
    this.peer.peerConnection.getSenders().forEach((sender) => {
      stream.getTracks().forEach((track) => {
        if (track.kind === sender.track.kind) {
          sender.replaceTrack(track);
        }
      });
    });
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

function observeSignal (peer, entry) {
  return [
    // prevents reconnecting to unique session for slave by page reload
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

function detectConnect (peer, emit) {
  return Promise.race([
    detectStream(peer, emit),
    detectOpen(peer, emit)
  ]);
}

async function detectStream (peer, emit) {
  const stream = await detect(peer, 'stream');
  emit('stream', stream);
  return stream;
}

async function detectOpen (peer, emit) {
  const p = await detect(peer, 'open');
  emit('open', p);
  return p;
}

function detectDisconnect (peer) {
  return Promise.race([
    detect(peer, 'close'),
    detect(peer, 'error'),
    // detect(peer, 'connection')
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
