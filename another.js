gsap.registerPlugin(ScrollTrigger);

const panels = gsap.utils.toArray(".panel");
const wrap = document.querySelector(".panels");

let index = 0;
let lock = false;

function jumpTo(i, st) {
  i = gsap.utils.clamp(0, panels.length - 1, i);
  if (i === index) return;

  index = i;
  lock = true;

  // 1) FORCE the actual scroll position to the exact step
  const p = index / (panels.length - 1);                // snapped progress
  const y = st.start + (st.end - st.start) * p;         // snapped scrollY
  st.scroll(y);                                         // <-- this moves the scrollbar NOW

  // 2) Update the visual position (fast)
  gsap.to(wrap, {
    yPercent: -100 * index,
    duration: 0.18,
    ease: "power3.out",
    onComplete: () => {
      // small cooldown prevents multiple step jumps from one gesture
      gsap.delayedCall(0.5, () => (lock = false));
    }
  });
}

ScrollTrigger.create({
  trigger: ".scroller",
  start: "top top",
  end: () => "+=" + innerHeight * (panels.length - 1),
  pin: true,
  scrub: false,
  invalidateOnRefresh: true,

  onUpdate(self) {
    if (lock) return;

    const stepPos = self.progress * (panels.length - 1);

    // Any scroll down -> forces next section (ceil)
    // Any scroll up   -> forces prev section (floor)
    const next =
      self.direction === 1 ? Math.ceil(stepPos) : Math.floor(stepPos);

    jumpTo(next, self);
  },

  onRefresh(self) {
    // keep both scroll + view aligned on refresh
    gsap.set(wrap, { yPercent: -100 * index });
    const p = index / (panels.length - 1);
    self.scroll(self.start + (self.end - self.start) * p);
  }
});
