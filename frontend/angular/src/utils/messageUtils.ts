export function messageUtils(message: string, durationMs = 3000): void {
  let container = document.getElementById("__toast-container__");
  if (!container) {
    container = document.createElement("div");
    container.id = "__toast-container__";
    container.className = [
      "fixed",
      "top-4",
      "right-4",
      "z-[9999]", // changed
      "flex",
      "flex-col",
      "gap-3",
      "pointer-events-none",
      "font-mono",
    ].join(" ");
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = [
    "relative",
    "overflow-hidden",
    "flex",
    "items-center",
    "gap-3",

    // changed colors
    "bg-white",
    "text-[#1A1A1A]",
    "border-2",
    "border-black",
    "shadow-[4px_4px_0px_0px_#000]",

    "px-4",
    "py-3",
    "rounded-none",
    "max-w-xs",
    "text-xs",
    "font-bold",
    "uppercase",
    "tracking-wider",

    "pointer-events-auto",

    // slide from right instead of left
    "opacity-0",
    "translate-x-3",

    "transition-all",
    "duration-200",
    "ease-out",
  ].join(" ");

  const icon = document.createElement("div");
  icon.className = [
    "shrink-0",
    "w-[18px]",
    "h-[18px]",
    "rounded-none",
    "bg-[#2FD673]",
    "border",
    "border-black",
    "flex",
    "items-center",
    "justify-center",
  ].join(" ");

  icon.innerHTML = `
    <svg viewBox="0 0 10 10" class="w-2.5 h-2.5 fill-none stroke-black" stroke-width="2" stroke-linecap="square">
      <path d="M1 5l3 3 5-5" />
    </svg>`;

  const text = document.createElement("span");
  text.textContent = `// ${message}`;

  const progress = document.createElement("div");
  progress.className = [
    "absolute",
    "bottom-0",
    "left-0",
    "h-[4px]",
    "bg-[#2FD673]",
    "border-t",
    "border-black",
    "animate-shrink",
  ].join(" ");
  progress.style.animationDuration = `${durationMs}ms`;

  toast.append(icon, text, progress);
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove("opacity-0", "translate-x-3");
    toast.classList.add("opacity-100", "translate-x-0");
  });

  setTimeout(() => {
    toast.classList.remove("opacity-100", "translate-x-0");
    toast.classList.add("opacity-0", "translate-x-3");
    toast.addEventListener("transitionend", () => toast.remove(), {
      once: true,
    });
  }, durationMs);
}
