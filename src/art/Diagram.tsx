import type { Visual } from '@/content/types';
import { Icon } from './Icons';

/**
 * One renderer for every lesson visual, so diagrams all share the same inked look. It draws the figure's contents only;
 * the framed plate and the numbered caption come from <Figure>, which wraps it.
 */
export function Diagram({ visual }: { visual: Visual }) {
  switch (visual.kind) {
    case 'flow':
      return (
        <ol className="dia-flow">
          {visual.steps.map((s, i) => (
            <li key={i} className="dia-flow__step">
              <span className="dia-box">
                <span className="dia-box__no num" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <strong>{s.label}</strong>
                {s.note ? <span className="dia-note">{s.note}</span> : null}
              </span>
              {i < visual.steps.length - 1 ? <Icon name="arrow-right" className="dia-arrow" /> : null}
            </li>
          ))}
        </ol>
      );
    case 'compare':
      return (
        <div className="dia-compare">
          {[visual.left, visual.right].map((side, i) => (
            <div key={i} className={`dia-col dia-col--${i ? 'b' : 'a'}`}>
              <h3>{side.title}</h3>
              <ul>
                {side.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      );
    case 'layers': {
      const W = 460;
      const H = 220;
      const maxN = Math.max(...visual.sizes);
      const xs = visual.sizes.map((_, i) => 60 + (i * (W - 120)) / (visual.sizes.length - 1));
      const pos = visual.sizes.map((n, li) => Array.from({ length: n }, (_, j) => ({ x: xs[li]!, y: 30 + ((j + 0.5) * (H - 80)) / n + ((maxN - n) * (H - 80)) / maxN / 2 })));
      return (
        <svg viewBox={`0 0 ${W} ${H}`} className="dia-net" role="img" aria-label={`Network with layers of ${visual.sizes.join(', ')} units: ${visual.labels.join(', ')}.`}>
          {pos.slice(0, -1).flatMap((layer, li) => layer.flatMap((a, ai) => pos[li + 1]!.map((b, bi) => <line key={`${li}-${ai}-${bi}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="currentColor" strokeWidth={1.2 + ((ai * 7 + bi * 3 + li) % 4) * 0.7} strokeOpacity={0.55} />)))}
          {pos.flatMap((layer, li) => layer.map((p, i) => <circle key={`${li}-${i}`} cx={p.x} cy={p.y} r="11" fill="var(--bone-hi)" stroke="var(--graphite)" strokeWidth="2.4" />))}
          {visual.labels.map((l, i) => (
            <text key={l} x={xs[i]} y={H - 12} textAnchor="middle" className="dia-label">
              {l}
            </text>
          ))}
        </svg>
      );
    }
    case 'tokens':
      return (
        <p className="dia-tokens" aria-label={`Split into tokens: ${visual.tokens.join(' | ')}`}>
          {visual.tokens.map((t, i) => (
            <span key={i} className={`tok tok--${i % 4}`}>
              {t.replace(/ /g, ' ')}
            </span>
          ))}
        </p>
      );
  }
}
