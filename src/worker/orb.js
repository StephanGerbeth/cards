import { loadProcess } from '@/worker/manager';

const blurSize = 5;

class Grayscale {
  constructor(cv) {
    this.orb = new cv.ORB(10000);
    this.bfMatcher = new cv.BFMatcher(cv.NORM_HAMMING, false);
    this.mask = new cv.Mat();
    this.color = new cv.Scalar(0, 255, 0, 1);
    this.randomColor = new cv.Scalar(-1, -1, -1, -1);

    this.sourceDescriptor = new cv.Mat();
    this.sourceKeypoints = null;

    // this.setup(cv);
  }

  setup (src, dst, cv) {
    convertToGrayscale(src, cv);
    addGaussianBlur(src, cv);
    const { descriptor, keypoints } = getDescriptor(this.orb, src, cv);
    this.sourceDescriptor = descriptor;
    this.sourceKeypoints = keypoints;
    this.sourceImg = src.clone();
    return this.sourceImg;
  }

  process (src, dst, cv) {
    convertToGrayscale(src, cv);
    addGaussianBlur(src, cv);

    // // create orb descriptor
    const { keypoints, descriptor } = getDescriptor(this.orb, src, cv);

    // const color = new cv.Scalar(0, 255, 0, 1);
    // cv.drawKeypoints(src, keypoints, dst, color);
    // cv.drawKeypoints(this.sourceImg, this.sourceKeypoints, dst, color);

    const matches = new cv.DMatchVectorVector();
    this.bfMatcher.knnMatch(this.sourceDescriptor, descriptor, matches, 2, this.mask, false);

    const ratio = .5, good = new cv.DMatchVectorVector();
    for (let i = 0; i < matches.size(); i++) {
      const m = matches.get(i).get(0), n = matches.get(i).get(1);
      if (m.distance < ratio * n.distance) {
        const t = new cv.DMatchVector();
        t.push_back(m);
        good.push_back(t);
      }
    }

    const maskingCharVecVec = new cv.CharVectorVector();
    cv.drawMatchesKnn(this.sourceImg, this.sourceKeypoints, src, keypoints, good, dst, this.color, this.color, maskingCharVecVec);

    keypoints.delete();
    descriptor.delete();
    matches.delete();
    good.delete();
    maskingCharVecVec.delete();

    return dst;
  }
}

function convertToGrayscale (src, cv) {
  cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY);
  cv.cvtColor(src, src, cv.COLOR_GRAY2RGBA);
}

function addGaussianBlur (src, cv) {
  cv.GaussianBlur(src, src, new cv.Size(blurSize, blurSize), 0, 0, cv.BORDER_DEFAULT);
}

function getDescriptor (orb, src, cv) {
  const noArray = new cv.Mat();
  const keypoints = new cv.KeyPointVector();
  const descriptor = new cv.Mat();
  orb.detectAndCompute(src, noArray, keypoints, descriptor);
  return { descriptor, keypoints };
}

loadProcess(Grayscale);

// cv.blur(dst, dst, this.blur, new cv.Point(-1, -1), cv.BORDER_DEFAULT);

// this.orb.detect(dst, this.keypoints, this.noArray);
// this.orb.compute(dst, this.keypoints, this.tmp);
