import { fromEvent } from 'rxjs';
import load from '@/worker/resources/opencv';

export function loadProcess (constructor) {
  load((cv) => {
    prepareProcess(cv, constructor);
    publishReady();
  });
}

function prepareProcess (cv, constructor) {
  const instance = new constructor(cv);
  const dst = new cv.Mat();
  fromEvent(self, 'message').subscribe(onMessage(cv, instance, dst));
}

function onMessage (cv, instance, dst) {
  return (e) => {
    try {
      process(cv, e.data.data, instance, dst, e.data.type);
    } catch (e) {
      console.error('Error in Worker', e);
    }
  };
}

async function process (cv, imageData, instance, dst, type = 'process') {
  const src = createSrc(cv, new Uint32Array(imageData.data), imageData.width, imageData.height);
  publishImage(instance[String(type)](src, dst, cv));
  src.delete();
}

function createSrc (cv, data, width, height) {
  const src = new cv.Mat(height, width, cv.CV_8UC4);
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
