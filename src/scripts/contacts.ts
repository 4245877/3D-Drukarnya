/** Native anchors always navigate, even if this enhancement is unavailable. */
export function initContacts() {
  const support = document.querySelector<HTMLElement>('[data-viber-support]');
  const close = support?.querySelector<HTMLButtonElement>('[data-viber-close]');
  let trigger: HTMLAnchorElement | null = null;

  const dismiss = () => {
    if (!support) return;
    // Restore focus only when dismissing from inside the help panel.
    if (support.contains(document.activeElement)) trigger?.focus();
    support.hidden = true;
  };

  document.querySelectorAll<HTMLAnchorElement>('[data-viber-link]').forEach((link) => {
    link.addEventListener('click', (event) => {
      // Preserve browser commands such as opening a link in a new tab.
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      if (support) {
        trigger = link;
        support.hidden = false;
        if (event.detail === 0) support.focus({ preventScroll: true });
      }
      // Do not preventDefault: the OS must receive the Viber URI immediately.
    });
  });
  close?.addEventListener('click', dismiss);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') dismiss();
  });

  document.querySelectorAll<HTMLButtonElement>('[data-contact-copy]').forEach((button) => {
    button.hidden = false;
    button.addEventListener('click', async () => {
      const group = button.closest('[data-contact-actions]');
      const status = group?.querySelector<HTMLElement>('[data-contact-status]');
      const manual = group?.querySelector<HTMLInputElement | HTMLTextAreaElement>('[data-contact-manual]');
      try {
        if (!navigator.clipboard) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(button.dataset.contactCopy ?? '');
        if (manual) manual.hidden = true;
        if (status) status.textContent = button.dataset.contactCopySuccess ?? 'Скопійовано. Встав у повідомлення в обраному месенджері.';
      } catch {
        if (manual) {
          manual.hidden = false;
          manual.focus();
          manual.select();
        }
        if (status) status.textContent = 'Скопіюй виділений текст вручну.';
      }
    });
  });
}
