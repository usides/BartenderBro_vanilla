const debounce = function (fn, ms) {
  let timeout;
  return function (...args) {
    const fnCall = () => fn.call(this, ...args);

    clearTimeout(timeout);
    timeout = setTimeout(fnCall, ms);
  };
};

function throttle(fn, ms) {
  let isThrottled = false,
    savedArgs,
    savedThis;

  function wrapper(...args) {
    if (isThrottled) {
      savedArgs = args;
      savedThis = this;
      return;
    }

    fn.apply(this, args);

    isThrottled = true;

    setTimeout(function () {
      isThrottled = false;
      if (savedArgs) {
        wrapper.apply(savedThis, savedArgs);
        savedArgs = savedThis = null;
      }
    }, ms);
  }

  return wrapper;
}

export { debounce, throttle };
