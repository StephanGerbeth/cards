import Virtual from '@/classes/mediaSource/Virtual';
import Cam from '@/classes/mediaSource/Cam';
import Video from '@/classes/mediaSource/Video';
import SourceToCanvas from '@/classes/mediaSource/SourceToCanvas';
import SineAudio from '@/classes/mediaSource/SineAudio';
import TestImage from '@/classes/mediaSource/TestImage';

export default class MediaSource {
  constructor() {
    this.source = null;
  }

  cam () {
    this.clean();
    this.source = new Cam();
    return this.source;
  }

  video (url = '/video/test.mp4') {
    this.clean();

    this.source = new SourceToCanvas(new Video(url));
    return this.source;
  }

  test () {
    this.clean();
    this.source = new Virtual(new TestImage(), new SineAudio());
    return this.source;
  }

  clean () {
    if (this.source) {
      this.source.destroy();
    }
  }
}
