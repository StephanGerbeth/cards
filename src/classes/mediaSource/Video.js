import { fromEvent } from 'rxjs';
import { take } from 'rxjs/operators';

export default class VideoSource {
  constructor(options) {
    this.options = options;
    this.el = document.createElement('video');
    this.el.playsinline = true;
    this.el.muted = true;
    this.el.loop = true;
    this.el.autoplay = true;

    this.load = loadVideo(this.el, this.options);
  }

  async getStream () {
    await this.load;
    return this.el.captureStream();
  }

  destroy () {
    this.el.pause();
    this.el.removeAttribute('src'); // empty source
    this.el.load();
    this.el = null;
    this.options = null;
    this.load = null;
  }
}

async function loadVideo (el, options) {
  const load = fromEvent(el, 'loadedmetadata').pipe(take(1)).toPromise();
  const play = fromEvent(el, 'playing').pipe(take(1)).toPromise();

  if (options.stream) {
    el.srcObject = options.stream;
  } else {
    el.src = options.url;
  }

  const loadEvent = await load;
  loadEvent.target.play();
  return play;
}
