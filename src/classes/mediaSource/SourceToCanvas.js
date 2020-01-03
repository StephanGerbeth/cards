import Base from '@/classes/mediaSource/Base';

export default class VideoCanvas extends Base {
  constructor(source) {
    super();
    this.source = source;
    this.el = document.createElement('canvas');
    this.context = this.el.getContext('2d');

    this.animationFrameId = global.requestAnimationFrame(update.bind(this));
  }

  async getStream (audio = true) {
    return super.prepareStream(new MediaStream([
      ...(await this.source.getStream(audio)).getAudioTracks(),
      ...this.el.captureStream().getVideoTracks()
    ]), audio);
  }

  destroy () {
    super.destroy();
    global.cancelAnimationFrame(this.animationFrameId);
    this.source.destroy();
    this.source = null;
    this.el = null;
    this.context = null;
  }
}

function update () {
  this.animationFrameId = global.requestAnimationFrame(update.bind(this));
  this.el.width = this.source.el.videoWidth;
  this.el.height = this.source.el.videoHeight;
  this.context.drawImage(this.source.el, 0, 0);
}
