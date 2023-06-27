export function isElectron() {
  if (
    typeof window !== "undefined" &&
    typeof window.process === "object" &&
    (window as any).process.type === "renderer"
  ) {
    return true;
  }

  if (
    typeof process !== "undefined" &&
    typeof process.versions === "object" &&
    !!process.versions.electron
  ) {
    return true;
  }

  if (
    typeof navigator === "object" &&
    typeof navigator.userAgent === "string" &&
    /electron/i.test(navigator.userAgent)
  ) {
    return true;
  }

  return false;
}
