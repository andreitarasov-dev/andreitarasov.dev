// Keep the theme's visual interaction, with native button activation and guarded I/O.
function likedPages(): string[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem("likedPages") || "[]");
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function initArticleFooter(root: HTMLElement) {
  const button = root.querySelector<HTMLButtonElement>(".article-like-button")!;
  const counter = root.querySelector<HTMLElement>("[data-like-counter]")!;
  const status = root.querySelector<HTMLElement>('[role="status"]')!;
  const copy = root.querySelector<HTMLButtonElement>("[data-copy-link]")!;
  const pageId = button.dataset.pageId!;
  button.disabled = false;
  copy.disabled = false;
  let liked = likedPages().includes(pageId);
  let pending = false;
  let hold: ReturnType<typeof setTimeout> | undefined;
  let finish: ReturnType<typeof setTimeout> | undefined;
  let unsubscribe: (() => void) | undefined;
  let connection: Promise<Awaited<ReturnType<typeof connect>>> | undefined;

  function showLiked() {
    button.setAttribute("aria-pressed", "true");
    button.setAttribute("aria-label", "You liked this article");
    button.setAttribute("aria-disabled", "true");
    button.classList.add("phase-3");
  }
  if (liked) showLiked();

  async function connect() {
    const [{ database }, api] = await Promise.all([import("@sikorsky/site/lib/firebase.ts"), import("firebase/database")]);
    if (!database) throw new Error("Likes unavailable");
    const reference = api.ref(database, `likes/${pageId}`);
    unsubscribe = api.onValue(
      reference,
      (snapshot) => {
        const value: unknown = snapshot.val();
        counter.textContent = typeof value === "number" && Number.isFinite(value) ? String(value) : "0";
      },
      () => {
        counter.textContent = "—";
      }
    );
    return { api, reference };
  }
  function load() {
    return (connection ??= connect().catch((error) => {
      connection = undefined;
      throw error;
    }));
  }
  function cancel() {
    clearTimeout(hold);
    if (!pending && !liked) button.classList.remove("phase-1", "phase-2");
  }
  async function activate() {
    if (liked || pending) return;
    clearTimeout(hold);
    pending = true;
    button.setAttribute("aria-busy", "true");
    button.classList.add("phase-1", "phase-2");
    status.classList.toggle("is-visible", !navigator.onLine);
    status.textContent = navigator.onLine ? "Saving your like." : "Waiting for a connection to save your like.";
    // Firebase queues offline writes. Keep this activation locked until its
    // promise settles, rather than retrying and incrementing the count twice.
    const waiting = setTimeout(() => {
      status.classList.add("is-visible");
      status.textContent = "Still waiting to save your like. Check your connection.";
      button.setAttribute("aria-label", "Saving your like; waiting for a connection");
    }, 8000);
    try {
      const { api, reference } = await load();
      await api.set(reference, api.increment(1));
      liked = true;
      try {
        localStorage.setItem("likedPages", JSON.stringify([...new Set([...likedPages(), pageId])]));
      } catch {
        /* In-memory state still prevents repeat activation. */
      }
      button.setAttribute("aria-pressed", "true");
      button.setAttribute("aria-disabled", "true");
      status.classList.remove("is-visible");
      status.textContent = "Thanks for liking this article.";
      finish = setTimeout(showLiked, 880);
    } catch {
      button.classList.remove("phase-1", "phase-2", "phase-3");
      status.classList.add("is-visible");
      button.setAttribute("aria-label", "Like this article");
      status.textContent = "Could not save your like. Please try again.";
    } finally {
      clearTimeout(waiting);
      pending = false;
      button.removeAttribute("aria-busy");
    }
  }
  function start() {
    if (liked || pending) return;
    clearTimeout(hold);
    button.classList.add("phase-1");
    hold = setTimeout(() => void activate(), 1600);
  }
  button.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "mouse") start();
  });
  button.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "mouse") start();
  });
  button.addEventListener("pointerleave", cancel);
  button.addEventListener("pointerup", cancel);
  button.addEventListener("pointercancel", cancel);
  button.addEventListener("blur", cancel);
  // Native clicks cover Enter, Space, assistive technology, and short taps.
  button.addEventListener("click", () => void activate());
  copy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(copy.dataset.url!);
      copy.textContent = "Copied!";
      status.textContent = "Article link copied.";
    } catch {
      copy.textContent = "Copy failed — try again";
      status.textContent = "Could not copy the link. You can copy the address shown beside this button.";
    }
  });
  const observer =
    "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
              observer?.disconnect();
              void load().catch(() => {
                counter.textContent = "—";
              });
            }
          },
          { rootMargin: "400px" }
        )
      : undefined;
  observer?.observe(root);
  window.addEventListener("pagehide", (event) => {
    cancel();
    if (event.persisted) return;
    clearTimeout(finish);
    observer?.disconnect();
    unsubscribe?.();
  });
}
