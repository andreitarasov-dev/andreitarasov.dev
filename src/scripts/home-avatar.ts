interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
}

/**
 * Animates the home page avatar into the nav logo as the user scrolls.
 * No-ops on any page other than "/", or if the required elements are missing.
 */
export function initHomeAvatar(): void {
  if (window.location.pathname !== "/") return;

  const avatar = document.getElementById("avatar");
  const title = document.getElementById("title");
  const logoImg = document.querySelector<HTMLImageElement>("#logo img");

  if (!avatar || !title || !logoImg) {
    console.warn("[home] Missing required elements:", {
      avatar: !!avatar,
      title: !!title,
      logoImg: !!logoImg
    });
    return;
  }

  // Flags
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const clamp = (v: number, min: number, max: number): number => Math.max(min, Math.min(max, v));
  const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
  // Slight ease for a smoother feel
  const ease = (t: number): number => t * (2 - t); // easeOutQuad
  const getDocTop = (el: HTMLElement): number => el.getBoundingClientRect().top + window.scrollY;

  // Prepare avatar for stable transforms
  avatar.style.transformOrigin = "top left";
  avatar.style.willChange = "transform, top, left, width, height, opacity";

  // Defer enabling transitions to avoid first-paint flashes
  logoImg.style.transition = "none";
  avatar.style.transition = "none";

  // Placeholder to avoid layout shift when avatar becomes fixed
  let placeholder: HTMLDivElement | null = null;
  // Base rect captured at the start of animation (p just above 0). Using a stable
  // reference prevents the apparent “parabolic” path caused by mixing a moving
  // placeholder rect with a changing transform.
  let baseSourceRect: Rect | null = null;
  function makePlaceholderFrom(el: HTMLElement): HTMLDivElement {
    const rect = el.getBoundingClientRect();
    const p = document.createElement("div");
    // Match element’s box size as rendered (without margins)
    p.style.width = rect.width + "px";
    p.style.height = rect.height + "px";
    // Use block to reliably reserve vertical space for images
    const cs = getComputedStyle(el);
    p.style.display = "block";
    p.style.marginTop = cs.marginTop;
    p.style.marginRight = cs.marginRight;
    p.style.marginBottom = cs.marginBottom;
    p.style.marginLeft = cs.marginLeft;
    // Ensure it doesn’t draw anything visually
    p.style.border = "0";
    p.style.padding = "0";
    p.style.background = "transparent";
    return p;
  }
  const ensurePlaceholder = () => {
    if (!placeholder) {
      placeholder = makePlaceholderFrom(avatar);
      avatar.parentElement?.insertBefore(placeholder, avatar);
    }
  };
  function removePlaceholder() {
    if (placeholder && placeholder.parentElement) {
      placeholder.parentElement.removeChild(placeholder);
    }
    placeholder = null;
  }
  const captureBaseSourceRect = () => {
    const r = avatar.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) {
      baseSourceRect = {
        top: r.top,
        left: r.left,
        width: r.width,
        height: r.height,
        right: r.right,
        bottom: r.bottom
      };
    }
  };

  let rafId = 0;
  // Handoff state to avoid flicker near completion
  let isHandedOff = false;
  let cleanupTimeoutId = 0;
  const COMPLETE_IN = 0.999; // enter handoff when p >= this
  const COMPLETE_OUT = 0.995; // leave handoff when p <= this

  const computeProgress = () => {
    // Start at document top
    const startY = 0;
    // End when title top reaches viewport top
    const endY = getDocTop(title);
    const total = Math.max(1, endY - startY);
    const pRaw = (window.scrollY - startY) / total;
    const p = clamp(pRaw, 0, 1);
    return { p };
  };

  const update = () => {
    rafId = 0;
    const { p } = computeProgress();

    // Compute target rect each frame from current layout
    const targetRect = logoImg.getBoundingClientRect();

    const cleanupFixedPositioning = () => {
      // Prevent double cleanup
      if (cleanupTimeoutId === -1) return;
      avatar.style.position = "";
      avatar.style.top = "";
      avatar.style.left = "";
      avatar.style.width = "";
      avatar.style.height = "";
      avatar.style.transform = "";
      avatar.style.zIndex = "";
      removePlaceholder();
      cleanupTimeoutId = -1;
    };

    const scheduleCleanupAfterFade = () => {
      if (cleanupTimeoutId > 0 || cleanupTimeoutId === -1) return; // already scheduled or cleaned
      const onEnd = (e: TransitionEvent) => {
        if (e && e.propertyName && e.propertyName !== "opacity") return;
        avatar.removeEventListener("transitionend", onEnd);
        cleanupFixedPositioning();
      };
      avatar.addEventListener("transitionend", onEnd);
      cleanupTimeoutId = window.setTimeout(() => {
        avatar.removeEventListener("transitionend", onEnd);
        cleanupFixedPositioning();
      }, 220);
    };

    if (p <= 0) {
      // Not animating: restore normal flow and visibility
      avatar.style.position = "";
      avatar.style.top = "";
      avatar.style.left = "";
      avatar.style.width = "";
      avatar.style.height = "";
      avatar.style.transform = "";
      avatar.style.zIndex = "";
      avatar.style.pointerEvents = "";

      // Avatar visible at top; nav logo hidden while on home
      avatar.style.opacity = "1";
      logoImg.style.opacity = "0";

      removePlaceholder();
      // Reset handoff state and pending cleanups
      isHandedOff = false;
      if (cleanupTimeoutId > 0) {
        clearTimeout(cleanupTimeoutId);
      }
      cleanupTimeoutId = 0;
      // Update base rect at top so subsequent movement uses a fixed origin
      captureBaseSourceRect();
      return;
    }

    // 0 < p < COMPLETE_OUT or exiting handoff: actively animate toward the nav logo
    if (!isHandedOff || p <= COMPLETE_OUT) {
      // If we were in handedOff and p dropped below threshold, revert
      if (isHandedOff && p <= COMPLETE_OUT) {
        isHandedOff = false;
        // Cancel any scheduled cleanup if still pending
        if (cleanupTimeoutId > 0) {
          clearTimeout(cleanupTimeoutId);
          cleanupTimeoutId = 0;
        }
      }
      if (prefersReducedMotion) {
        // No transforms; keep avatar in normal flow and just manage visibility
        avatar.style.position = "";
        avatar.style.top = "";
        avatar.style.left = "";
        avatar.style.width = "";
        avatar.style.height = "";
        avatar.style.transform = "";
        avatar.style.zIndex = "";
        // During the range, avatar visible, logo hidden
        avatar.style.opacity = "1";
        logoImg.style.opacity = "0";
        avatar.style.pointerEvents = "auto";
      } else {
        // Guard: if avatar hasn't resolved its size yet (image not loaded), avoid fixing/transforms
        const naturalRect = avatar.getBoundingClientRect();
        if (naturalRect.width < 1 || naturalRect.height < 1) {
          avatar.style.position = "";
          avatar.style.top = "";
          avatar.style.left = "";
          avatar.style.width = "";
          avatar.style.height = "";
          avatar.style.transform = "";
          avatar.style.zIndex = "";
          avatar.style.opacity = "1";
          logoImg.style.opacity = "0";
          avatar.style.pointerEvents = "auto";
          removePlaceholder();
          return;
        }
        // Ensure we have a stable base rect (captured when at top). If missing
        // (e.g., on hard reload mid-scroll), capture once from current rect.
        if (!baseSourceRect) captureBaseSourceRect();
        ensurePlaceholder();

        // Use the stable base rect as the fixed origin to keep a linear path in viewport space
        const sourceRect = baseSourceRect!;

        // Pin avatar at its source rect in viewport coords
        avatar.style.position = "fixed";
        avatar.style.top = sourceRect.top + "px";
        avatar.style.left = sourceRect.left + "px";
        avatar.style.width = sourceRect.width + "px";
        avatar.style.height = sourceRect.height + "px";

        // Linear-in-space interpolation using centers to avoid parabolic path
        const fullScale = targetRect.width / Math.max(1, sourceRect.width);
        const pe = ease(p);
        const scaleNow = lerp(1, fullScale, pe);

        // Centers
        const c0x = sourceRect.left + sourceRect.width / 2;
        const c0y = sourceRect.top + sourceRect.height / 2;
        const c1x = targetRect.left + targetRect.width / 2;
        const c1y = targetRect.top + targetRect.height / 2;
        const cx = lerp(c0x, c1x, pe);
        const cy = lerp(c0y, c1y, pe);

        // Desired top-left at this scale so that center is exactly on the line
        const topLeftNowX = cx - (scaleNow * sourceRect.width) / 2;
        const topLeftNowY = cy - (scaleNow * sourceRect.height) / 2;

        // Translate from the fixed source top-left to the desired top-left
        const tx = topLeftNowX - sourceRect.left;
        const ty = topLeftNowY - sourceRect.top;

        avatar.style.transform = `translate(${tx}px, ${ty}px) scale(${scaleNow})`;

        // Stacking and visibility during animation
        avatar.style.zIndex = "2147483647";
        avatar.style.opacity = "1";
        logoImg.style.opacity = "0";
        avatar.style.pointerEvents = "auto";
      }
      return;
    }

    // p >= COMPLETE_IN and not animating: handoff to navbar logo with hysteresis
    if (!isHandedOff && p >= COMPLETE_IN) {
      // Ensure the avatar is exactly aligned with target just before fade
      if (!prefersReducedMotion) {
        ensurePlaceholder();
        // Use stable base rect for final snap
        if (!baseSourceRect) captureBaseSourceRect();
        const sourceRect = baseSourceRect!;
        avatar.style.position = "fixed";
        avatar.style.top = sourceRect.top + "px";
        avatar.style.left = sourceRect.left + "px";
        avatar.style.width = sourceRect.width + "px";
        avatar.style.height = sourceRect.height + "px";
        const fullScale = targetRect.width / Math.max(1, sourceRect.width);
        const dx = targetRect.left - sourceRect.left;
        const dy = targetRect.top - sourceRect.top;
        avatar.style.transform = `translate(${dx}px, ${dy}px) scale(${fullScale})`;
        avatar.style.zIndex = "2147483647";
      } else {
        // No transform path; keep flow
        avatar.style.position = "";
        avatar.style.transform = "";
        avatar.style.zIndex = "";
      }
      // Crossfade
      logoImg.style.opacity = "1";
      avatar.style.opacity = "0";
      avatar.style.pointerEvents = "none";
      // Mark handed off and schedule cleanup after fade completes
      isHandedOff = true;
      if (!prefersReducedMotion) {
        scheduleCleanupAfterFade();
      }
      return;
    }

    // If already handed off, maintain visibility states (cleanup may already have run)
    logoImg.style.opacity = "1";
    avatar.style.opacity = "0";
    avatar.style.pointerEvents = "none";
    // No further action
  };

  function onScroll() {
    if (!rafId) rafId = requestAnimationFrame(update);
  }
  function onResize() {
    baseSourceRect = null;
    update();
  }
  function onVisibilityChange() {
    if (!document.hidden) update();
  }

  // Initial paint without transitions, then enable them
  update();
  requestAnimationFrame(() => {
    logoImg.style.transition = prefersReducedMotion ? "none" : "opacity 140ms linear";
    avatar.style.transition = prefersReducedMotion ? "none" : "opacity 140ms linear";
  });
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize);
  document.addEventListener("visibilitychange", onVisibilityChange);

  // Cleanup on page unload/navigation to prevent leaks
  window.addEventListener(
    "pagehide",
    () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    },
    { once: true }
  );
}
