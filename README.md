# General

fling-swipe is a small and self-contained typescript implementation of the 'swipe' gesture. It also features 'fling' support, which triggers registered callbacks when the finger movement meets a speed threshold (rather than distance).  

Note that this package doesn't provide ready-to-use components, but a logical building block to create your own.

## Installation

```bash
npm i fling-swipe
```

## Usage

There are 2 functions provided in this library, `addFlingSwipe` sets up gesture options and callbacks on an HTML element, while `removeFlingSwipe` deletes them. The examples below show their basic usage, but for better understanding it is recommended to take a look at the type definitions at the start of [index.ts](/src/index.ts) as well.

### Standalone example

example.ts
```ts
import { 
  addFlingSwipe, 
  SwipeableHTMLElement, 
  Movement, 
  Direction, 
  Gesture
} from 'fling-swipe';

// NOTE: in the real world you would keep track of and take into account
// the index of the currently displayed element so you can shuffle around
// displayed data/elements to allow for endless swiping and virtualization

const target = document.getElementById('swipeable') as SwipeableHTMLElement;
const left = target.children[0] as HTMLElement;
const middle = target.children[1] as HTMLElement;
const right = target.children[2] as HTMLElement;

function init(src: SwipeableHTMLElement, movement: Movement) {
  // 'locked' class smoothes element movement -> remove during user interaction
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
  // Add 'locked' classes to ensure elements smoothly move to their new positions
  middle.classList.add('locked');
  // Note that the 'touchDirection' is opposite to the element we want to switch to
  // -> e.g. if the thumb moves left, we scroll to the right hand side
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
      left.classList.add('locked');
      right.classList.add('locked');
      middle.style.removeProperty('transform');
      left.style.removeProperty('transform');
      right.style.removeProperty('transform');
      break;
  }
}

addFlingSwipe(target, init, move, swipe);
```

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

A more complicated example with 2-way scrolling & endless swiping can be found [here](/example/).

### SPA support

Since this package doesn't use any dependencies it is framework-agnostic. Nothing stops you from doing something like this in react for example:
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
