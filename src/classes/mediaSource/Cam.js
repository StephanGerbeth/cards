import Base from '@/classes/mediaSource/Base';

export default class CamSource extends Base {
  async getStream (audio = true) {
    return super.prepareStream(await global.navigator.mediaDevices.getUserMedia({ video: true, audio: true }), audio);
  }
}
