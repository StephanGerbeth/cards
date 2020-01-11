import FastRTCPeer from '@mattkrick/fast-rtc-peer';
import { fromEvent } from 'rxjs';
import { take } from 'rxjs/operators';
import BrowserInfo from '@/classes/BrowserInfo';
import MediaSource from '@/classes/MediaSource';
import SubjectHandler from '@/classes/SubjectHandler';
import DataHandler from '@/classes/DataHandler';

const DESCRIPTION = [
  'answer', 'offer'
];

export default class Connection {

  constructor() {
    console.log('--- NEW WEBRTC CLIENT ---');
    this.peer = null;
    this.entry = null;
    this.subscriptions = { database: [] };

    this.audio = true;

    this.mediaSource = new MediaSource();

    this.setup = new SubjectHandler('key');
    this.state = new SubjectHandler('open', 'close');
    this.browser = new SubjectHandler('local', 'remote');
    this.stream = new SubjectHandler('local', 'remote');
    this.data = new DataHandler();
  }

  async open (source = { getStream: () => new Promise((resolve) => resolve(null)) }, key = null) {
    this.mediaSource.setSource(source);
    this.entry = (await import('@/service/firebase')).default.getDatabase('handshake').get(key);

    this.setup.get('key').next(this.entry.key);
    console.log('-> connection: entry key', this.entry.key);

    this.subscriptions.database = this.subscriptions.database.concat([
      await new BrowserInfo().exchange(this.entry.key, !key, this.browser)
    ]);
    console.log('-> connection: remote browser info');

    const stream = await this.mediaSource.getStream(this.audio);

    this.peer = new FastRTCPeer({ isOfferer: !!key, streams: { mediaStream: stream } });
    console.log('-> connection: update capabilities');

    this.stream.get('local').next(getCapabilitiesOfStream(stream));
    console.log('-> connection: subsribe to stream update');

    detectStream(this.peer, this.stream.get('remote'));
    console.log('-> connection: add subscriptions');

    this.subscriptions.database = this.subscriptions.database.concat(observeSignal(this.peer, this.entry));
    console.log('-> connection: subscribe to open event');

    const open = await detectConnect(this.peer);
    this.state.get('open').next(open);
    console.log('-> connection: open');

    this.data.setup(this.peer);

    await detectDisconnect(this.peer);
    console.log('-> connection: closed');

    this.state.get('close').next(this.peer);
    this.destroy();
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
    this.stream.get('local').next(getCapabilitiesOfStream(stream));
  }

  close () {
    console.log('-> connection: close');
    this.peer.close();
  }

  destroy () {
    console.log('-> connection: destroy');
    this.peer.close();
    this.entry.remove();
    this.subscriptions.database = this.subscriptions.database.reduce((result, subscription) => {
      subscription.unsubscribe();
      return result;
    }, []);
    this.mediaSource.destroy();
    this.setup.destroy();
    this.state.destroy();
    this.browser.destroy();
    this.stream.destroy();
    this.data.destroy();
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
