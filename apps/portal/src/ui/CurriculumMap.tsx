import { useMemo, type CSSProperties, type ReactNode } from 'react';
import {
  MODULES,
  challengeHref,
  lessonHref,
  moduleHref,
  quizHref,
  type ModuleContent,
} from '../content';
import { t } from '../core/assets';
import { BADGE_QUIZ_MIN } from '../core/gamification';
import { masteryRank, type Mastery, type PersistedState } from '../core/schema';
import { Link } from '../router';
import { useData } from './hooks';

/**
 * The curriculum map: every lesson, knowledge check, challenge and badge as one drawn network,
 * three chains side by side. Each node reads the learner's real saved state. State is carried by
 * shape and fill (hollow, dotted, half, solid), never by color alone, and every node is a link.
 */

type NodeKind = 'lesson' | 'check' | 'challenge' | 'badge';
type NodeState = 'none' | 'started' | 'half' | 'done';

interface MapNode {
  key: string;
  kind: NodeKind;
  state: NodeState;
  x: number;
  y: number;
  href: string;
  label: string;
  n?: number;
}

interface Chain {
  module: ModuleContent;
  index: number;
  nodes: MapNode[];
  numeral: { x: number; y: number };
}

const LESSON_STATE: Record<Mastery, NodeState> = {
  unseen: 'none',
  seen: 'started',
  practiced: 'half',
  mastered: 'done',
};

function chainNodes(
  m: ModuleContent,
  data: PersistedState,
  place: (k: number) => { x: number; y: number },
): MapNode[] {
  const d = data.modules[m.id];
  const out: MapNode[] = m.lessons.map((l, i) => {
    const state = d.lessons[l.id] ?? 'unseen';
    return {
      key: l.id,
      kind: 'lesson',
      state: LESSON_STATE[state],
      ...place(i),
      href: lessonHref(m.id, i + 1),
      n: i + 1,
      label: t('module.lessonTab', { n: i + 1, title: l.title, state: t(`mastery.${state}`) }),
    };
  });
  const k = m.lessons.length;
  const quizState: NodeState =
    d.quiz.best >= BADGE_QUIZ_MIN ? 'done' : d.quiz.attempts > 0 ? 'started' : 'none';
  out.push({
    key: `${m.id}-check`,
    kind: 'check',
    state: quizState,
    ...place(k),
    href: quizHref(m.id),
    label:
      quizState === 'done'
        ? t('map.check.passed', { title: m.title, best: d.quiz.best, total: m.quiz.length })
        : quizState === 'started'
          ? t('map.check.tried', { title: m.title, best: d.quiz.best, total: m.quiz.length })
          : t('map.check.none', { title: m.title }),
  });
  const chState: NodeState = d.challenge.done
    ? 'done'
    : d.challenge.attempts > 0
      ? 'started'
      : 'none';
  out.push({
    key: `${m.id}-challenge`,
    kind: 'challenge',
    state: chState,
    ...place(k + 1),
    href: challengeHref(m.id),
    label:
      chState === 'done'
        ? t('map.challenge.done', { title: m.title })
        : chState === 'started'
          ? t('map.challenge.tried', { title: m.title })
          : t('map.challenge.none', { title: m.title }),
  });
  out.push({
    key: `${m.id}-badge`,
    kind: 'badge',
    state: d.badge ? 'done' : 'none',
    ...place(k + 2),
    href: moduleHref(m.id),
    label: d.badge
      ? t('map.badge.earned', { name: m.badge.name })
      : t('map.badge.locked', { name: m.badge.name }),
  });
  return out;
}

/** Wide: three chains read left to right, each starting a little later than the one above. */
function wide(data: PersistedState): { chains: Chain[]; w: number; h: number } {
  const step = 96;
  const wave = [0, -9, 5, -7, 8, -4, 6, -8];
  const chains = MODULES.map((m, i): Chain => {
    const x0 = 168 + i * 34;
    const y0 = 86 + i * 138;
    return {
      module: m,
      index: i,
      numeral: { x: 0, y: y0 + 8 },
      nodes: chainNodes(m, data, (k) => ({ x: x0 + k * step, y: y0 + (wave[k] ?? 0) })),
    };
  });
  return { chains, w: 960, h: 420 };
}

/** Narrow: three columns, each chain reading top to bottom. */
function tall(data: PersistedState): { chains: Chain[]; w: number; h: number } {
  const step = 64;
  const wave = [0, 8, -5, 7, -8, 4, -6, 8];
  const chains = MODULES.map((m, i): Chain => {
    const x0 = 66 + i * 114;
    return {
      module: m,
      index: i,
      numeral: { x: x0, y: 44 },
      nodes: chainNodes(m, data, (k) => ({ x: x0 + (wave[k] ?? 0), y: 100 + k * step })),
    };
  });
  return { chains, w: 360, h: 100 + 7 * step + 50 };
}

