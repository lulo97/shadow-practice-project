export function messageUtils(message: string, durationMs = 3000): void {
  let container = document.getElementById('__toast-container__');
  if (!container) {
    container = document.createElement('div');
    container.id = '__toast-container__';
    container.className = [
      'fixed', 'top-4', 'right-4', 'z-[9999]', // changed
      'flex', 'flex-col', 'gap-2', 'pointer-events-none',
    ].join(' ');
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = [
    'relative', 'overflow-hidden',
    'flex', 'items-center', 'gap-2.5',

    // changed colors
    'bg-white', 'text-black',

    'px-4', 'py-3', 'rounded-lg', 'shadow-lg',
    'max-w-xs', 'text-sm', 'leading-snug',

    'pointer-events-auto',

    // slide from right instead of left
    'opacity-0', 'translate-x-3',

    'transition-all', 'duration-200', 'ease-out',
  ].join(' ');

  const icon = document.createElement('div');
  icon.className = [
    'shrink-0', 'w-[18px]', 'h-[18px]', 'rounded-full',
    'bg-blue-500', 'flex', 'items-center', 'justify-center',
  ].join(' ');

  icon.innerHTML = `
    <svg viewBox="0 0 10 10" class="w-2.5 h-2.5 fill-white">
      <path d="M1 5l3 3 5-5" stroke="white" stroke-width="1.5"
            fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;

  const text = document.createElement('span');
  text.textContent = message;

  const progress = document.createElement('div');
  progress.className = [
    'absolute', 'bottom-0', 'left-0', 'h-[3px]',
    'bg-blue-500', 'rounded-bl-lg',
    'animate-shrink',
  ].join(' ');
  progress.style.animationDuration = `${durationMs}ms`;

  toast.append(icon, text, progress);
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove('opacity-0', 'translate-x-3');
    toast.classList.add('opacity-100', 'translate-x-0');
  });

  setTimeout(() => {
    toast.classList.remove('opacity-100', 'translate-x-0');
    toast.classList.add('opacity-0', 'translate-x-3');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  }, durationMs);
}