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
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const drawerCloseFallbackMs = 800;

  let lastFocusedElement = null;
  let previousBodyOverflow = "";
  let previousBodyTouchAction = "";
  let closeTransitionFallbackId = null;
  let closeTransitionHandler = null;
  let openAnimationFrameId = null;

  const isOpen = () => drawer.classList.contains("is-open");
  const isClosing = () => drawer.classList.contains("is-closing");

  const clearCloseTransitionWait = () => {
    if (closeTransitionHandler) {
      drawer.removeEventListener("transitionend", closeTransitionHandler);
      closeTransitionHandler = null;
    }

    if (closeTransitionFallbackId !== null) {
      window.clearTimeout(closeTransitionFallbackId);
      closeTransitionFallbackId = null;
    }
  };

  const lockBodyScroll = () => {
    if (!document.body.classList.contains("menu-open")) {
      previousBodyOverflow = document.body.style.overflow;
      previousBodyTouchAction = document.body.style.touchAction;
    }

    document.body.classList.add("menu-open");
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
  };

  const unlockBodyScroll = () => {
    if (!document.body.classList.contains("menu-open")) return;

    document.body.classList.remove("menu-open");
    document.body.style.overflow = previousBodyOverflow;
    document.body.style.touchAction = previousBodyTouchAction;
    previousBodyOverflow = "";
    previousBodyTouchAction = "";
  };

  const setDrawerClosed = ({ restoreFocus }) => {
    drawer.classList.remove("is-closing");
    drawer.hidden = true;
    drawer.setAttribute("aria-hidden", "true");
    openButton.setAttribute("aria-expanded", "false");
    unlockBodyScroll();

    if (restoreFocus && lastFocusedElement) {
      lastFocusedElement.focus();
    }

    lastFocusedElement = null;
  };

  const getFocusableElements = () =>
    Array.from(drawer.querySelectorAll(focusableSelector)).filter(
      (element) => !element.hasAttribute("disabled")
    );

  const openDrawer = () => {
    if (!mobileBreakpoint.matches || isOpen()) return;

    clearCloseTransitionWait();
    if (openAnimationFrameId !== null) {
      window.cancelAnimationFrame(openAnimationFrameId);
      openAnimationFrameId = null;
    }

    lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    drawer.hidden = false;
    drawer.classList.remove("is-closing");
    drawer.setAttribute("aria-hidden", "false");
    openButton.setAttribute("aria-expanded", "true");
    lockBodyScroll();

    openAnimationFrameId = window.requestAnimationFrame(() => {
      drawer.classList.add("is-open");
      closeButton.focus();
      openAnimationFrameId = null;
    });
  };

  const closeDrawer = ({ restoreFocus = true, immediate = false } = {}) => {
    if (!isOpen() && !isClosing()) return;

    if (openAnimationFrameId !== null) {
      window.cancelAnimationFrame(openAnimationFrameId);
      openAnimationFrameId = null;
    }

    clearCloseTransitionWait();
    drawer.classList.remove("is-open");
    drawer.classList.add("is-closing");
    drawer.setAttribute("aria-hidden", "true");
    openButton.setAttribute("aria-expanded", "false");

    if (immediate || prefersReducedMotion.matches) {
      setDrawerClosed({ restoreFocus });
      return;
    }

    closeTransitionHandler = (event) => {
      if (event.target !== drawer || event.propertyName !== "opacity") return;
      clearCloseTransitionWait();
      setDrawerClosed({ restoreFocus });
    };

    drawer.addEventListener("transitionend", closeTransitionHandler);
    closeTransitionFallbackId = window.setTimeout(() => {
      clearCloseTransitionWait();
      setDrawerClosed({ restoreFocus });
    }, drawerCloseFallbackMs);
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
      closeDrawer({ restoreFocus: false, immediate: true });
    }
  };

  drawer.hidden = true;
  drawer.classList.remove("is-open", "is-closing");
  drawer.setAttribute("aria-hidden", "true");
  openButton.setAttribute("aria-expanded", "false");
  unlockBodyScroll();

  if (typeof mobileBreakpoint.addEventListener === "function") {
    mobileBreakpoint.addEventListener("change", handleBreakpointChange);
  } else if (typeof mobileBreakpoint.addListener === "function") {
    mobileBreakpoint.addListener(handleBreakpointChange);
  }
})();
