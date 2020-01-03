import { fromEvent } from 'rxjs';
import { take } from 'rxjs/operators';
import Base from '@/classes/mediaSource/Base';

export default class VideoSource extends Base {
  constructor(url) {
    super();
    this.url = url;
    this.el = document.createElement('video');
    this.el.muted = true;
    this.el.loop = true;

    this.load = loadVideo(this.el, this.url);
  }

  async getStream (audio = true) {
    await this.load;
    return super.prepareStream(this.el.captureStream(), audio);
  }

  destroy () {
    super.destroy();
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
