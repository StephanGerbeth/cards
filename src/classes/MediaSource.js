import TestScreen from '@/classes/mediaSource/TestScreen';
import CamSource from '@/classes/mediaSource/CamSource';
import VideoSource from '@/classes/mediaSource/VideoSource';

export default class MediaSource {
  constructor() {
    this.source = null;
  }

  cam () {
    this.clean();
    this.source = new CamSource();
    return this.source;
  }

  video (url = '/video/test.mp4') {
    this.clean();
    this.source = new VideoSource(url);
    return this.source;
  }

  test () {
    this.clean();
    this.source = new TestScreen();
    return this.source;
  }

  clean () {
    if (this.source) {
      this.source.destroy();
    }
  }
}
