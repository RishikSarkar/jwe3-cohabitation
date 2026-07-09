const JWE3_DINO_BASE =
  "https://www.jurassicworldevolution.com/en-US/3/dinosaurs";

/** Official JWE3 species page — slug matches our canonical dinosaur `id`. */
export function jwe3DinosaurUrl(id: string): string {
  return `${JWE3_DINO_BASE}/${id}`;
}

export function openJwe3Dinosaur(id: string): void {
  window.open(jwe3DinosaurUrl(id), "_blank", "noopener,noreferrer");
}

export function isInteractiveRowTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest("button, input, label, a"));
}
