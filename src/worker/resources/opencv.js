// edit modules/js/CMakeLists.txt in opencv project: https://github.com/opencv/opencv/issues/13356#issuecomment-521882672
// build: "python ./platforms/js/build_js.py --emscripten_dir /Users/stephan.gerbeth/dev/emsdk/upstream/emscripten ./build_wasm --build_wasm"

self.Module = {
  locateFile: (path) => {
    const url = `/wasm/${path}`;
    console.log(`⬇️Downloading wasm from ${url}`);
    return url;
  }
};

export default function load (fn) {
  self.importScripts('/wasm/opencv.js');
  /* eslint-disable-next-line promise/catch-or-return */
  self.cv().then((cb) => fn(cb));
}
