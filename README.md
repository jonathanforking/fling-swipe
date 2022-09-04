# General

fling-swipe is a small and self-contained typescript implementation of the 'swipe' gesture. It also features 'fling' support, which triggers registered callbacks when the finger movement meets a speed threshold (rather than distance).  

Note that this doesn't provide ready-to-use components, but a logical building block to create your own.

## Installation

```bash
npm i fling-swipe
```

## Usage

### Parameters

```ts
```

### Examples

#### Standalone

index.html
```html
<link rel="stylesheet" href="example.css">
<script src="example.js" defer></script>
<div id="swipeable">
  <div></div>
  <div></div>
  <div></div>
</div>
```

example.css
```css
html, body {
  margin: 0;
}

#swipeable {
  position: relative;
  overflow-x: hidden;
  width: 100vw;
  height: 200px;
}
#swipeable > div {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: auto;
}
#swipeable > div:nth-child(1) {
  background-color: red;
  transform: translateX(-100%);
}
#swipeable > div:nth-child(2) {
  background-color: green;
  transform: translateX(0%);
}
#swipeable > div:nth-child(3) {
  background-color: blue;
  transform: translateX(100%);
}

.locked {
  transition: transform 200ms linear;
}
```

example.ts
```ts
import { 
  addFlingSwipe, 
  SwipeableHTMLElement, 
  Movement, 
  Direction, 
  Gesture,
  Mode
} from 'fling-swipe';

// NOTE: in the real world you would obviously keep track and take into account
// the index of the currently displayed element and maybe shuffle around
// elements/img sources to allow for endless swiping

const target = document.getElementById('swipeable') as SwipeableHTMLElement;
const left = target.children[0] as HTMLElement;
const middle = target.children[1] as HTMLElement;
const right = target.children[2] as HTMLElement;

function init(src: SwipeableHTMLElement, movement: Movement) {
  middle.classList.remove('locked');
  left.classList.remove('locked');
  right.classList.remove('locked');
}

function move(src: SwipeableHTMLElement, distance: number) {
  const percent = distance*100;
  left.style['transform'] = `translateX(${-100+percent}%)`;
  middle.style['transform'] = `translateX(${0+percent}%)`;
  right.style['transform'] = `translateX(${100+percent}%)`;
}

function swipe(src: SwipeableHTMLElement, touchDirection: Direction, gesture: Gesture) {
  middle.classList.add('locked');
  switch (touchDirection) {
    case Direction.LEFT:
      middle.style['transform'] = 'translateX(-100%)';
      right.classList.add('locked');
      right.style['transform'] = 'translateX(0%)';
      left.style.removeProperty('transform');
      break;
    case Direction.RIGHT:
      middle.style['transform'] = 'translateX(100%)';
      left.classList.add('locked');
      left.style['transform'] = 'translateX(0%)';
      right.style.removeProperty('transform');
      break;
    case Direction.NONE:
      // Ensure that we snap back smoothly if no swipe condition was met
      left.classList.add('locked');
      right.classList.add('locked');
      middle.style.removeProperty('transform');
      left.style.removeProperty('transform');
      right.style.removeProperty('transform');
      break;
  }
}

addFlingSwipe(target, init, move, swipe, { mode: Mode.HORIZONTAL });
```

#### SPA support

The previous example doesn't use any SPA framework, but nothing stops you from doing something like this in react for example:
```tsx
import { addFlingSwipe, removeFlingSwipe } from 'fling-swipe';

function MyComponent() {
  const swipeable = useRef(null);

  useEffect(() => {
    addFlingSwipe(swipeable.current, /* your callbacks and options */);
    return () => {
      removeFlingSwipe(swipeable.current);
    };
  }, []);

  return (
    <div ref={swipeable}>
      {/* your swipeable content */}
    </div>
  );
}

```
