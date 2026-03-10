const MOBILE_VIDEO_SELECTOR = ".tileVideo";
const MOBILE_AUTOPLAY_THRESHOLD = 0.6;
const LENIS_LERP = 0.1;
const REVEAL_THRESHOLD = 0.2;
const REVEAL_STAGGER_MS = 80;

(() => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const revealBlocks = Array.from(document.querySelectorAll("[data-reveal]"));
  const revealGroups = Array.from(document.querySelectorAll("[data-reveal-group]"));

  if (
    prefersReducedMotion.matches ||
    typeof window.IntersectionObserver !== "function" ||
    (revealBlocks.length === 0 && revealGroups.length === 0)
  ) {
    document.documentElement.classList.remove("has-reveal-motion");
    return;
  }

  revealGroups.forEach((group) => {
    const tiles = Array.from(group.querySelectorAll("[data-reveal-tile]"));

    tiles.forEach((tile, index) => {
      tile.style.setProperty("--reveal-delay", `${(index * REVEAL_STAGGER_MS) / 1000}s`);
    });
  });

  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const { target } = entry;

        if (target.hasAttribute("data-reveal-group")) {
          const tiles = target.querySelectorAll("[data-reveal-tile]");
          tiles.forEach((tile) => tile.classList.add("is-revealed"));
        } else {
          target.classList.add("is-revealed");
        }

        observer.unobserve(target);
      });
    },
    {
      threshold: REVEAL_THRESHOLD,
    }
  );

  revealBlocks.forEach((block) => revealObserver.observe(block));
  revealGroups.forEach((group) => revealObserver.observe(group));
})();

(() => {
  if (typeof window === "undefined" || typeof window.Lenis !== "function") return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const coarsePointer = window.matchMedia("(pointer: coarse)");
  const noHover = window.matchMedia("(hover: none)");
  const touchCapable = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const shouldDisableLenis = prefersReducedMotion.matches || coarsePointer.matches || noHover.matches || touchCapable;

  if (shouldDisableLenis) return;

  const lenis = new window.Lenis({
    lerp: LENIS_LERP,
    smoothWheel: true,
    smoothTouch: false,
    autoRaf: false,
    anchors: true,
  });

  let rafId = null;
  const raf = (time) => {
    lenis.raf(time);
    rafId = window.requestAnimationFrame(raf);
  };
  rafId = window.requestAnimationFrame(raf);

  const cleanup = () => {
    if (rafId !== null) {
      window.cancelAnimationFrame(rafId);
      rafId = null;
    }
    lenis.destroy();
  };

  window.addEventListener("pagehide", cleanup, { once: true });
})();

(() => {
  const previewVideos = Array.from(document.querySelectorAll(MOBILE_VIDEO_SELECTOR));
  if (previewVideos.length === 0) return;
  const coarsePointerQuery = window.matchMedia("(pointer: coarse)");

  previewVideos.forEach((video) => {
    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "none";
  });

  const ensureVideoSourcesLoaded = (video) => {
    if (video.dataset.sourcesLoaded === "true") return true;

    const { srcWebm, srcMp4 } = video.dataset;
    if (!srcWebm && !srcMp4) return false;

    if (srcWebm) {
      const webmSource = document.createElement("source");
      webmSource.src = srcWebm;
      webmSource.type = "video/webm";
      video.append(webmSource);
    }

    if (srcMp4) {
      const mp4Source = document.createElement("source");
      mp4Source.src = srcMp4;
      mp4Source.type = "video/mp4";
      video.append(mp4Source);
    }

    video.dataset.sourcesLoaded = "true";
    video.load();
    return true;
  };

  const pausePreview = (video) => {
    if (!video) return;
    video.pause();
    video.classList.remove("is-visible");
  };

  const playPreview = (video) => {
    if (!video || video.dataset.autoplayBlocked === "true") return;
    if (!ensureVideoSourcesLoaded(video)) return;

    video.classList.add("is-visible");

    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        if (coarsePointerQuery.matches) {
          video.dataset.autoplayBlocked = "true";
        }
        pausePreview(video);
      });
    }
  };

  if (!coarsePointerQuery.matches) {
    const cards = document.querySelectorAll(".project-card");

    cards.forEach((card) => {
      const video = card.querySelector(MOBILE_VIDEO_SELECTOR);
      if (!video) return;

      card.addEventListener("mouseenter", () => playPreview(video));
      card.addEventListener("mouseleave", () => pausePreview(video));
    });

    return;
  }

  if (typeof window.IntersectionObserver !== "function") return;

  const visibilityRatios = new Map(previewVideos.map((video) => [video, 0]));
  let currentPlayingVideo = null;

  const syncMostVisibleVideo = () => {
    let bestVideo = null;
    let bestRatio = 0;

    visibilityRatios.forEach((ratio, video) => {
      if (video.dataset.autoplayBlocked === "true") return;
      if (ratio > bestRatio) {
        bestRatio = ratio;
        bestVideo = video;
      }
    });

    if (bestRatio < MOBILE_AUTOPLAY_THRESHOLD) {
      bestVideo = null;
    }

    previewVideos.forEach((video) => {
      if (video !== bestVideo) {
        pausePreview(video);
      }
    });

    if (bestVideo === currentPlayingVideo) return;

    currentPlayingVideo = bestVideo;
    if (currentPlayingVideo) {
      playPreview(currentPlayingVideo);
    }
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        visibilityRatios.set(entry.target, entry.isIntersecting ? entry.intersectionRatio : 0);
      });

      syncMostVisibleVideo();
    },
    {
      threshold: [0, 0.25, 0.5, 0.75, 1],
      rootMargin: "0px 0px -20% 0px",
    }
  );

  previewVideos.forEach((video) => observer.observe(video));

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      pausePreview(currentPlayingVideo);
      currentPlayingVideo = null;
      return;
    }

    syncMostVisibleVideo();
  });
})();
