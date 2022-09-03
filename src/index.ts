export const enum Direction {
  LEFT,
  RIGHT,
  NONE
}

export const enum Gesture {
  FLING,
  SWIPE,
  NONE
}

export type CompleteCallback = (element: SwipeableHTMLElement, touchDirection: Direction, gesture: Gesture) => any;

export type UpdateCallback = (element: SwipeableHTMLElement, touchDistance: number) => any;

export interface Options {
  /** Speed threshold (in screen % traveled per ms) that needs to be crossed immediately
   * before ending touch for it to count as a 'fling' (default is 0.005 = 0.5%) */
  flingSpeed: number,
  /** Touch travel distance (in screen %) to count as a swipe (default is 0.5 = 50%) */
  swipeDistance: number,
  /** Milliseconds that needs to elapse between touchMove updates (default is 5) */
  updateRate: number,
  /** Touch travel distance (in pixels) before locking to X axis / swipe (default is 0) */
  xAxisLock: number,
  /** Touch travel distance (in pixels) before locking to Y axis / scroll (default is 0) */
  yAxisLock: number
}

export interface SwipeableHTMLElement extends HTMLElement {
  swipeConfig?: {
    options: Options;
    complete: CompleteCallback[];
    update: UpdateCallback[];
  };
  swipeProgress?: {
    /** Client coordinates */
    startX: number;
    startY: number;
    /** Distance ranges from -1 to 1 (screen width traveled in %) */
    distance: number;
    flingDirection: Direction;
    /** Timestamp of last processed touchmove update */
    lastUpdate: number;
    /** Is X axis locked right now */
    isScrolling: boolean;
    /** Is Y axis locked right now */
    isSwiping: boolean;
  };
}

export function addFlingSwipe(
  element: SwipeableHTMLElement,
  completeCallback?: CompleteCallback | CompleteCallback[],
  updateCallback?: UpdateCallback | UpdateCallback[],
  options?: Partial<Options>
) {
  element.swipeConfig = element.swipeConfig ?? {
    options: {
      flingSpeed: 0.005,
      swipeDistance: 0.5,
      updateRate: 5,
      xAxisLock: 0,
      yAxisLock: 0
    },
    complete: [],
    update: []
  };
  const config = element.swipeConfig;

  if (options) {
    config.options = { ...config.options, ...options };
  }
  if (completeCallback) {
    config.complete = [...new Set(
      config.complete.concat(completeCallback)
    )];
  }
  if (updateCallback) {
    config.update = [...new Set(
      config.update.concat(updateCallback)
    )];
  }

  element.swipeProgress = {
    startX: 0,
    startY: 0,
    distance: 0,
    flingDirection: Direction.NONE,
    lastUpdate: 0,
    isScrolling: false,
    isSwiping: false
  }

  element.addEventListener('touchstart', startTouch, { passive: true });
  element.addEventListener('touchmove', dragTouch, { passive: false });
  element.addEventListener('touchend', endTouch, { passive: true });
}

export function removeFlingSwipe(
  element: SwipeableHTMLElement, 
  completeCallback?: CompleteCallback | CompleteCallback[],
  updateCallback?: UpdateCallback | UpdateCallback[]
) {
  if (element.swipeConfig) {
    if (completeCallback) {
      if (Array.isArray(completeCallback)) {
        element.swipeConfig.complete = element.swipeConfig.complete.filter(v => !completeCallback.includes(v));
      } else {
        element.swipeConfig.complete = element.swipeConfig.complete.filter(v => v !== completeCallback);
      }
    }
    if (updateCallback) {
      if (Array.isArray(updateCallback)) {
        element.swipeConfig.update = element.swipeConfig.update.filter(v => !updateCallback.includes(v));
      } else {
        element.swipeConfig.update = element.swipeConfig.update.filter(v => v !== updateCallback);
      }
    }
  }

  if (
    (!completeCallback && !updateCallback) || 
    (element.swipeConfig?.complete.length === 0 && element.swipeConfig?.update.length === 0)
  ) {
    element.removeEventListener('touchstart', startTouch);
    element.removeEventListener('touchmove', dragTouch);
    element.removeEventListener('touchend', endTouch);  
    delete element.swipeConfig;
    delete element.swipeProgress;
  }
}

