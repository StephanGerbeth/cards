import { loadProcess } from '@/worker/manager';

const blurSize = 5;

class Grayscale {
  constructor(cv) {
    this.orb = new cv.ORB(10000);
    this.bfMatcher = new cv.BFMatcher(cv.NORM_HAMMING, false);
    this.mask = new cv.Mat();
    this.color = new cv.Scalar(0, 255, 0, 255);
    this.randomColor = new cv.Scalar(-1, -1, -1, -1);

    this.sourceDescriptor = new cv.Mat();
    this.sourceKeypoints = null;    
    console.log(this.orb);
    // this.orb.setScaleFactor(1.6);
    // this.orb.setNLevels(8);
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
    cv.drawKeypoints(src, keypoints, dst, this.color);
    // cv.drawKeypoints(this.sourceImg, this.sourceKeypoints, dst, color);

    const matches = new cv.DMatchVectorVector();
    this.bfMatcher.knnMatch(this.sourceDescriptor, descriptor, matches, 2, this.mask, false);

    const ratio = .45;
    let srcKp = [];
    let dstKp = [];
    const good = new cv.DMatchVectorVector();
    for (let i = 0; i < matches.size(); i++) {
      const m = matches.get(i).get(0), n = matches.get(i).get(1);
      if (m.distance < ratio * n.distance) {        
        const t = new cv.DMatchVector();
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
    
    if(good.size() > 4) {
      const srcPts = cv.matFromArray(srcKp.length/2, 1, cv.CV_32FC2, srcKp);
      const dstPts = cv.matFromArray(dstKp.length/2, 1, cv.CV_32FC2, dstKp);
      const homo = cv.findHomography(srcPts, dstPts, cv.RANSAC, 5.0);
      
      //cv.CV_8UC2
      const obj_corners = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, this.sourceImg.cols, 0,this.sourceImg.cols, this.sourceImg.rows, 0, this.sourceImg.rows]);
      const scene_corners = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, 0, 0, 0, 0, 0, 0]);
      
      try {       
        cv.perspectiveTransform(obj_corners, scene_corners, homo);        
        cv.line( dst, new cv.Point(scene_corners.floatAt(0),scene_corners.floatAt(1)), new cv.Point(scene_corners.floatAt(2),scene_corners.floatAt(3)), this.color, 10 );        
        cv.line( dst, new cv.Point(scene_corners.floatAt(2),scene_corners.floatAt(3)), new cv.Point(scene_corners.floatAt(4),scene_corners.floatAt(5)), this.color, 10 );        
        cv.line( dst, new cv.Point(scene_corners.floatAt(4),scene_corners.floatAt(5)), new cv.Point(scene_corners.floatAt(6),scene_corners.floatAt(7)), this.color, 10 );        
        cv.line( dst, new cv.Point(scene_corners.floatAt(6),scene_corners.floatAt(7)), new cv.Point(scene_corners.floatAt(0),scene_corners.floatAt(1)), this.color, 10 );        
      } catch(e) {
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
