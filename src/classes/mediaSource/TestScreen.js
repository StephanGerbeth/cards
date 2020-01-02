import { fromEvent } from 'rxjs';
import { take } from 'rxjs/operators';
import testPattern from '@/assets/svg/test-pattern.svg';

let animationFrameId = null;

export default class TestScreen {
  constructor(options = {}) {
    this.options = options;
    this.stream = null;
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d', { alpha: false });
    if (this.options.debug) {
      document.body.appendChild(this.canvas);
    }
  }

  async getStream (...args) {

    this.stream = mergeStreams([
      blackScreen(this.canvas, this.context, ...args),
      sineAudio()
    ]);

    return this.stream;
  }

  async mute (value = true) {
    if (value) {
      this.stream
        .getAudioTracks()
        .forEach((track) => {
          track.stop();
        });
      return this.stream;
    } else {
      return this.getStream();
    }
  }

  destroy () {
    global.cancelAnimationFrame(animationFrameId);
  }
}

function mergeStreams (streams) {
  return new MediaStream(
    streams.reduce((result, stream) => {
      return result.concat(stream.getTracks());
    }, [])
  );
}

function sineAudio () {
  const ctx = new AudioContext();
  const oscillator = ctx.createOscillator();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(440, ctx.currentTime);
  let dst = oscillator.connect(ctx.createMediaStreamDestination());
  oscillator.start();
  return dst.stream;
}

function blackScreen (canvas, context, { width = 640, height = 480 } = {}) {
  canvas.width = width;
  canvas.height = height;
  const image = context.getImageData(0, 0, width, height);
  setupScreen.bind({ canvas, context, image })();
  return canvas.captureStream(10);
  // resolve(Object.assign(stream.getVideoTracks()[0], { enabled: false }));
}

async function setupScreen () {
  this.img = await loadImage();
  updateScreen.bind(this)();
}

function updateScreen () {
  animationFrameId = global.requestAnimationFrame(updateScreen.bind(this));
  const {
    offsetX,
    offsetY,
    width,
    height
  } = fit(false)(640, 480, 1680, 1050);
  this.context.drawImage(this.img, offsetX, offsetY, width, height);
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

function fit (contains) {
  return (parentWidth, parentHeight, childWidth, childHeight, scale = 1, offsetX = 0.5, offsetY = 0.5) => {
    const childRatio = childWidth / childHeight;
    const parentRatio = parentWidth / parentHeight;
    let width = parentWidth * scale;
    let height = parentHeight * scale;

    if (contains ? (childRatio > parentRatio) : (childRatio < parentRatio)) {
      height = width / childRatio;
    } else {
      width = height * childRatio;
    }

    return {
      width,
      height,
      offsetX: (parentWidth - width) * offsetX,
      offsetY: (parentHeight - height) * offsetY
    };
  };
}
