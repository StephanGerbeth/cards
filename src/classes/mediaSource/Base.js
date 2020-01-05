import { muteAudio, addSilentStream } from '@/utils/stream';
// let audioStream = null;

export default class Base {
  constructor() {
    this.stream = null;
  }

  async prepareStream (stream, audio = true) {
    this.stream = stream;
    if (!audio) {
      muteAudio(this.stream);
    }
    addSilentStream(this.stream);
    return this.stream;
  }

  destroy () {
    console.log('destroy source');
    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        track.stop();
      });
    }
    this.stream = null;
  }
}
