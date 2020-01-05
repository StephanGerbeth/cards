export default class SineAudioSource {
  constructor() {
    const AudioContext = global.AudioContext || global.webkitAudioContext;
    this.audioContext = new AudioContext();
    this.oscillator = null;
  }

  async getStream () {
    this.oscillator = this.audioContext.createOscillator();
    this.oscillator.type = 'sine';
    this.oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
    const destination = this.oscillator.connect(this.audioContext.createMediaStreamDestination());
    this.oscillator.start();
    return destination.stream;
  }

  destroy () {
    console.log('OSCILLATOR', this.oscillator);
    this.oscillator.stop();
    this.oscillator = null;
    this.audioContext = null;
  }
}
