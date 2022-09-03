export const enum Movement {
  HORIZONTAL,
  VERTICAL,
  NONE
}

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

export type StartCallback = (element: SwipeableHTMLElement, movement: Movement) => any;

export type UpdateCallback = (element: SwipeableHTMLElement, touchDistance: number) => any;

export type CompleteCallback = (element: SwipeableHTMLElement, touchDirection: Direction, gesture: Gesture) => any;


export interface Options {
  /** Speed threshold (in screen % traveled per ms) that needs to be crossed immediately
   * before ending touch for it to count as a 'fling' (default is 0.005 = 0.5%) */
  flingSpeed: number,
  /** Touch travel distance (in screen %) to count as a swipe (default is 0.5 = 50%) */
  swipeDistance: number,
  /** Milliseconds that needs to elapse between touchMove updates (default is 5) */
  updateRate: number,
  /** Touch travel distance (in pixels) before locking to X axis / swipe (default is 0) */
  horizontalLock: number,
  /** Touch travel distance (in pixels) before locking to Y axis / scroll (default is 0) */
  verticalLock: number
}

export interface SwipeableHTMLElement extends HTMLElement {
  swipeConfig?: {
    options: Options;
    start: StartCallback[];
    update: UpdateCallback[];
    complete: CompleteCallback[];
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
    /** Determines which axis is locked */
    movement: Movement;
  };
}

export function addFlingSwipe(
  element: SwipeableHTMLElement,
  startCallback?: StartCallback | StartCallback[],
  updateCallback?: UpdateCallback | UpdateCallback[],
  completeCallback?: CompleteCallback | CompleteCallback[],
  options?: Partial<Options>
) {
  element.swipeConfig = element.swipeConfig ?? {
    options: {
      flingSpeed: 0.005,
      swipeDistance: 0.5,
      updateRate: 5,
      horizontalLock: 0,
      verticalLock: 0
    },
    update: [],
    start: [],
    complete: []
  };
  const config = element.swipeConfig;

  if (options) {
    config.options = { ...config.options, ...options };
  }
  if (startCallback) {
    config.start = [...new Set(
      config.start.concat(startCallback)
    )];
  }
  if (updateCallback) {
    config.update = [...new Set(
      config.update.concat(updateCallback)
    )];
  }
  if (completeCallback) {
    config.complete = [...new Set(
      config.complete.concat(completeCallback)
    )];
  }

  element.swipeProgress = {
    startX: 0,
    startY: 0,
    distance: 0,
    flingDirection: Direction.NONE,
    lastUpdate: 0,
    movement: Movement.NONE
  }

  element.addEventListener('touchstart', startTouch, { passive: true });
  element.addEventListener('touchmove', dragTouch, { passive: false });
  element.addEventListener('touchend', endTouch, { passive: true });
}

export function removeFlingSwipe(
  element: SwipeableHTMLElement, 
  startCallback?: StartCallback | StartCallback[],
  updateCallback?: UpdateCallback | UpdateCallback[],
  completeCallback?: CompleteCallback | CompleteCallback[]
) {
  if (element.swipeConfig) {
    if (startCallback) {
      if (Array.isArray(startCallback)) {
        element.swipeConfig.start = element.swipeConfig.start.filter(v => !startCallback.includes(v));
      } else {
        element.swipeConfig.start = element.swipeConfig.start.filter(v => v !== startCallback);
      }
    }
    if (updateCallback) {
      if (Array.isArray(updateCallback)) {
        element.swipeConfig.update = element.swipeConfig.update.filter(v => !updateCallback.includes(v));
      } else {
        element.swipeConfig.update = element.swipeConfig.update.filter(v => v !== updateCallback);
      }
    }
    if (completeCallback) {
      if (Array.isArray(completeCallback)) {
        element.swipeConfig.complete = element.swipeConfig.complete.filter(v => !completeCallback.includes(v));
      } else {
        element.swipeConfig.complete = element.swipeConfig.complete.filter(v => v !== completeCallback);
      }
    }
  }

  if (
    (!startCallback && !updateCallback && !completeCallback) || 
    (element.swipeConfig?.start.length === 0 && element.swipeConfig?.update.length === 0 && element.swipeConfig?.complete.length === 0)
  ) {
    element.removeEventListener('touchstart', startTouch);
    element.removeEventListener('touchmove', dragTouch);
    element.removeEventListener('touchend', endTouch);  
    delete element.swipeConfig;
    delete element.swipeProgress;
  }
}

function processCallbacks<T extends StartCallback | UpdateCallback | CompleteCallback>(
  callbacks: T[],
  ...params: Parameters<T>
) {
  for (let i = 0, l = callbacks.length; i < l; i++) {
    // @ts-ignore Unfortunately typescript fails here
    callbacks[i](...params);
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

  if (progress.movement === Movement.VERTICAL) {
    return;
  }

  const config = target.swipeConfig!;
  const options = config.options;

  if (progress.movement === Movement.NONE) {
    const xAbsDist = Math.abs(e.touches[0].clientX - progress.startX);
    const yAbsDist = Math.abs(e.touches[0].clientY - progress.startY);
    if (xAbsDist > yAbsDist && xAbsDist > options.horizontalLock) {
      processCallbacks(config.start, target, Movement.HORIZONTAL);
      progress.movement = Movement.HORIZONTAL;
    } else if (yAbsDist > xAbsDist && yAbsDist > options.verticalLock) {
      processCallbacks(config.start, target, Movement.VERTICAL);
      progress.movement = Movement.VERTICAL;
    }
  }

  if (progress.movement === Movement.HORIZONTAL) {
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
    movement: Movement.NONE
  };
}