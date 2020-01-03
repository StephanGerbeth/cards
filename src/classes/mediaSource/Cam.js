import Base from '@/classes/mediaSource/Base';

export default class CamSource extends Base {
  async getStream (audio = true) {
    return super.prepareStream(await getUserMedia(), audio);
  }

  async getAvailableCapabilities () {
    await getUserMedia();
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((device) => {
      return device.kind === 'videoinput';
    });
  }
}

function getUserMedia () {
  return global.navigator.mediaDevices.getUserMedia({ video: true, audio: true });
}
