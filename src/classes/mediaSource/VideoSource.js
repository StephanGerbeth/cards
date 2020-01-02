import { fromEvent } from 'rxjs';
import { take } from 'rxjs/operators';

export default class VideoSource {
  constructor(url) {
    this.url = url;
    this.stream = null;

    this.video = document.createElement('video');
    this.video.muted = true;
    this.video.loop = true;
  }

  async getStream () {
    if (!this.stream) {
      await loadVideo(this.video, this.url);
    }
    this.stream = this.video.captureStream();
    return this.stream;
  }

  async mute (value = true) {
    if (value) {
      muteAudio(this.stream);
      return this.stream;
    } else {
      return this.getStream();
    }
  }

  destroy () {
    this.video.pause();
    this.video.removeAttribute('src'); // empty source
    this.video.load();
  }
}

async function loadVideo (video, url) {
  const load = fromEvent(video, 'loadedmetadata').pipe(take(1)).toPromise();
  const play = fromEvent(video, 'playing').pipe(take(1)).toPromise();
  video.src = url;

  const loadEvent = await load;
  loadEvent.target.play();
  return play;
}

function muteAudio (stream) {
  stream
    .getAudioTracks()
    .forEach((track) => {
      track.stop();
    });
}
