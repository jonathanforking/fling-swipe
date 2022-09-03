"use strict";(()=>{var w=Object.defineProperty;var d=Object.getOwnPropertySymbols;var E=Object.prototype.hasOwnProperty,L=Object.prototype.propertyIsEnumerable;var u=(s,t,e)=>t in s?w(s,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):s[t]=e,f=(s,t)=>{for(var e in t||={})E.call(t,e)&&u(s,e,t[e]);if(d)for(var e of d(t))L.call(t,e)&&u(s,e,t[e]);return s};function g(s,t,e,i,a){var o;s.swipeConfig=(o=s.swipeConfig)!=null?o:{options:{flingSpeed:.005,swipeDistance:.5,updateRate:5,horizontalLock:0,verticalLock:0},update:[],start:[],complete:[]};let n=s.swipeConfig;a&&(n.options=f(f({},n.options),a)),t&&(n.start=[...new Set(n.start.concat(t))]),e&&(n.update=[...new Set(n.update.concat(e))]),i&&(n.complete=[...new Set(n.complete.concat(i))]),s.swipeProgress={startX:0,startY:0,distance:0,flingDirection:2,lastUpdate:0,movement:2},s.addEventListener("touchstart",T,{passive:!0}),s.addEventListener("touchmove",v,{passive:!1}),s.addEventListener("touchend",b,{passive:!0})}function r(s,...t){for(let e=0,i=s.length;e<i;e++)s[e](...t)}function T(s){let t=s.currentTarget.swipeProgress;t.startX=s.touches[0].clientX,t.startY=s.touches[0].clientY,t.lastUpdate=s.timeStamp}function v(s){let t=s.currentTarget,e=t.swipeProgress;if(e.movement===1)return;let i=t.swipeConfig,a=i.options;if(e.movement===2){let n=Math.abs(s.touches[0].clientX-e.startX),o=Math.abs(s.touches[0].clientY-e.startY);n>o&&n>a.horizontalLock?(r(i.start,t,0),e.movement=0):o>n&&o>a.verticalLock&&(r(i.start,t,1),e.movement=1)}if(e.movement===0){s.preventDefault(),s.stopImmediatePropagation();let n=s.timeStamp-e.lastUpdate;if(n<a.updateRate)return;let o=(s.touches[0].clientX-e.startX)/window.innerWidth;Math.abs(o-e.distance)/n>=a.flingSpeed?e.flingDirection=o>e.distance?1:0:e.flingDirection=2,r(i.update,t,o),e.distance=o,e.lastUpdate=s.timeStamp}}function b(s){let t=s.currentTarget,e=t.swipeConfig,i=t.swipeProgress;switch(i.flingDirection){case 2:{i.distance>e.options.swipeDistance?r(e.complete,t,1,1):i.distance<-e.options.swipeDistance?r(e.complete,t,0,1):r(e.complete,t,2,2);break}case 1:{i.distance>0?r(e.complete,t,1,0):r(e.complete,t,2,2);break}case 0:{i.distance<0?r(e.complete,t,0,0):r(e.complete,t,2,2);break}}t.swipeProgress={startX:0,startY:0,distance:0,flingDirection:2,lastUpdate:0,movement:2}}var m=document.getElementById("swipeable"),c=m.children[0],l=m.children[1],p=m.children[2];function C(s,t){l.classList.remove("locked"),c.classList.remove("locked"),p.classList.remove("locked")}function N(s,t){let e=t*100;c.style.transform=`translateX(${-100+e}%)`,l.style.transform=`translateX(${0+e}%)`,p.style.transform=`translateX(${100+e}%)`}function h(s,t,e){switch(l.classList.add("locked"),t){case 0:l.style.transform="translateX(-100%)",p.classList.add("locked"),p.style.transform="translateX(0%)",c.style.removeProperty("transform");break;case 1:l.style.transform="translateX(100%)",c.classList.add("locked"),c.style.transform="translateX(0%)",p.style.removeProperty("transform");break;case 2:c.classList.add("locked"),p.classList.add("locked"),l.style.removeProperty("transform"),c.style.removeProperty("transform"),p.style.removeProperty("transform");break}}g(m,C,N,h);})();
