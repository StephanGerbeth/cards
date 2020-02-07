import { loadProcess } from '@/worker/manager';

const blurSize = 5;

class Grayscale {
  constructor() {
    this.mask = new self.cv.Mat();
    this.color = new self.cv.Scalar(0, 255, 0, 255);
    this.randomColor = new self.cv.Scalar(-1, -1, -1, -1);

    this.sourceDescriptor = new self.cv.Mat();
    this.sourceKeypoints = null;

    // const orb = new cv.ORB();
    // console.log('default name:', orb.getDefaultName());
    // console.log('edge threshold:', orb.getEdgeThreshold());
    // console.log('fast threshold:', orb.getFastThreshold());
    // console.log('first level:', orb.getFirstLevel());
    // console.log('max features:', orb.getMaxFeatures());
    // console.log('n levels:', orb.getNLevels());
    // console.log('patch size:', orb.getPatchSize());
    // console.log('scale factor:', orb.getScaleFactor());
    // console.log('score type:', orb.getScoreType());
    // console.log('wta k:', orb.getWTA_K());
    // this.orb.setScaleFactor(1.6);
    // this.orb.setNLevels(8);
  }

  setup (src) {
    convertToGrayscale(src);
    addGaussianBlur(src);
    const { descriptor, keypoints } = getDescriptor(src);
    this.sourceDescriptor = descriptor;
    this.sourceKeypoints = keypoints;
    this.sourceImg = src.clone();
    return this.sourceImg;
  }

  process (src, dst) {
    convertToGrayscale(src);
    addGaussianBlur(src);

    const { keypoints, descriptor } = getDescriptor(src);

    self.cv.drawKeypoints(src, keypoints, dst, this.color);
    // cv.drawKeypoints(this.sourceImg, this.sourceKeypoints, dst, this.color);

    const matches = new self.cv.DMatchVectorVector();
    const bfMatcher = new self.cv.BFMatcher(self.cv.NORM_HAMMING, false);
    bfMatcher.knnMatch(this.sourceDescriptor, descriptor, matches, 2, this.mask, false);
    bfMatcher.delete();

    // const test = new cv.DMatchVectorVector();
    // const flann = new cv.FlannBasedMatcher();
    // flann.knnMatch(descriptor, this.sourceDescriptor, test, 2);

    const ratio = .55;
    let srcKp = [];
    let dstKp = [];
    const good = new self.cv.DMatchVectorVector();
    for (let i = 0; i < matches.size(); i++) {
      const m = matches.get(i).get(0), n = matches.get(i).get(1);
      if (m.distance < ratio * n.distance) {
        const t = new self.cv.DMatchVector();
        t.push_back(m);
        good.push_back(t);

        const srcPt = this.sourceKeypoints.get(m.queryIdx).pt;
        const dstPt = keypoints.get(m.trainIdx).pt;
        srcKp.push(srcPt.x, srcPt.y);
        dstKp.push(dstPt.x, dstPt.y);
      }
    }

    // let srcKp = [];
    // let dstKp = [];
    // for(let i = 0; i < good.size(); i++) {
    //   const m = good.get(i).get(0);
    //   const srcPt = this.sourceKeypoints.get(m.queryIdx).pt;
    //   const dstPt = keypoints.get(m.trainIdx).pt;
    //   srcKp.push(srcPt.x, srcPt.y);
    //   dstKp.push(dstPt.x, dstPt.y);
    // }

    if (good.size() > 7) {
      const srcPts = self.cv.matFromArray(srcKp.length / 2, 1, self.cv.CV_32FC2, srcKp);
      const dstPts = self.cv.matFromArray(dstKp.length / 2, 1, self.cv.CV_32FC2, dstKp);
      const homo = self.cv.findHomography(srcPts, dstPts, self.cv.RANSAC, 5.0);

      //cv.CV_8UC2
      const obj_corners = self.cv.matFromArray(4, 1, self.cv.CV_32FC2, [0, 0, this.sourceImg.cols, 0, this.sourceImg.cols, this.sourceImg.rows, 0, this.sourceImg.rows]);
      const scene_corners = self.cv.matFromArray(4, 1, self.cv.CV_32FC2, [0, 0, 0, 0, 0, 0, 0, 0]);

      try {
        self.cv.perspectiveTransform(obj_corners, scene_corners, homo);
        self.cv.line(dst, new self.cv.Point(scene_corners.floatAt(0), scene_corners.floatAt(1)), new self.cv.Point(scene_corners.floatAt(2), scene_corners.floatAt(3)), this.color, 10);
        self.cv.line(dst, new self.cv.Point(scene_corners.floatAt(2), scene_corners.floatAt(3)), new self.cv.Point(scene_corners.floatAt(4), scene_corners.floatAt(5)), this.color, 10);
        self.cv.line(dst, new self.cv.Point(scene_corners.floatAt(4), scene_corners.floatAt(5)), new self.cv.Point(scene_corners.floatAt(6), scene_corners.floatAt(7)), this.color, 10);
        self.cv.line(dst, new self.cv.Point(scene_corners.floatAt(6), scene_corners.floatAt(7)), new self.cv.Point(scene_corners.floatAt(0), scene_corners.floatAt(1)), this.color, 10);
      } catch (e) {
        console.error(e);
      }
      homo.delete();
      srcPts.delete();
      dstPts.delete();
    }

    // const maskingCharVecVec = new cv.CharVectorVector();
    // cv.drawMatchesKnn(this.sourceImg, this.sourceKeypoints, src, keypoints, good, dst, this.color, this.color, maskingCharVecVec);

    keypoints.delete();
    descriptor.delete();
    matches.delete();
    good.delete();
    // maskingCharVecVec.delete();

    return dst;
  }
}

function convertToGrayscale (src) {
  self.cv.cvtColor(src, src, self.cv.COLOR_RGBA2GRAY);
  self.cv.cvtColor(src, src, self.cv.COLOR_GRAY2RGBA);
}

function addGaussianBlur (src) {
  self.cv.GaussianBlur(src, src, new self.cv.Size(blurSize, blurSize), 0, 0, self.cv.BORDER_DEFAULT);
}

function getDescriptor (src) {
  const noArray = new self.cv.Mat();
  const keypoints = new self.cv.KeyPointVector();
  const descriptor = new self.cv.Mat();
  const orb = new self.cv.ORB(10000);
  orb.detectAndCompute(src, noArray, keypoints, descriptor);
  orb.delete();
  return { descriptor, keypoints };
}

loadProcess(Grayscale);

// cv.blur(dst, dst, this.blur, new cv.Point(-1, -1), cv.BORDER_DEFAULT);

// this.orb.detect(dst, this.keypoints, this.noArray);
// this.orb.compute(dst, this.keypoints, this.tmp);
