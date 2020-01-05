import { fromEvent } from 'rxjs';
import { take } from 'rxjs/operators';

export default class VideoSource {
  constructor(url) {
    this.url = url;
    this.el = document.createElement('video');
    this.el.muted = true;
    this.el.loop = true;

    this.load = loadVideo(this.el, this.url);
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
    this.url = null;
    this.load = null;
  }
}

async function loadVideo (el, url) {
  const load = fromEvent(el, 'loadedmetadata').pipe(take(1)).toPromise();
  const play = fromEvent(el, 'playing').pipe(take(1)).toPromise();
  el.src = url;

  const loadEvent = await load;
  loadEvent.target.play();
  return play;
}
