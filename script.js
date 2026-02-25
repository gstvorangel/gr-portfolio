const HOVER_VIDEO_PLACEHOLDER_URL =
  "https://www.dropbox.com/scl/fi/jebmnvfppzm2ji3kkpghh/placeholder-video.mp4?rlkey=fcinbtky0vrf5abjnz11tprl4&st=ier1azcg&raw=1";

(() => {
  const previewVideos = document.querySelectorAll(".project-preview");

  previewVideos.forEach((video) => {
    video.src = HOVER_VIDEO_PLACEHOLDER_URL;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "metadata";
  });

  const canHoverPreview = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!canHoverPreview) return;

  const cards = document.querySelectorAll(".project-card");

  cards.forEach((card) => {
    const video = card.querySelector(".project-preview");
    if (!video) return;

    const playPreview = () => {
      video.classList.add("is-visible");

      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {});
      }
    };

    const pausePreview = () => {
      video.classList.remove("is-visible");
      video.pause();
    };

    card.addEventListener("mouseenter", playPreview);
    card.addEventListener("mouseleave", pausePreview);
  });
})();
