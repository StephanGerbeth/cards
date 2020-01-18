import { loadProcess } from '@/worker/manager';

class Grayscale {
  process (src, dst, cv) {
    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY);
    cv.cvtColor(src, dst, cv.COLOR_GRAY2RGBA);

    return dst;
  }
}

loadProcess(Grayscale);
