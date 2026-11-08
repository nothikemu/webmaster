// Development-only page for reviewing artwork. Not part of the production build.
import { createRoot } from 'react-dom/client';
import '@/styles/tokens.css';
import '@/styles/base.css';
import { ArtDefs } from './Defs';
import { Harbor } from './Harbor';
import { Kernel } from './Kernel';
import { Icon } from './Icons';
import type { IconName } from './Icons';

const icons: IconName[] = ['arrow-right', 'arrow-left', 'check', 'x', 'lock', 'play', 'book', 'flask', 'compass', 'scroll', 'seal', 'sound-on', 'sound-off', 'menu', 'flag', 'warning', 'info', 'clock', 'target', 'key', 'shield', 'eye', 'external', 'chevron-down', 'reset', 'download', 'upload', 'map', 'wrench', 'search', 'chat', 'user'];

createRoot(document.getElementById('root')!).render(
  <div style={{ padding: 16 }}>
    <ArtDefs />
    <div style={{ width: 1280, height: 720, border: '2px solid #1b1612' }}>
      <Harbor className="" />
    </div>
    <div style={{ display: 'flex', gap: 24, marginTop: 24, alignItems: 'flex-end' }}>
      {(['idle', 'think', 'cheer', 'alert'] as const).map((m) => (
        <div key={m} style={{ width: 200 }}>
          <Kernel mood={m} label={`Kernel ${m}`} />
          <div>{m}</div>
        </div>
      ))}
    </div>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginTop: 24, fontSize: 36 }}>
      {icons.map((n) => (
        <div key={n} title={n} style={{ width: 56, textAlign: 'center' }}>
          <Icon name={n} />
          <div style={{ fontSize: 10 }}>{n}</div>
        </div>
      ))}
    </div>
  </div>,
);
