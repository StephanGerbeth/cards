export default class MediaSource {
  // constructor() { }

  getUserMediaStream () {
    return global.navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  }

  async getBlackSilenceStream (...args) {
    const tracks = await Promise.all([
      blackScreen(...args)
      // silenceAudio()
    ]);
    console.log(tracks);
    return tracks[0];
  }
}

// function silenceAudio () {
//   let ctx = new AudioContext(), oscillator = ctx.createOscillator();
//   let dst = oscillator.connect(ctx.createMediaStreamDestination());
//   oscillator.start();
//   return Promise.resolve(Object.assign(dst.stream.getAudioTracks()[0], { enabled: false }));
// }

function blackScreen ({ width = 640, height = 480 } = {}) {

  let canvas = document.createElement('canvas');
  document.body.appendChild(canvas);
  canvas.width = width;
  canvas.height = height;

  updateScreen.bind(canvas)();
  return new Promise((resolve) => {
    setTimeout(() => {
      let stream = canvas.captureStream(25);
      console.log(stream);
      // console.log(stream.getVideoTracks());
      resolve(stream);
      // resolve(Object.assign(stream.getVideoTracks()[0], { enabled: false }));
    }, 100);

  });

}

function updateScreen () {
  global.requestAnimationFrame(updateScreen.bind(this));
  this.getContext('2d').fillStyle = '#ff0000';
  this.getContext('2d').fillRect(0, 0, this.width / 2, this.height / 2);
}
