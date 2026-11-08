/** Tiny external store feeding the polite aria-live region. Messages are short and replace each other. */

type Listener = () => void;

let current = '';
let counter = 0;
const listeners = new Set<Listener>();

/** Announces `message` to assistive technology. A trailing counter-safe toggle forces re-reads. */
export function announce(message: string): void {
  counter += 1;
  current = counter % 2 === 0 ? message : message + String.fromCharCode(160);
  for (const l of listeners) l();
}

export function subscribeAnnouncements(listener: Listener): () => void {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

export function getAnnouncement(): string {
  return current;
}
