const util = require('util');
const through = require('through');
const debug = util.debuglog('stream-diff');

const comp = (x, y) => x === y ? 0 : x > y ? 1 : -1;

module.exports = function (a, b, compare) {
  let compFn = comp;
  if (compare instanceof Function) {
    compFn = compare;
  } else if (compare) {
    compFn = (objA, objB) => comp(objA[compare], objB[compare]);
  }

  const streamA = a.pipe(through(inputA, endA));
  const streamB = b.pipe(through(inputB, endB));
  const output = through();

  let objA = null;
  let objB = null;
  let closedA = false;
  let closedB = false;

  function inputA(obj) {
    objA = obj;
    streamA.pause();
    if (objB !== null || closedB) {
      handleInput();
    }
  }

  function inputB(obj) {
    objB = obj;
    streamB.pause();
    if (objA !== null || closedA) {
      handleInput();
    }
  }

  function endA() {
    closedA = true;
    if (objA || objB) {
      handleInput();
    } else if (closedB) {
      output.end();
    }
  }

  function endB() {
    closedB = true;
    if (objA || objB) {
      handleInput();
    } else if (closedA) {
      output.end();
    }
  }

  function resume(s) {
    if (!output.paused) {
      setImmediate(function () {
        s.resume();
      });
    }
  }

  function handleInput() {
    if (objA && objB) {
      const diff = compFn(objA, objB);
      if (diff === 0) {
        objA = null;
        objB = null;
        resume(streamA);
        resume(streamB);
      } else if (diff === -1) {
        objA = null;
        resume(streamA);
      } else if (diff === 1) {
        output.queue(objB);
        objB = null;
        resume(streamB);
      }
    } else if (closedA && objB) {
      output.queue(objB);
      objB = null;
      resume(streamB);
    } else if (closedB && objA) {
      objA = null;
      resume(streamA);
    }

  }
  return output;
}
