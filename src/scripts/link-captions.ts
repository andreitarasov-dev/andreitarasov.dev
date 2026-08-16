/**
 * Makes a `.link-caption-wrapper` clickable as a whole, so a click anywhere in
 * the wrapper (including on the caption) activates the link it contains.
 * Respects modifier-clicks and `target="_blank"`, and skips `.disabled-link`.
 */
export function initLinkCaptions(): void {
  const wrappers = document.querySelectorAll<HTMLElement>(".link-caption-wrapper");

  wrappers.forEach((wrapper) => {
    const link = wrapper.querySelector("a");
    const caption = wrapper.querySelector(".caption");

    wrapper.addEventListener("click", (e: MouseEvent) => {
      e.preventDefault();

      if (link && !link.classList.contains("disabled-link")) {
        if (e.metaKey || e.ctrlKey) {
          window.open(link.href, "_blank");
        } else if (link.target === "_blank") {
          window.open(link.href, "_blank");
        } else {
          window.location.href = link.href;
        }
      }
    });

    caption?.addEventListener("keydown", (event) => {
      if (
        (event as KeyboardEvent).key === "Enter" &&
        link &&
        !link.classList.contains("disabled-link")
      ) {
        event.preventDefault();
        link.click();
      }
    });
  });
}
