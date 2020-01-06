export default class CamSource {
  constructor(constraints = { video: true, audio: true }) {
    this.constraints = constraints;
  }

  async getStream (audio = true) {
    this.constraints.audio = audio;
    return await getUserMedia(this.constraints);
  }

  async getAvailableCapabilities () {
    await getUserMedia(this.constraints);
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((device) => {
      return device.kind === 'videoinput';
    });
  }

  destroy () {
    // this.constraints = null;
  }
}

function getUserMedia (constraints) {
  console.log('-> cam: used constraints', constraints);
  return global.navigator.mediaDevices.getUserMedia(constraints);
}
