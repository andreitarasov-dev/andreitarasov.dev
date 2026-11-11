import { resolveProgress } from "../lib/summerside/progress";
import type { ProgressAnchor, StageId } from "../lib/summerside/types";
export function initStoryRoute(root: HTMLElement): () => void {
  const route = root.querySelector<HTMLElement>("[data-story-route]");
  if (!route) return () => {};
  const header = document.querySelector<HTMLElement>("nav.header");
  const syncHeader = () => {
    if (header) route.style.setProperty("--story-header-height", `${header.getBoundingClientRect().height}px`);
  };
  const headerObserver = new ResizeObserver(syncHeader);
  if (header) headerObserver.observe(header);
  syncHeader();
  const sections = [...root.querySelectorAll<HTMLElement>("[data-story-section]")];
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  // The generated Mercator paths contain only M/L commands. Reveal a prefix
  // directly instead of SVG dashes, which fragment these dense paths in WebKit.
  const paths = new Map(
    [...route.querySelectorAll<SVGPathElement>("[data-route-path]")].map((path) => {
      const full = path.getAttribute("d")!;
      const points = full
        .slice(1)
        .split("L")
        .map((pair) => pair.split(",").map(Number));
      // Slice the original string at cached command boundaries instead of serializing every point.
      const offsets = [...full.matchAll(/L/g)].map((match) => match.index!);
      let total = 0;
      const distances = points.map((point, i) => {
        if (i) total += Math.hypot(point[0] - points[i - 1][0], point[1] - points[i - 1][1]);
        return total;
      });
      const geometry = { points, distances, total, full, offsets, lastProgress: -1, lastReduced: false };
      return [path, geometry] as const;
    })
  );
  let frame = 0;
  const update = () => {
    frame = 0;
    const anchors: ProgressAnchor[] = sections.map((s) => ({ stage: Number(s.dataset.anchorStage) as StageId, sectionId: s.id, top: s.getBoundingClientRect().top + scrollY, progress: Number(s.dataset.anchorProgress) }));
    const readingLine = Math.max(innerHeight * 0.35, route.getBoundingClientRect().top < 100 && innerWidth < 1280 ? route.getBoundingClientRect().bottom + 16 : 0);
    const state = resolveProgress(anchors, scrollY + readingLine);
    route.dataset.currentStage = String(state.stage);
    route.dataset.progress = String(state.progress);
    route.querySelector<HTMLElement>("[data-route-label]")!.textContent = sections.find((s) => s.id === state.sectionId)?.dataset.anchorLabel || "Kaliningrad";
    route.querySelector<HTMLElement>("[data-route-percent]")!.textContent = motion.matches ? "" : `${Math.round(state.progress * 100)}%`;
    route.querySelectorAll<HTMLElement>("[data-stage]").forEach((stage) => {
      stage.hidden = Number(stage.dataset.stage) !== state.stage;
      if (stage.hidden) return;
      stage.querySelectorAll<SVGPathElement>("[data-route-path]").forEach((path) => {
        const compact = path.closest("svg")!.classList.contains("route-compact");
        if (compact !== innerWidth < 1280) return;
        const geometry = paths.get(path)!;
        if (geometry.lastProgress === state.progress && geometry.lastReduced === motion.matches) return;
        geometry.lastProgress = state.progress;
        geometry.lastReduced = motion.matches;
        const { points, distances, total, full, offsets } = geometry;
        const target = total * state.progress;
        let end = points.length - 1;
        for (let i = 1; i < points.length; i++) {
          if (distances[i] >= target) {
            end = i;
            break;
          }
        }
        const fraction = (target - distances[end - 1]) / (distances[end] - distances[end - 1] || 1);
        const point = points[end].map((value, axis) => points[end - 1][axis] + (value - points[end - 1][axis]) * fraction);
        path.setAttribute("d", motion.matches ? full : `${full.slice(0, offsets[end - 1])}L${point.join(",")}`);
        const marker = path.parentElement!.querySelector<SVGCircleElement>("[data-route-marker]")!;
        marker.style.display = motion.matches ? "none" : "";
        marker.setAttribute("cx", String(point[0]));
        marker.setAttribute("cy", String(point[1]));
      });
    });
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  const observer = new ResizeObserver(schedule);
  observer.observe(root);
  addEventListener("scroll", schedule, { passive: true });
  addEventListener("resize", schedule);
  addEventListener("pageshow", schedule);
  motion.addEventListener("change", schedule);
  root.addEventListener("load", schedule, true);
  route.hidden = false;
  document.fonts.ready.then(schedule);
  schedule();
  return () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    headerObserver.disconnect();
    removeEventListener("scroll", schedule);
    removeEventListener("resize", schedule);
    removeEventListener("pageshow", schedule);
    motion.removeEventListener("change", schedule);
    root.removeEventListener("load", schedule, true);
  };
}
