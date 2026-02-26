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

(() => {
  const drawer = document.querySelector("#mobile-drawer");
  const openButton = document.querySelector(".nav-toggle");
  const closeButton = document.querySelector(".mobile-drawer-close");

  if (!drawer || !openButton || !closeButton) return;

  const drawerLinks = drawer.querySelectorAll("a");
  const focusableSelector =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const mobileBreakpoint = window.matchMedia("(max-width: 600px)");

  let lastFocusedElement = null;
  let previousBodyOverflow = "";

  const isOpen = () => drawer.classList.contains("is-open");

  const getFocusableElements = () =>
    Array.from(drawer.querySelectorAll(focusableSelector)).filter(
      (element) => !element.hasAttribute("disabled")
    );

  const openDrawer = () => {
    if (!mobileBreakpoint.matches || isOpen()) return;

    lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    previousBodyOverflow = document.body.style.overflow;
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    openButton.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    closeButton.focus();
  };

  const closeDrawer = ({ restoreFocus = true } = {}) => {
    if (!isOpen()) return;

    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    openButton.setAttribute("aria-expanded", "false");
    document.body.style.overflow = previousBodyOverflow;
    previousBodyOverflow = "";

    if (restoreFocus && lastFocusedElement) {
      lastFocusedElement.focus();
    }
  };

  const trapFocus = (event) => {
    if (event.key !== "Tab" || !isOpen()) return;

    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) {
      event.preventDefault();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement;

    if (!drawer.contains(activeElement)) {
      event.preventDefault();
      firstElement.focus();
      return;
    }

    if (event.shiftKey && activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
      return;
    }

    if (!event.shiftKey && activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  openButton.addEventListener("click", openDrawer);
  closeButton.addEventListener("click", () => closeDrawer());

  drawerLinks.forEach((link) => {
    link.addEventListener("click", () => closeDrawer({ restoreFocus: false }));
  });

  document.addEventListener("keydown", (event) => {
    if (!isOpen()) return;

    if (event.key === "Escape") {
      event.preventDefault();
      closeDrawer();
      return;
    }

    trapFocus(event);
  });

  const handleBreakpointChange = (event) => {
    if (!event.matches) {
      closeDrawer({ restoreFocus: false });
    }
  };

  if (typeof mobileBreakpoint.addEventListener === "function") {
    mobileBreakpoint.addEventListener("change", handleBreakpointChange);
  } else if (typeof mobileBreakpoint.addListener === "function") {
    mobileBreakpoint.addListener(handleBreakpointChange);
  }
})();
