import { muteAudio } from '@/utils/stream';

export default class Base {
  constructor() {
    this.stream = null;
  }

  async prepareStream (stream, audio) {
    this.stream = stream;
    if (!audio) {
      muteAudio(this.stream);
    }
    return this.stream;
  }

  destroy () {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        track.stop();
      });
    }
    this.stream = null;
  }
}
