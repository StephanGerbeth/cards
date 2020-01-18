export default function load (fn) {
  self.importScripts('/opencv_js.js');
  /* eslint-disable-next-line promise/catch-or-return */
  self.cv().then(fn);
}
