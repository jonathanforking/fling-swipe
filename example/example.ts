import { addFlingSwipe, SwipeableHTMLElement, Direction } from 'index';

// NOTE: in the real world you would obviously keep track and take into account
// the index of the currently displayed element and maybe shuffle around
// elements/img sources to allow for endless swiping

const target = document.getElementById('swipeable') as SwipeableHTMLElement;
// Could also read these from 'src' parameter
const left = target.children[0] as HTMLElement;
const middle = target.children[1] as HTMLElement;
const right = target.children[2] as HTMLElement;

function swipe(src: SwipeableHTMLElement, touchDirection: Direction) {
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

function move(src: SwipeableHTMLElement, distance: number) {
  middle.classList.remove('locked');
  left.classList.remove('locked');
  right.classList.remove('locked');
  const percent = distance*100;
  left.style['transform'] = `translateX(${-100+percent}%)`;
  middle.style['transform'] = `translateX(${0+percent}%)`;
  right.style['transform'] = `translateX(${100+percent}%)`;
}

addFlingSwipe(target, swipe, move);