let lastTime = 0;
let fps = 60;
let requestID = null;
let tasks = new Set();

function loop (currentTime = 0) {
  if ((currentTime - lastTime) / 1000 >= 1 / fps) {
    lastTime = currentTime;
    tasks = [...tasks].reduce((result, task) => {
      task.fn();
      if (!task.single) {
        result.add(task);
      }
      return result;
    }, new Set());
  }
  requestID = global.requestAnimationFrame(loop);
}

function start () {
  if (tasks.size) {
    console.log('-> animationFrame: global start');
    loop();
  }
}

function stop () {
  if (!tasks.size) {
    global.cancelAnimationFrame(requestID);
    console.log('-> animationFrame: global stop');
  }
}

export function addToAnimationFrame (fn, single = false) {
  const value = { fn: fn, single };
  tasks.add(value);
  console.log('-> animationFrame: add task - number of tasks', tasks.size);
  start();

  return {
    destroy () {
      tasks.delete(value);
      console.log('-> animationFrame: removed task - number of tasks', tasks.size);
      stop();
    }
  };
}
