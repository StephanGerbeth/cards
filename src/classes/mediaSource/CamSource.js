export default class CamSource {
  constructor() {
    this.stream = null;
  }

  async getStream () {
    this.stream = await global.navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    return this.stream;
  }

  async mute (value) {
    if (value) {
      muteAudio(this.stream);
      return this.stream;
    } else {
      return this.getStream();
    }
  }

  destroy () {
    this.stream.getTracks().forEach((track) => {
      track.stop();
    });
  }
}

function muteAudio (stream) {
  stream
    .getAudioTracks()
    .forEach((track) => {
      track.stop();
    });
}
