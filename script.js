const MOBILE_VIDEO_SELECTOR = ".tileVideo";
const MOBILE_AUTOPLAY_THRESHOLD = 0.6;

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
