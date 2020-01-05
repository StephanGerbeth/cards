import Base from '@/classes/mediaSource/Base';

export default class CamSource extends Base {
  constructor(constraints = { video: true, audio: true }) {
    super();
    this.constraints = constraints;
  }

  async getStream (audio = true) {
    this.constraints.audio = audio;
    return super.prepareStream(await getUserMedia(this.constraints), true);
  }

  async getAvailableCapabilities () {
    await getUserMedia(this.constraints);
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((device) => {
      return device.kind === 'videoinput';
    });
  }
}

function getUserMedia (constraints) {
  console.log('-> cam: used constraints', constraints);
  return global.navigator.mediaDevices.getUserMedia(constraints);
}
