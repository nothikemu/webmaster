import { useMemo } from 'react';
import type { Visual } from '@/content/types';
import { Icon } from './Icons';
import { Pen, Round } from './field/ink';
import { C } from './palette';

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
    case 'layers':
      return <Layers sizes={visual.sizes} labels={visual.labels} />;
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

/** A small network drawn by hand: inked rings for units, pen lines whose thickness varies like weights. */
function Layers({ sizes, labels }: { sizes: number[]; labels: string[] }) {
  const W = 460;
  const H = 230;
  const art = useMemo(() => {
    const maxN = Math.max(...sizes);
    const xs = sizes.map((_, i) => 64 + (i * (W - 128)) / (sizes.length - 1));
    const pos = sizes.map((n, li) => Array.from({ length: n }, (_, j) => ({ x: xs[li]!, y: 34 + ((j + 0.5) * (H - 84)) / n + ((maxN - n) * (H - 84)) / maxN / 2 })));
    const out: JSX.Element[] = [];
    pos.slice(0, -1).forEach((layer, li) =>
      layer.forEach((a, ai) =>
        pos[li + 1]!.forEach((b, bi) => {
          const w = 0.8 + ((ai * 7 + bi * 3 + li * 5) % 5) * 0.8;
          out.push(<Pen key={`l${li}-${ai}-${bi}`} pts={[[a.x + 12, a.y], [b.x - 12, b.y]]} w={w} color={C.cobalt} opacity={0.6} smooth={false} wob={0.6} taper={0.15} seed={li * 50 + ai * 7 + bi} />);
        }),
      ),
    );
    pos.forEach((layer, li) => layer.forEach((p, i) => out.push(<Round key={`u${li}-${i}`} cx={p.x} cy={p.y} r={12} w={2.2} fill={C.boneHi} seed={li * 10 + i + 2} irr={0.04} />)));
    return { out, xs };
  }, [sizes]);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="dia-net" role="img" aria-label={`Network with layers of ${sizes.join(', ')} units: ${labels.join(', ')}.`}>
      {art.out}
      {labels.map((l, i) => (
        <text key={l} x={art.xs[i]} y={H - 12} textAnchor="middle" className="dia-label">
          {l}
        </text>
      ))}
    </svg>
  );
}
