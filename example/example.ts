import { addFlingSwipe, SwipeableHTMLElement, Movement, Direction, Gesture, Mode } from 'index';

// Maps order of CSS transforms to DIV elements inside swipeable 
const enum ChildIndex {
  LEFT,
  MIDDLE,
  RIGHT,
  TOP,
  BOTTOM
}

// Globals for convenience
let moveHorizontal = false;
let direction = Direction.NONE;
const colors = [
  [null, 'yellow', null],
  ['red', 'blue', 'green'],
  [null, 'turquoise', null]
];

function init(src: SwipeableHTMLElement, movement: Movement) {
  // 'locked' class smoothes element movement -> remove during user interaction
  for (const child of src.children) {
    child.classList.remove('locked');
  }
  moveHorizontal = movement === Movement.HORIZONTAL;
}

function move(src: SwipeableHTMLElement, distance: number) {
  const children = src.children as HTMLCollectionOf<HTMLElement>;
  const percent = distance*100;
  if (moveHorizontal) {
    children[ChildIndex.LEFT].style['transform'] = `translateX(${-100+percent}%)`;
    children[ChildIndex.MIDDLE].style['transform'] = `translateX(${0+percent}%)`;
    children[ChildIndex.RIGHT].style['transform'] = `translateX(${100+percent}%)`;
  } else {
    children[ChildIndex.TOP].style['transform'] = `translateY(${-100+percent}%)`;
    children[ChildIndex.MIDDLE].style['transform'] = `translateY(${0+percent}%)`;
    children[ChildIndex.BOTTOM].style['transform'] = `translateY(${100+percent}%)`;
  }
}

function swipe(src: SwipeableHTMLElement, touchDirection: Direction, gesture: Gesture) {
  direction = touchDirection;
  src.addEventListener('transitionend', elementShuffle, { once: true });
  const children = src.children as HTMLCollectionOf<HTMLElement>;
  // Add 'locked' classes again to ensure elements smoothly move to their new positions
  children[ChildIndex.MIDDLE].classList.add('locked');
  switch (touchDirection) {
    case Direction.LEFT:
      children[ChildIndex.RIGHT].classList.add('locked');
      children[ChildIndex.RIGHT].style['transform'] = 'translateX(0%)';
      children[ChildIndex.MIDDLE].style['transform'] = 'translateX(-100%)';
      children[ChildIndex.LEFT].style.removeProperty('transform');
      break;
    case Direction.RIGHT:
      children[ChildIndex.LEFT].classList.add('locked');
      children[ChildIndex.LEFT].style['transform'] = 'translateX(0%)';
      children[ChildIndex.MIDDLE].style['transform'] = 'translateX(100%)';
      children[ChildIndex.RIGHT].style.removeProperty('transform');
      break;
    case Direction.TOP:
      children[ChildIndex.BOTTOM].classList.add('locked');
      children[ChildIndex.BOTTOM].style['transform'] = 'translateY(0%)';
      children[ChildIndex.MIDDLE].style['transform'] = 'translateY(-100%)';
      children[ChildIndex.TOP].style.removeProperty('transform');
      break;
    case Direction.BOTTOM:
      children[ChildIndex.TOP].classList.add('locked');
      children[ChildIndex.TOP].style['transform'] = 'translateY(0%)';
      children[ChildIndex.MIDDLE].style['transform'] = 'translateY(100%)';
      children[ChildIndex.BOTTOM].style.removeProperty('transform');
      break;
    case Direction.NONE:
      for (const child of children) {
        child.classList.add('locked');
        child.style.removeProperty('transform');
      }
      break;
  }
}

function elementShuffle(e: TransitionEvent) {
  // color shuffle
  switch (direction) {
    case Direction.LEFT:
      colors[1].push(colors[1].shift()!);
      break;
    case Direction.RIGHT:
      colors[1].unshift(colors[1].pop()!);
      break;
    case Direction.TOP:
      colors[2][0] = colors[0][1];  // tmp
      colors[0][1] = colors[1][1];
      colors[1][1] = colors[2][1];
      colors[2].unshift(colors[2].pop()!);
      break;
    case Direction.BOTTOM:
      colors[0][0] = colors[2][1];  // tmp
      colors[2][1] = colors[1][1];
      colors[1][1] = colors[0][1];
      colors[0].unshift(colors[0].pop()!);
      break;
  }
  const parent = (e.target as HTMLElement).parentElement!;
  for (const child of (parent.children as HTMLCollectionOf<HTMLElement>)) {
    child.classList.remove('locked');
    child.style.removeProperty('transform');
  }
  applyColors(parent);
  // Double RAF necessary here to avoid rendering another transition
  requestAnimationFrame(() => requestAnimationFrame(() => {
    for (const child of (parent.children as HTMLCollectionOf<HTMLElement>)) {
      child.classList.add('locked');
    }
  }));
}

function applyColors(parent: HTMLElement) {
  const children = parent.children as HTMLCollectionOf<HTMLElement>;
  children[ChildIndex.TOP].style.setProperty('background-color', colors[0][1]);
  children[ChildIndex.LEFT].style.setProperty('background-color', colors[1][0]);
  children[ChildIndex.MIDDLE].style.setProperty('background-color', colors[1][1]);
  children[ChildIndex.RIGHT].style.setProperty('background-color', colors[1][2]);
  children[ChildIndex.BOTTOM].style.setProperty('background-color', colors[2][1]);
}

const target = document.getElementById('swipeable') as SwipeableHTMLElement;
applyColors(target);
addFlingSwipe(target, init, move, swipe, { mode: Mode.BOTH });