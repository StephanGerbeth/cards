import Base from '@/classes/mediaSource/Base';

export default class SineAudioSource extends Base {
  constructor() {
    super();
    const AudioContext = global.AudioContext || global.webkitAudioContext;
    this.audioContext = new AudioContext();
  }

  async getStream (audio = true) {
    this.oscillator = this.audioContext.createOscillator();
    this.oscillator.type = 'sine';
    this.oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
    const destination = this.oscillator.connect(this.audioContext.createMediaStreamDestination());
    this.oscillator.start();
    return super.prepareStream(destination.stream, audio);
  }

  destroy () {
    super.destroy();
    this.oscillator.stop();
    this.oscillator = null;
    this.audioContext = null;
  }
}
