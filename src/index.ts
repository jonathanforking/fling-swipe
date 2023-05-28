export const enum Movement {
  HORIZONTAL,
  VERTICAL,
  NONE
}

export const enum Direction {
  TOP,
  RIGHT,
  BOTTOM,
  LEFT,
  NONE
}

export const enum Gesture {
  FLING,
  SWIPE,
  NONE
}

export const enum Mode {
  HORIZONTAL = Movement.HORIZONTAL,
  VERTICAL = Movement.VERTICAL,
  BOTH
}

export type StartCallback = (element: SwipeableHTMLElement, movement: Movement) => any;

export type UpdateCallback = (element: SwipeableHTMLElement, touchDistance: number) => any;

export type CompleteCallback = (element: SwipeableHTMLElement, touchDirection: Direction, gesture: Gesture) => any;

export interface Options {
  /** What movements should be considered (default is Mode.HORIZONTAL) */
  mode: Mode,
  /** Horizontal speed threshold (in screen % traveled per ms) that needs to be crossed
   * immediately before ending touch for it to count as a 'fling' (default is 0.0025 = 0.25%) */
  flingSpeedHor: number,
  /** Vertical speed threshold (in screen % traveled per ms) that needs to be crossed
   * immediately before ending touch for it to count as a 'fling' (default is 0.001 = 0.1%) */
  flingSpeedVer: number,
  /** Horizontal touch travel distance (in screen %) to count as a swipe (default is 0.5 = 50%) */
  swipeDistanceHor: number,
  /** Vertical touch travel distance (in screen %) to count as a swipe (default is 0.5 = 50%) */
  swipeDistanceVer: number,
  /** Milliseconds that need to elapse between touchMove updates (default is 5) */
  updateRate: number,
  /** Touch travel distance (in pixels) before locking to X axis / swipe (default is 0) */
  lockHor: number,
  /** Touch travel distance (in pixels) before locking to Y axis / scroll (default is 0) */
  lockVer: number
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
      mode: Mode.HORIZONTAL,
      flingSpeedHor: 0.0025,
      flingSpeedVer: 0.001,
      swipeDistanceHor: 0.5,
      swipeDistanceVer: 0.5,
      updateRate: 5,
      lockHor: 0,
      lockVer: 0
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
  switch (config.options.mode) {
    case Mode.HORIZONTAL:
      element.style.touchAction = 'pan-y pinch-zoom';
      break;
    case Mode.VERTICAL:
      element.style.touchAction = 'pan-x pinch-zoom';
      break;
    case Mode.BOTH:
      element.style.touchAction = 'pinch-zoom';
      break;
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
    element.style.removeProperty('touch-action');
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
  const config = target.swipeConfig!;
  const options = config.options;
  const xDist = e.touches[0].clientX - progress.startX;
  const yDist = e.touches[0].clientY - progress.startY;
  if (progress.movement === Movement.NONE) {
    // TODO: evaluate vector based movement detection
    // const movX = progress.startX + e.touches[0].clientX;
    // const movY = progress.startY + e.touches[0].clientY;
    // const mag = Math.sqrt(movX**2 + movY**2);
    // const deg = (Math.atan2(movY, movX) * 180 / Math.PI + 360) % 360;
    const xAbsDist = Math.abs(xDist);
    const yAbsDist = Math.abs(yDist);
    if (xAbsDist > yAbsDist && xAbsDist > options.lockHor) {
      processCallbacks(config.start, target, Movement.HORIZONTAL);
      progress.movement = Movement.HORIZONTAL;
    } else if (yAbsDist > xAbsDist && yAbsDist > options.lockVer) {
      processCallbacks(config.start, target, Movement.VERTICAL);
      progress.movement = Movement.VERTICAL;
    }
  } else if (options.mode === (progress.movement as unknown as Mode) || options.mode === Mode.BOTH) {
    // progress.movement can only be HORIZONTAL or VERTICAL here, both of which have equivalent Modes
    // -> this makes the cast above okay. The condition is necessary to ensure we only cancel events
    // when we are certain that we don't mess with the browsers native event handling
    e.preventDefault();
    e.stopImmediatePropagation();
    const timePassed = e.timeStamp - progress.lastUpdate;
    if (timePassed < options.updateRate) {
      return;
    }
    const newDist = progress.movement === Movement.HORIZONTAL
      ? xDist / window.innerWidth
      : yDist / window.innerHeight;
    const speed = Math.abs(newDist - progress.distance) / timePassed;
    if (progress.movement === Movement.HORIZONTAL && speed >= options.flingSpeedHor) {
      progress.flingDirection = newDist > progress.distance
        ? Direction.RIGHT
        : Direction.LEFT;
    } else if (progress.movement === Movement.VERTICAL && speed >= options.flingSpeedVer) {
      progress.flingDirection = newDist > progress.distance
        ? Direction.BOTTOM
        : Direction.TOP;
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
  const GREATER = progress.movement === Movement.HORIZONTAL ? Direction.RIGHT : Direction.BOTTOM;
  const SMALLER = progress.movement === Movement.HORIZONTAL ? Direction.LEFT : Direction.TOP;
  switch (progress.flingDirection) {
    case Direction.NONE:
    {
      // Check for swipe
      if (progress.movement === Movement.HORIZONTAL) {
        if (progress.distance > config.options.swipeDistanceHor) {
          processCallbacks(config.complete, target, GREATER, Gesture.SWIPE);
        } else if (progress.distance < -config.options.swipeDistanceHor) {
          processCallbacks(config.complete, target, SMALLER, Gesture.SWIPE);
        } else {
          processCallbacks(config.complete, target, Direction.NONE, Gesture.NONE);
        }
      } else if (progress.movement === Movement.VERTICAL) {
        if (progress.distance > config.options.swipeDistanceVer) {
          processCallbacks(config.complete, target, GREATER, Gesture.SWIPE);
        } else if (progress.distance < -config.options.swipeDistanceVer) {
          processCallbacks(config.complete, target, SMALLER, Gesture.SWIPE);
        } else {
          processCallbacks(config.complete, target, Direction.NONE, Gesture.NONE);
        }
      }
      break;
    }
    case Direction.RIGHT:
    case Direction.BOTTOM:
    {
      if (progress.distance > 0) {
        processCallbacks(config.complete, target, GREATER, Gesture.FLING);
      } else {
        processCallbacks(config.complete, target, Direction.NONE, Gesture.NONE);
      }
      break;
    }
    case Direction.LEFT:
    case Direction.TOP:
    {
      if (progress.distance < 0) {
        processCallbacks(config.complete, target, SMALLER, Gesture.FLING);
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