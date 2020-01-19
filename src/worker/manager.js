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
      process(cv, e, instance, dst);
    } catch (e) {
      console.error('Error in Worker', e);
    }
  };
}

function process (cv, e, instance, dst) {
  const data = e.data.data;
  const src = createSrc(cv, new Uint32Array(data.image), data.width, data.height);
  publishImage(instance.process(src, dst, cv));
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

function publishImage (imageData) {
  const data = new Uint8ClampedArray(imageData.data);
  self.postMessage({ type: 'image', data: data }, [data.buffer]);
}
