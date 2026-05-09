/** Иконка подсказки: при наведении показывает нативный tooltip (`title`). */
export function ReportHint({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-zinc-600/70 bg-zinc-900/80 text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
      title={label}
      aria-label={label}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-3.5 w-3.5"
        aria-hidden
      >
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
          clipRule="evenodd"
        />
      </svg>
    </button>
  )
}
