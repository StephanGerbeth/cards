import { fromEvent } from 'rxjs';
import load from '@/worker/resources/opencv';

export function loadProcess (constructor) {
  load((cv) => {
    self.cv = cv;
    prepareProcess(constructor);
    publishReady();
  });
}

function prepareProcess (constructor) {
  const instance = new constructor();
  fromEvent(self, 'message').subscribe(onMessage(instance));
}

function onMessage (instance) {
  return (e) => {
    try {
      process(e.data.data, instance, e.data.type);
    } catch (e) {
      console.error('Error in Worker', e);
    }
  };
}

async function process (imageData, instance, type = 'process') {
  const src = createSrc(new Uint32Array(imageData.data), imageData.width, imageData.height);
  const dst = new self.cv.Mat(src.rows, src.cols, self.cv.CV_8UC4, new self.cv.Scalar(0, 0, 0, 0));
  publishImage(instance[String(type)](src, dst));
  src.delete();
  dst.delete();
}

function createSrc (data, width, height) {
  const src = new self.cv.Mat(height, width, self.cv.CV_8UC4);
  src.data.set(data);
  return src;
}

function publishReady () {
  self.postMessage({ type: 'ready' });
}

function publishImage (dst) {
  const imageData = new ImageData(new Uint8ClampedArray(dst.data), dst.cols, dst.rows);
  self.postMessage({ type: 'image', data: imageData }, [imageData.data.buffer]);
}