function Shape({ node, r }: { node: MapNode; r: number }): ReactNode {
  const { x, y, kind, state } = node;
  const tick = <path className="mn-tick" d={`M${x - 4.2} ${y + 0.4}l3 3 5.4-6`} />;
  if (kind === 'lesson') {
    return (
      <>
        <circle className="mn-shape" cx={x} cy={y} r={r} />
        {state === 'started' && <circle className="mn-fill" cx={x} cy={y} r={3.2} />}
        {state === 'half' && (
          <path className="mn-fill" d={`M${x} ${y - r}A${r} ${r} 0 0 0 ${x} ${y + r}Z`} />
        )}
        {state === 'done' && (
          <>
            <circle className="mn-fill" cx={x} cy={y} r={r} />
            {tick}
          </>
        )}
      </>
    );
  }
  if (kind === 'check') {
    return (
      <>
        <rect
          className="mn-shape"
          x={x - r + 1}
          y={y - r + 1}
          width={2 * r - 2}
          height={2 * r - 2}
        />
        {state === 'started' && (
          <rect className="mn-fill" x={x - 3} y={y - 3} width={6} height={6} />
        )}
        {state === 'done' && (
          <>
            <rect
              className="mn-fill"
              x={x - r + 1}
              y={y - r + 1}
              width={2 * r - 2}
              height={2 * r - 2}
            />
            {tick}
          </>
        )}
      </>
    );
  }
  if (kind === 'challenge') {
    const d = `M${x} ${y - r - 2}L${x + r + 2} ${y}L${x} ${y + r + 2}L${x - r - 2} ${y}Z`;
    return (
      <>
        <path className="mn-shape" d={d} />
        {state === 'started' && <circle className="mn-fill" cx={x} cy={y} r={3} />}
        {state === 'done' && (
          <>
            <path className="mn-fill" d={d} />
            {tick}
          </>
        )}
      </>
    );
  }
  const hex = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    return `${(x + Math.cos(a) * (r + 3)).toFixed(1)} ${(y + Math.sin(a) * (r + 3)).toFixed(1)}`;
  }).join('L');
  return (
    <>
      <path className="mn-shape mn-badge" d={`M${hex}Z`} />
      {state === 'done' && (
        <>
          <path className="mn-fill mn-badge" d={`M${hex}Z`} />
          {tick}
        </>
      )}
    </>
  );
}

function ChainView({
  chain,
  orientation,
  labels,
}: {
  chain: Chain;
  orientation: 'wide' | 'tall';
  labels: boolean;
}): ReactNode {
  const r = orientation === 'wide' ? 14 : 13;
  const style = { '--m': `var(--m-${chain.module.id})` } as CSSProperties;
  const links = chain.nodes.slice(0, -1).map((a, i) => {
    const b = chain.nodes[i + 1]!;
    return {
      key: `${a.key}-${b.key}`,
      lit: a.state !== 'none',
      d: `M${a.x} ${a.y}L${b.x} ${b.y}`,
    };
  });
  return (
    <g className="mn-chain" style={style} data-module={chain.module.id}>
      {orientation === 'wide' && (
        <text className="mn-name" x={chain.numeral.x} y={chain.numeral.y + 26}>
          {chain.module.title}
        </text>
      )}
      {links.map((l) => (
        <path key={l.key} className="mn-link" data-lit={l.lit} d={l.d} />
      ))}
      {chain.nodes.map((n) => (
        <Link
          key={n.key}
          to={n.href}
          className="mn-node"
          aria-label={n.label}
          data-kind={n.kind}
          data-state={n.state}
        >
          <circle className="mn-hit" cx={n.x} cy={n.y} r={Math.max(r + 15, 31)} />
          <circle className="mn-halo" cx={n.x} cy={n.y} r={r + 7} />
          <Shape node={n} r={r} />
          {labels && n.n !== undefined && (
            <text className="mn-n" x={n.x} y={n.y + r + 18} textAnchor="middle">
              {n.n}
            </text>
          )}
        </Link>
      ))}
    </g>
  );
}

