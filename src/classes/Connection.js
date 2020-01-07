import FastRTCPeer from '@mattkrick/fast-rtc-peer';
import { fromEvent, Subject } from 'rxjs';
import { take } from 'rxjs/operators';
import BrowserInfo from '@/classes/BrowserInfo';
import MediaSource from '@/classes/MediaSource';

const DESCRIPTION = [
  'answer', 'offer'
];

export default class Connection {
  constructor() {
    console.log('--- NEW WEBRTC CLIENT ---');
    this.peer = null;
    this.entry = null;
    this.subscriptions = { initial: [], default: [] };
    this.mediaSource = new MediaSource();
    this.browserInfo = new BrowserInfo();
    this.audio = true;
    this.subjects = {
      key: new Subject(),
      info: new Subject(),
      streamLocal: new Subject(),
      streamRemote: new Subject(),
      open: new Subject(),
      close: new Subject()
    };
  }

  async open (source = { getStream: () => new Promise((resolve) => resolve(null)) }, key = null) {
    this.mediaSource.setSource(source);
    this.entry = (await import('@/service/firebase')).default.getDatabase('handshake').get(key);

    this.subjects.key.next(this.entry.key);
    console.log('-> connection: entry key', this.entry.key);

    this.subscriptions.initial = this.subscriptions.initial.concat([
      await this.browserInfo.exchange(this.entry.key, !key, this.subjects.info)
    ]);
    console.log('-> connection: remote browser info');

    const stream = await this.mediaSource.getStream(this.audio);

    this.peer = new FastRTCPeer({ isOfferer: !!key, streams: { mediaStream: stream } });
    console.log('-> connection: update capabilities');

    this.subjects.streamLocal.next(getCapabilitiesOfStream(stream));
    console.log('-> connection: subsribe to stream update');

    detectStream(this.peer, this.subjects.streamRemote);
    console.log('-> connection: add subscriptions');

    this.subscriptions.initial = this.subscriptions.initial.concat(observeSignal(this.peer, this.entry));
    console.log('-> connection: subscribe to open event');

    const open = await detectConnect(this.peer);
    this.subjects.open.next(open);
    console.log('-> connection: open');

    await detectDisconnect(this.peer);
    console.log('-> connection: close');

    this.cleanup();
    this.subjects.close.next(this.peer);

    if (!key) {
      console.log('-> connection: reinitialize connection');
      this.open(source, key);
    }
  }

  async addSource (source) {
    console.log('-> connection: add local stream');
    this.mediaSource.setSource(source);
    this.updateStream();
  }

  async mute () {
    console.log('-> connection: mute local stream');
    this.audio = !this.audio;
    this.updateStream();
  }

  async updateStream () {
    console.log('-> connetion: update local stream');
    const stream = await this.mediaSource.getStream(this.audio);
    this.peer.addStreams({
      stream: stream.getTracks().reduce((result, track) => {
        result[String(track.kind)] = { track };
        return result;
      }, {})
    });
    this.subjects.streamLocal.next(getCapabilitiesOfStream(stream));
  }

  subscribe (type, fn) {
    console.log('-> connection: subscribe to', type);
    type = type.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });
    const subscription = this.subjects[String(type)].subscribe(fn);
    this.subscriptions.default.push(subscription);
    return subscription;
  }

  send (type, data) {
    console.log('-> connection: send message');
    this.peer.send(JSON.stringify({ type, data }));
  }

  close () {
    console.log('-> connection: close');
    this.peer.close();
    this.mediaSource.reset();
  }

  cleanup () {
    console.log('-> connection: cleanup');
    this.peer.close();
    this.peer = null;
    this.subscriptions.initial = this.subscriptions.initial.reduce((result, subscription) => {
      subscription.unsubscribe();
      return result;
    }, []);
    this.entry.remove();
    this.entry = null;
  }

  destroy () {
    console.log('-> connection: destroy');
    this.close();
    this.browserInfo.destroy();
    this.mediaSource.destroy();
    this.subscriptions.default = this.subscriptions.default.reduce((result, subscription) => {
      subscription.unsubscribe();
      return result;
    }, []);
  }
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

async function detectConnect (peer) {
  return await detect(peer, 'open');
}

async function detectStream (peer, subject) {
  const [
    stream
  ] = await detect(peer, 'stream');
  console.log('-> connection: got remote stream');
  subject.next(stream);
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
