/* The site header: out of the way while reading down, back as soon as the visitor scrolls up.
   Used by every page except History, which has its own copy of the same behaviour. */
(function () {
  'use strict';
  const mast = document.querySelector('.mast');
  if (!mast || document.body.classList.contains('hx')) return;
  const setH = () => document.documentElement.style.setProperty('--mast-h', mast.offsetHeight + 'px');
  setH(); addEventListener('resize', setH); addEventListener('load', setH);
  let lastY = scrollY, turn = scrollY, dir = 0;
  addEventListener('scroll', () => {
    const y = scrollY, nd = Math.sign(y - lastY);
    if (nd && nd !== dir) { dir = nd; turn = lastY; }           // direction changed: measure the new run from here
    if (y < 120) document.body.classList.remove('mast-away');
    else if (dir > 0 && y - turn > 24) document.body.classList.add('mast-away');
    else if (dir < 0 && turn - y > 10) document.body.classList.remove('mast-away');
    lastY = y;
  }, { passive: true });
})();
