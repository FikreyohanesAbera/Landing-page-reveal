window.addEventListener("load", () => {
  const loaderCenter = document.querySelector(".loader-center");
  const heroImg = document.querySelector(".hero-img");

  // Place hero image EXACTLY on top of loader-center image
  function matchHeroToLoaderImage() {
    const r = loaderCenter.getBoundingClientRect();

    gsap.set(heroImg, {
      position: "absolute",
      left: r.left + window.scrollX,
      top: r.top + window.scrollY,
      width: r.width,
      height: r.height,
      opacity: 1
    });
  }

  const tl = gsap.timeline();

  tl.from(".box", { opacity: 0, y: 50, duration: 1, stagger: 0.1, ease: "back.out(1.7)" })
    .to(".img-div", { gap: "1vw", duration: 1, ease: "power2.out" })
    .to(".img-div", { scale: 1.25, duration: 1, ease: "power2.out" }, "<")
    .set(".box", { transformOrigin: "top center" })
    .to(".box:not(.is-center)", { scaleY: 0, duration: 0.6, ease: "power2.inOut", stagger: 0.05 })
    .to(".img-div", { scale: 3, duration: 1, ease: "power2.out" })

    // HANDOFF: freeze the hero image to the loader image location
    .add(() => {
      matchHeroToLoaderImage();
      // Prevent a "snap" if resize happens during fade:
      window.addEventListener("resize", matchHeroToLoaderImage);
    })

    .to(".loader", { autoAlpha: 0, duration: 0.35 }, "<0.05")

    // Reveal rest of page content
    .to(".page-content", { autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out" }, "<0.1")

    // Clean up loader
    .add(() => document.querySelector(".loader")?.remove());
});
  