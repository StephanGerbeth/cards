import { fromEvent } from 'rxjs';
import { take } from 'rxjs/operators';
import testPattern from '@/assets/svg/test-pattern.svg';
import { cover } from '@/utils/object-fit';

export default class TestImageSource {
  constructor() {
    this.el = document.createElement('canvas');
    this.context = this.el.getContext('2d');
    this.image = null;
    this.animationFrameId = null;

    setup.bind(this)();
  }

  async getStream () {
    return this.el.captureStream();
  }

  destroy () {
    global.cancelAnimationFrame(this.animationFrameId);
    this.el = null;
    this.context = null;
    this.image = null;
    this.animationFrameId = null;
  }
}

async function setup () {
  this.image = await loadImage();
  this.animationFrameId = global.requestAnimationFrame(update.bind(this));
}

function update () {
  this.animationFrameId = global.requestAnimationFrame(update.bind(this));
  this.el.width = this.image.width;
  this.el.height = this.image.height;

  const {
    offsetX,
    offsetY,
    width,
    height
  } = cover(640, 480, 1680, 1050);
  this.context.drawImage(this.image, offsetX, offsetY, width, height);
}

async function loadImage () {
  const img = new Image();
  const load = fromEvent(img, 'load').pipe(take(1)).toPromise();
  img.width = 640;
  img.height = 480;
  img.src = testPattern;
  await load;
  return img;
}