/** One drawing, two orientations. The stylesheet shows the one that fits the screen. */
export function CurriculumMap({ compact = false }: { compact?: boolean }): ReactNode {
  const data = useData();
  const w = useMemo(() => wide(data), [data]);
  const v = useMemo(() => tall(data), [data]);
  return (
    <figure className={`cmap glass edge${compact ? ' cmap-compact' : ''}`}>
      <svg
        className="cmap-wide"
        viewBox={`0 0 ${w.w} ${w.h}`}
        role="group"
        aria-label={t('map.label')}
        focusable="false"
      >
        {w.chains.map((c) => (
          <ChainView key={c.module.id} chain={c} orientation="wide" labels={!compact} />
        ))}
      </svg>
      <svg
        className="cmap-tall"
        viewBox={`0 0 ${v.w} ${v.h}`}
        role="group"
        aria-label={t('map.label')}
        focusable="false"
      >
        {v.chains.map((c) => (
          <ChainView key={c.module.id} chain={c} orientation="tall" labels={false} />
        ))}
      </svg>
      {!compact && <MapLegend />}
    </figure>
  );
}

export type MarkKind = NodeKind;
export type MarkState = NodeState;

/** The map's shape vocabulary as a small standalone mark, for lists and headings. */
export function Mark({
  kind,
  state,
  size = 24,
}: {
  kind: NodeKind;
  state: NodeState;
  size?: number;
}): ReactNode {
  const node: MapNode = { key: 'm', kind, state, x: size / 2, y: size / 2, href: '', label: '' };
  return (
    <svg
      className="mn-mark"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      focusable="false"
    >
      <g className="mn-chain">
        <g className="mn-node" data-state={state} data-kind={kind}>
          <Shape node={node} r={size / 2 - 3.5} />
        </g>
      </g>
    </svg>
  );
}

export const lessonNodeState = (m: Mastery): NodeState => LESSON_STATE[m];

function LegendMark({ kind, state }: { kind: NodeKind; state: NodeState }): ReactNode {
  const node: MapNode = { key: 'l', kind, state, x: 14, y: 14, href: '', label: '' };
  return (
    <svg
      className="mn-legend-mark"
      width="28"
      height="28"
      viewBox="0 0 28 28"
      aria-hidden="true"
      focusable="false"
    >
      <g className="mn-chain" style={{ '--m': 'var(--accent)' } as CSSProperties}>
        <Shape node={node} r={10} />
      </g>
    </svg>
  );
}

/** The key to the drawing, in words. */
export function MapLegend(): ReactNode {
  const items: Array<[NodeKind, NodeState, string]> = [
    ['lesson', 'none', t('mastery.unseen')],
    ['lesson', 'started', t('mastery.seen')],
    ['lesson', 'half', t('mastery.practiced')],
    ['lesson', 'done', t('mastery.mastered')],
  ];
  return (
    <figcaption className="cmap-legend">
      <ul aria-label={t('map.legend')}>
        {items.map(([kind, state, label]) => (
          <li key={label}>
            <LegendMark kind={kind} state={state} />
            {label}
          </li>
        ))}
        <li>
          <LegendMark kind="check" state="none" />
          {t('map.legend.check')}
        </li>
        <li>
          <LegendMark kind="challenge" state="none" />
          {t('map.legend.challenge')}
        </li>
        <li>
          <LegendMark kind="badge" state="none" />
          {t('map.legend.badge')}
        </li>
      </ul>
    </figcaption>
  );
}

/** The map in words, for the dashboard: the same numbers the drawing is built from. */
export function MapSummary(): ReactNode {
  const data = useData();
  return (
    <dl className="cmap-summary">
      {MODULES.map((m) => {
        const d = data.modules[m.id];
        const count = (s: Mastery): number =>
          m.lessons.filter((l) => (d.lessons[l.id] ?? 'unseen') === s).length;
        const mastered = count('mastered');
        const practiced = count('practiced');
        const seen = count('seen');
        const started = m.lessons.filter(
          (l) => masteryRank(d.lessons[l.id] ?? 'unseen') >= 1,
        ).length;
        const check =
          d.quiz.best >= BADGE_QUIZ_MIN
            ? t('map.s.check.passed', { best: d.quiz.best, total: m.quiz.length })
            : d.quiz.attempts > 0
              ? t('map.s.check.tried', { best: d.quiz.best, total: m.quiz.length })
              : t('map.s.check.none');
        const challenge = d.challenge.done
          ? t('map.s.ch.done')
          : d.challenge.attempts > 0
            ? t('map.s.ch.tried')
            : t('map.s.ch.none');
        return (
          <div key={m.id} data-module={m.id}>
            <dt>{m.title}</dt>
            <dd>
              {t('map.summary', {
                opened: started,
                total: m.lessons.length,
                mastered,
                practiced,
                seen,
                check,
                challenge,
                badge: d.badge ? t('badge.unlocked') : t('badge.locked'),
              })}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