function processCallbacks<T extends CompleteCallback | UpdateCallback>(
  callbacks: T[],
  ...params: Parameters<T>
) {
  for (let i = 0, l = callbacks.length; i < l; i++) {
    // Unfortunately typescript fails here
    callbacks[i](...params as [any, any, any]);
  }
}

function startTouch(e: TouchEvent) {
  const progress = (e.currentTarget as SwipeableHTMLElement).swipeProgress!;
  progress.startX = e.touches[0] .clientX;
  progress.startY = e.touches[0].clientY;
  progress.lastUpdate = e.timeStamp;
}

function dragTouch(e: TouchEvent) {
  const target = e.currentTarget as SwipeableHTMLElement;
  const progress = target.swipeProgress!;

  if (progress.isScrolling) {
    return;
  }

  const config = target.swipeConfig!;
  const options = config.options;

  if (!progress.isSwiping) {
    const xAbsDist = Math.abs(e.touches[0].clientX - progress.startX);
    const yAbsDist = Math.abs(e.touches[0].clientY - progress.startY);
    progress.isSwiping = xAbsDist > yAbsDist && xAbsDist > options.xAxisLock;
    progress.isScrolling = yAbsDist > xAbsDist && yAbsDist > options.yAxisLock;
  }

  if (progress.isSwiping) {
    e.preventDefault();
    e.stopImmediatePropagation();
    const timePassed = e.timeStamp - progress.lastUpdate;
    if (timePassed < options.updateRate) {
      return;
    }
    const newDist = (e.touches[0].clientX - progress.startX) / window.innerWidth;
    const speed = Math.abs(newDist - progress.distance) / timePassed;
    if (speed >= options.flingSpeed) {
      // Decide fling direction based on difference to last update (rather than total distance).
      // Fling direction then has to match swipe direction in endTouch for it to be valid.
      progress.flingDirection = newDist > progress.distance ? Direction.RIGHT : Direction.LEFT;
    } else {
      progress.flingDirection = Direction.NONE;
    }
    processCallbacks(config.update, target, newDist);
    progress.distance = newDist;
    progress.lastUpdate = e.timeStamp;
  }
}

function endTouch(e: TouchEvent) {
  const target = e.currentTarget as SwipeableHTMLElement;
  const config = target.swipeConfig!;
  const progress = target.swipeProgress!;

  switch (progress.flingDirection) {
    case Direction.NONE:
    {
      // Check for swipe
      if (progress.distance > config.options.swipeDistance) {
        processCallbacks(config.complete, target, Direction.RIGHT, Gesture.SWIPE);
      } else if (progress.distance < -config.options.swipeDistance) {
        processCallbacks(config.complete, target, Direction.LEFT, Gesture.SWIPE);
      } else {
        processCallbacks(config.complete, target, Direction.NONE, Gesture.NONE);
      }
      break;
    }
    case Direction.RIGHT:
    {
      if (progress.distance > 0) {
        processCallbacks(config.complete, target, Direction.RIGHT, Gesture.FLING);
      } else {
        processCallbacks(config.complete, target, Direction.NONE, Gesture.NONE);
      }
      break;
    }
    case Direction.LEFT:
    {
      if (progress.distance < 0) {
        processCallbacks(config.complete, target, Direction.LEFT, Gesture.FLING);
      } else {
        processCallbacks(config.complete, target, Direction.NONE, Gesture.NONE);
      }
      break;
    }
  }
  
  target.swipeProgress = {
    startX: 0,
    startY: 0,
    distance: 0,
    flingDirection: Direction.NONE,
    lastUpdate: 0,
    isScrolling: false,
    isSwiping: false
  };
}