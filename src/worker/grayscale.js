import { loadProcess } from '@/worker/manager';

class Grayscale {
  process (src, dst) {
    self.cv.cvtColor(src, src, self.cv.COLOR_RGBA2GRAY);
    self.cv.cvtColor(src, dst, self.cv.COLOR_GRAY2RGBA);

    return dst;
  }
}

loadProcess(Grayscale);
