const HOVER_VIDEO_PLACEHOLDER_URL =
  "https://www.dropbox.com/scl/fi/jebmnvfppzm2ji3kkpghh/placeholder-video.mp4?rlkey=fcinbtky0vrf5abjnz11tprl4&st=ier1azcg&raw=1";
const GDRAGON_HOVER_VIDEO_URL =
  "https://www.dropbox.com/scl/fi/b8vg1909q9h3p8pejqbhf/hover.mp4?rlkey=6wlnkb5j2tky7k1o7z5vllkjt&st=qpb2sd94&raw=1";
const AURA_INVALIDES_HOVER_VIDEO_URL =
  "https://www.dropbox.com/scl/fi/xdqp099ebviefwcfllbth/hover.mp4?rlkey=w9ypd9jfkajbmz9tw29iwuhz6&st=ipygdu9z&raw=1";
const BILLIE_HOVER_VIDEO_URL =
  "https://www.dropbox.com/scl/fi/jjj9lb3x4axckepz1f7a7/hover.mp4?rlkey=atigso6bz8w8rhctvhtifi4hm&st=1f1ouy0d&raw=1";
const VILLE_DE_SOISSONS_HOVER_VIDEO_URL =
  "https://www.dropbox.com/scl/fi/1u6d27vglqg7r8gkjwi8x/hover.mp4?rlkey=aucn3zq9ati32rh6e8zemlwep&st=b8dk8u77&raw=1";

(() => {
  const previewVideos = document.querySelectorAll(".project-preview");

  previewVideos.forEach((video, index) => {
    if (index === 0) {
      video.src = GDRAGON_HOVER_VIDEO_URL;
    } else if (index === 1) {
      video.src = AURA_INVALIDES_HOVER_VIDEO_URL;
    } else if (index === 2) {
      video.src = BILLIE_HOVER_VIDEO_URL;
    } else if (index === 3) {
      video.src = VILLE_DE_SOISSONS_HOVER_VIDEO_URL;
    } else {
      video.src = HOVER_VIDEO_PLACEHOLDER_URL;
    }
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
