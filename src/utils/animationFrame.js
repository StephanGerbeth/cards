export function loopByFPS (fps, fn) {
  let lastTime = 0;
  let requestID = null;

  const update = function (currentTime = 0) {
    requestID = global.requestAnimationFrame(update);
    if ((currentTime - lastTime) / 1000 >= 1 / fps) {
      lastTime = currentTime;
      fn();
    }
  };
  return {
    start: function () {
      requestID = global.requestAnimationFrame(update);
    },
    stop: function () {
      global.cancelAnimationFrame(requestID);
    }
  };
}
