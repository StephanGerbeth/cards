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
    publishStatus({ ready: true });
  });
}

function process (e, instance, dst, cv) {
  const data = new Uint32Array(e.data.imageData.data);
  const src = new cv.Mat(e.data.imageData.height, e.data.imageData.width, cv.CV_8UC4);
  src.data.set(data);

  publishImage(instance.process(src, dst, cv));

  src.delete();
}

function publishStatus (data) {
  self.postMessage({ type: 'status', data: data });
}

function publishImage (imageData) {
  const data = new Uint8ClampedArray(imageData.data);
  self.postMessage({ type: 'image', data: data }, [data.buffer]);
}
