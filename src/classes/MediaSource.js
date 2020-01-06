import { muteAudio, addSilentStream } from '@/utils/stream';

export default class MediaSource {
  constructor() {
    this.source = null;
    this.stream = null;
  }

  setSource (source) {
    this.reset(source);
  }

  async getStream (audio = true) {
    this.stream = await this.source.getStream(audio);
    if (!audio) {
      muteAudio(this.stream);
    }
    addSilentStream(this.stream);
    return this.stream;
  }

  reset (newSource = null) {
    stopStream(this.stream);
    this.stream = null;
    destroySource(this.source);
    this.source = newSource;
  }

  destroy () {
    this.reset();
  }
}

function stopStream (stream) {
  if (stream) {
    stream.getTracks().forEach((track) => {
      track.stop();
    });
  }
}

function destroySource (source) {
  if (source) {
    source.destroy();
  }
}
