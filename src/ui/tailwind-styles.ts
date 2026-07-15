type StyleRule = readonly [selector: string, classes: string];

export const tailwindRules: StyleRule[] = [
  ['body', 'm-0 overflow-x-hidden bg-[var(--bg)] font-sans text-base text-[var(--ink)] transition-colors duration-200 overscroll-y-none'],
  ['svg.lucide', 'inline-block size-5 shrink-0 align-[-0.15em] stroke-2'],
  ['.habit-emoji svg.lucide', 'size-6 text-[var(--primary)]'],
  ['.exp-emoji svg.lucide', 'size-[21px] text-[var(--primary)]'],
  ['.cat-cell svg.lucide,.emoji-opt svg.lucide', 'size-[22px]'],
  ['.chip svg.lucide', 'mr-0.5 size-[15px]'],
  ['.row-ic svg.lucide', 'size-5 text-[var(--primary)]'],
  ['.emoji-opt.on svg.lucide', 'text-[var(--primary)]'],
  ['.tabbar svg.lucide', 'size-[22px]'],
  ['.login-logo svg.lucide', 'size-[52px] text-[var(--primary)] stroke-[2.2]'],
  ['.pin-emoji svg.lucide', 'size-11 text-[#f8faed]'],
  ['.badge svg.lucide', 'block size-[15px] shrink-0'],
  ['.pill svg.lucide', 'size-[13px]'],
  ['.pill-flame svg.lucide', 'text-[var(--primary)]'],
  ['.habit-check svg.lucide', 'size-5 stroke-[3]'],
  ['.btn-small svg.lucide', 'size-3.5'],
  ['.exp-del svg.lucide,.exp-edit svg.lucide,.task-edit svg.lucide,.capture-done svg.lucide,.capture-del svg.lucide', 'size-4'],
  ['.btn-primary svg.lucide', 'size-4'],
  ['.pin-pad svg.lucide', 'size-6'],
  ['#app', 'mx-auto min-h-dvh max-w-[520px] px-4 pb-[90px] pt-[calc(env(safe-area-inset-top,0px)+8px)]'],
  ['.app-header', 'flex items-center justify-between px-0.5 py-2.5'],
  ['.app-header h1', 'm-0 text-[1.35rem] font-bold tracking-[-0.02em]'],
  ['.app-header p', 'mt-0.5 text-sm'],
  ['.header-badges', 'flex shrink-0 items-center justify-end'],
  ['.badge', 'inline-flex min-h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-[var(--ink)] px-3 py-1.5 text-sm font-bold leading-none text-[var(--card)] shadow-[var(--shadow)]'],
  ['.muted', 'text-[var(--muted)]'], ['.small', 'text-xs'], ['.center', 'text-center'],
  ['.section-title', 'mx-0.5 mb-2.5 mt-5 text-base font-bold tracking-[-0.01em]'],
  ['.row-between', 'flex items-center justify-between'], ['.col-gap', 'flex flex-col gap-2.5'],
  ['.card', 'mb-2.5 rounded-[18px] border border-[var(--line)] bg-[var(--card)] p-3.5 shadow-[var(--shadow)]'],
  ['.summary-row', 'my-2 flex gap-3'], ['.summary-card', 'flex-1 rounded-[18px] p-4 text-[#f8faed] shadow-[var(--shadow)]'],
  ['.summary-num', 'text-2xl font-extrabold tracking-[-0.02em]'], ['.summary-label', 'mt-0.5 text-xs opacity-85'],
  ['.grad-a,.grad-c', 'bg-[linear-gradient(135deg,#50a65c,#3e8a4a)]'], ['.grad-b,.grad-d', 'bg-[linear-gradient(135deg,#232323,#3b3b3b)]'],
  ['.capture-input-row', 'flex gap-2'],
  ['.capture-input-row input', 'min-w-0 flex-1 appearance-none rounded-xl border-2 border-[var(--line)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--primary)]'],
  ['.capture-save-btn,.ai-fill-btn', 'flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border-0 bg-[linear-gradient(135deg,#50a65c,#3e8a4a)] text-[#f8faed]'],
  ['.capture-row', 'flex items-start gap-2 border-t border-[var(--line)] py-2.5 first:border-t-0'], ['.capture-body', 'min-w-0 flex-1'],
  ['.capture-text', 'text-sm font-semibold'], ['.capture-ai', 'mt-1 flex items-center gap-1 text-xs text-[var(--muted)] [&.error]:text-[#b42318]'],
  ['.capture-retry', 'cursor-pointer border-0 bg-transparent px-0.5 font-bold text-inherit underline'],
  ['.capture-done,.capture-del,.task-edit,.exp-edit,.exp-del', 'shrink-0 cursor-pointer border-0 bg-transparent p-1 text-[var(--muted)] opacity-60'],
  ['.task-list,.habit-list,.expense-list', 'flex flex-col gap-2.5'],
  ['.task-row,.habit-row,.exp-row,.setting-row', 'flex items-center gap-2.5 rounded-[14px] border border-[var(--line)] bg-[var(--card)] px-3 py-2.5 shadow-[var(--shadow)]'],
  ['.task-row', '[&.overdue]:border-[#b42318] [&.done]:opacity-[.65] [&.done_.task-title]:line-through'],
  ['.task-check', 'flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-[var(--primary)] bg-transparent text-white [.done_&]:bg-[var(--primary)]'],
  ['.task-body,.habit-info,.exp-info', 'min-w-0 flex-1'], ['.task-title,.habit-name,.exp-cat', 'text-sm font-bold'],
  ['.task-meta,.habit-sub,.exp-note,.setting-row_.sub', 'text-xs text-[var(--muted)]'], ['.task-row.overdue .task-meta', 'font-bold text-[#b42318]'],
  ['.habit-row', 'gap-3 rounded-[18px] px-3.5 py-3 transition active:scale-[0.98] [&.done]:border-[var(--primary)] [&.done]:bg-[linear-gradient(135deg,var(--done-a),var(--done-b))]'],
  ['.habit-emoji', 'flex size-[46px] shrink-0 items-center justify-center rounded-[14px] bg-[var(--chip)] text-[var(--primary)]'],
  ['.habit-sub', 'flex flex-wrap items-center gap-1'], ['.habit-sub svg.lucide', 'size-[11px]'],
  ['.habit-check', 'flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full border-[3px] border-[var(--line)] bg-[var(--card)] text-transparent [&.on]:border-[var(--primary)] [&.on]:bg-[var(--primary)] [&.on]:text-[#f8faed]'],
  ['.qty-controls', 'flex shrink-0 items-center gap-2'], ['.qty-controls button', 'size-[34px] cursor-pointer rounded-full border-0 bg-[var(--primary)] text-lg font-bold text-[#f8faed]'],
  ['.qty-controls button.minus', 'bg-[var(--line)] text-[var(--ink)]'], ['.qty-val', 'min-w-[46px] text-center text-sm font-extrabold'],
  ['.habit-card', 'mb-2.5 cursor-pointer rounded-[18px] border border-[var(--line)] bg-[var(--card)] p-3.5 shadow-[var(--shadow)]'],
  ['.habit-card-top', 'flex items-center gap-3'], ['.streak-pills', 'mt-2.5 flex flex-wrap gap-2'],
  ['.pill', 'inline-flex items-center gap-1 rounded-full bg-[var(--chip)] px-2.5 py-1 text-xs font-semibold'],
  ['.heatmap', 'my-3 grid auto-flow-col grid-rows-[repeat(7,12px)] gap-[3px] overflow-x-auto pb-1'], ['.heatmap i', 'size-3 rounded-[3px] bg-[var(--line)]'],
  ['.heatmap i.l1', 'bg-[#bbddb4]'], ['.heatmap i.l2', 'bg-[#8ac488]'], ['.heatmap i.l3', 'bg-[#50a65c]'], ['.heatmap i.l4', 'bg-[#2f6e3b]'],
  ['.ai-quickfill', 'mb-3.5 flex gap-2'], ['.ai-quickfill input[type=text]', 'mb-0 w-auto min-w-0 flex-1'], ['.ai-fill-btn:disabled', 'cursor-default opacity-60'], ['.ai-fill-btn.loading svg', 'animate-[spin_.9s_linear_infinite]'],
  ['.quick-expense input[type=number]', 'w-full border-0 bg-transparent text-3xl font-extrabold text-[var(--ink)] outline-none'],
  ['.amount-row', 'flex items-center gap-1.5 border-b-2 border-[var(--line)] pb-1.5'], ['.rupee', 'text-2xl font-extrabold text-[var(--primary)]'],
  ['.chip-row', 'my-3 flex flex-wrap gap-2'], ['.chip', 'inline-flex cursor-pointer items-center gap-1 rounded-full border-2 border-transparent bg-[var(--bg)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)] [&.on]:border-[var(--primary)] [&.on]:bg-[var(--chip)] [&.on]:text-[var(--primary-2)]'],
  ['.cat-grid', 'my-2.5 grid grid-cols-4 gap-2'], ['.cat-cell', 'flex cursor-pointer flex-col items-center gap-1 rounded-[14px] border-2 border-transparent bg-[var(--bg)] px-0.5 py-2.5 text-center text-[0.65rem] font-semibold text-[var(--muted)] [&.on]:border-[var(--primary)] [&.on]:bg-[var(--chip)] [&.on]:text-[var(--primary-2)]'],
  ['.quick-expense input[type=text],.quick-expense input[type=date]', 'mb-2.5 w-full appearance-none rounded-xl border-0 bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--ink)] outline-none'],
  ['.exp-emoji,.row-ic', 'flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--chip)] text-[var(--primary)]'], ['.exp-note', 'truncate'], ['.exp-amt', 'shrink-0 whitespace-nowrap font-extrabold'],
  ['.search-input', 'my-2 w-full appearance-none rounded-xl border-2 border-[var(--line)] bg-[var(--card)] px-3.5 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--primary)]'],
  ['.budget-item', 'mb-2 rounded-[14px] border border-[var(--line)] bg-[var(--card)] px-3.5 py-2.5 shadow-[var(--shadow)]'], ['.budget-top', 'mb-1.5 flex items-center justify-between gap-2 text-sm font-semibold'],
  ['.row-ic-inline', 'flex min-w-0 flex-1 items-center gap-1.5'], ['.row-ic-inline svg.lucide', 'size-4 shrink-0 text-[var(--primary)]'], ['.row-ic-inline .txt', 'truncate'], ['.budget-amt', 'shrink-0 whitespace-nowrap text-xs'],
  ['.budget-bar', 'h-2.5 overflow-hidden rounded-full bg-[var(--bg)]'], ['.budget-fill', 'h-full rounded-full bg-[var(--primary)] transition-[width] [&.warn]:bg-[#c99a3e] [&.over]:bg-[var(--red)]'],
  ['.seg', 'my-2 flex rounded-full bg-[var(--line)] p-1'], ['.seg button', 'flex-1 cursor-pointer rounded-full border-0 bg-transparent p-2 text-xs font-bold text-[var(--muted)] [&.on]:bg-[var(--card)] [&.on]:text-[var(--primary-2)] [&.on]:shadow-sm'],
  ['.btn-primary', 'w-full cursor-pointer rounded-2xl border-0 bg-[linear-gradient(135deg,#50a65c,#3e8a4a)] p-3.5 font-extrabold text-[#f8faed] shadow-[0_6px_16px_rgba(80,166,92,.35)] active:scale-[0.97]'],
  ['.btn-small', 'inline-flex cursor-pointer items-center justify-center gap-1 rounded-full border-0 bg-[var(--chip)] px-3.5 py-2 text-xs font-bold text-[var(--primary-2)] [&.danger]:bg-[rgba(185,92,80,.15)] [&.danger]:text-[var(--red)]'],
  ['.btn-icon', 'px-2.5 py-2'],
  ['.tabbar', 'fixed inset-x-0 bottom-0 mx-auto flex max-w-[520px] rounded-t-[20px] border-t border-[var(--line)] bg-[var(--glass)] pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-md'],
  ['.tabbar button', 'flex flex-1 cursor-pointer flex-col items-center gap-1 border-0 bg-transparent py-2 text-[0.65rem] font-bold text-[var(--muted)] [&.on]:text-[var(--primary-2)]'],
  ['.overlay', 'fixed inset-0 z-50 flex items-center justify-center bg-[rgba(35,35,35,.55)] p-5 backdrop-blur-sm'],
  ['.modal-box', 'max-h-[82vh] w-full max-w-[420px] overflow-y-auto rounded-[22px] border border-[var(--line)] bg-[var(--card)] p-5 text-[var(--ink)]'],
  ['.modal-box h3', 'mb-3.5 text-lg font-bold'], ['.modal-box label', 'mb-1 mt-3 block text-xs font-bold text-[var(--muted)]'],
  ['.modal-box input,.modal-box select', 'w-full rounded-xl border-2 border-[var(--line)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--primary)]'],
  ['.emoji-row', 'mt-1 flex flex-wrap gap-1.5'], ['.emoji-opt', 'inline-flex cursor-pointer rounded-[10px] border-2 border-transparent bg-[var(--bg)] p-2 [&.on]:border-[var(--primary)] [&.on]:bg-[var(--chip)]'],
  ['.day-row', 'mt-1 flex gap-1'], ['.day-opt', 'flex-1 cursor-pointer rounded-[10px] border-2 border-transparent bg-[var(--bg)] py-2 text-center text-xs font-bold [&.on]:border-[var(--primary)] [&.on]:bg-[var(--chip)] [&.on]:text-[var(--primary-2)]'],
  ['.modal-actions', 'mt-4.5 flex gap-2.5'], ['.modal-actions .btn-primary', 'flex-[2]'], ['.modal-actions .btn-small', 'flex-1'],
  ['#loginScreen', 'bg-[linear-gradient(165deg,#50a65c,#2f6e3b)]'], ['.login-box', 'w-full max-w-[380px] rounded-[26px] bg-[var(--card)] p-6 text-center text-[var(--ink)]'],
  ['.login-box h1', 'mb-0.5 mt-2 tracking-[-0.02em]'], ['.login-box .btn-primary', 'mt-4'],
  ['.login-box input', 'mt-2.5 w-full rounded-[14px] border-2 border-[var(--line)] bg-[var(--bg)] p-3 text-[var(--ink)] outline-none'], ['.login-error', 'min-h-4 text-xs text-[var(--red)]'],
  ['#pinScreen', 'bg-[#232323]'], ['.pin-box', 'text-center text-[#f8faed]'], ['.pin-dots', 'my-5 flex justify-center gap-3.5'], ['.pin-dots span', 'size-4 rounded-full border-2 border-[#50a65c] [&.fill]:bg-[#50a65c]'],
  ['.pin-pad', 'grid grid-cols-[repeat(3,72px)] justify-center gap-3.5'], ['.pin-pad button', 'size-[72px] cursor-pointer rounded-full border-0 bg-[rgba(248,250,237,.1)] text-2xl font-bold text-[#f8faed] active:bg-[rgba(80,166,92,.5)]'],
  ['.link-btn', 'mt-5 cursor-pointer border-0 bg-transparent text-sm text-[#9ac49f] underline'],
  ['#fab', 'fixed bottom-[calc(env(safe-area-inset-bottom,0px)+78px)] right-[18px] z-40 flex size-[58px] cursor-pointer items-center justify-center rounded-full border-0 bg-[linear-gradient(135deg,#50a65c,#3e8a4a)] text-[#f8faed] shadow-[0_6px_20px_rgba(47,110,59,.45)] active:scale-90 min-[560px]:right-[calc(50%-242px)]'],
  ['#fab svg.lucide', 'size-[26px] stroke-[2.4]'],
  ['.sheet-overlay', 'items-end p-0'], ['.sheet', 'mx-auto max-h-[88dvh] w-full max-w-[520px] overflow-y-auto rounded-t-[24px] border border-b-0 border-[var(--line)] bg-[var(--card)] px-[18px] pb-[calc(env(safe-area-inset-bottom,0px)+18px)] pt-2.5 animate-[slide-up_.25s_ease]'],
  ['.sheet-handle', 'mx-auto mb-3 mt-1 h-[5px] w-[42px] rounded-full bg-[var(--line)]'], ['.sheet-title', 'mb-2.5 text-base font-bold'],
  ['.confirm-ic', 'mx-auto mb-3 flex size-[52px] items-center justify-center rounded-full bg-[rgba(185,92,80,.14)]'], ['.confirm-ic svg.lucide', 'size-6 text-[var(--red)]'],
  ['.confirm-msg', 'mb-1.5 text-center text-base font-semibold'], ['.btn-danger', '!bg-[var(--red)] !shadow-[0_6px_16px_rgba(185,92,80,.35)]'],
  ['.toast', 'fixed bottom-24 left-1/2 z-[90] -translate-x-1/2 whitespace-nowrap rounded-full bg-[var(--ink)] px-5 py-2.5 text-sm font-semibold text-[var(--card)] shadow-xl animate-[pop_.25s_ease]'],
  ['#confetti', 'pointer-events-none fixed inset-0 z-[99]'], ['.setting-row', 'mb-2 px-3.5 py-2.5'], ['.setting-row .grow', 'min-w-0 flex-1 text-sm font-semibold'],
  ['.setting-row .grow.truncate', 'truncate'], ['.setting-row b', 'shrink-0 whitespace-nowrap'], ['.chart-caption', 'mb-1.5'],
];

function apply(root: ParentNode): void {
  for (const [selector, classes] of tailwindRules) {
    root.querySelectorAll<HTMLElement>(selector).forEach(element => element.classList.add(...classes.split(/\s+/)));
  }
}

/** Re-apply all Tailwind rules to the full document body.
 *  Call this after lucide.createIcons() so freshly-created SVGs receive their size classes. */
export function applyTailwindStyles(root: ParentNode = document.body): void {
  apply(root);
}

export function installTailwindStyles(root: Document): void {
  apply(root);
  new MutationObserver(records => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node instanceof HTMLElement) {
          apply(node);
          for (const [selector, classes] of tailwindRules) {
            if (node.matches(selector)) node.classList.add(...classes.split(/\s+/));
          }
        }
      }
    }
  }).observe(root.body, { childList: true, subtree: true });
}
