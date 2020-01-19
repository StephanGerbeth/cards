import { fromEvent } from 'rxjs';
import load from '@/worker/resources/opencv';

export function loadProcess (constructor) {
  load((cv) => {
    const instance = new constructor(cv);
    const dst = new cv.Mat();
    fromEvent(self, 'message').subscribe((e) => {
      try {
        process(e, instance, dst, cv);
      } catch (e) {
        console.error('Error in Worker', e);
      }
    });
    publishReady();
  });
}

function process (e, instance, dst, cv) {
  const data = new Uint32Array(e.data.data.image);
  const src = new cv.Mat(e.data.data.height, e.data.data.width, cv.CV_8UC4);
  src.data.set(data);

  publishImage(instance.process(src, dst, cv));

  src.delete();
}

function publishReady () {
  self.postMessage({ type: 'ready' });
}

function publishImage (imageData) {
  const data = new Uint8ClampedArray(imageData.data);
  self.postMessage({ type: 'image', data: data }, [data.buffer]);
}
