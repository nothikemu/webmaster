/**
 * One plate per module, each composed differently so they never read as the same picture in three colours:
 *  Foundations: the anatomy of a single unit (inputs, weights, a sum, a squash).
 *  Synthesis:   a prompt annotated into role, task and constraint, with the model's next-word odds fanning out below.
 *  Ethics:      four small studies of how a system fails: bias, leakage, attack, opacity.
 * Text inside the drawings is live SVG text and only decorative: the meaning is always written out in HTML beside each plate.
 */
import { useMemo, type ReactNode } from 'react';
import type { ModuleId } from '@/content/types';
import { type Pt, arc, ell } from '../ink';
import { C } from '../palette';
import { Dots, Loop, Note, Pen, Round, Shade, Wash } from './ink';

const DESCRIPTIONS: Record<ModuleId, string> = {
  foundations: 'A drawing of one unit in a neural network. Three input values arrive along lines of different thickness, the thickness being each weight. The unit adds them up, passes the total through an S-shaped curve, and sends one number out.',
  synthesis: 'A drawing of a prompt split into role, task and constraint, with brackets over each part, a dial for temperature, and below it a fan of bars showing how likely each next word is.',
  ethics: 'Four small drawings of how an AI system fails: a skewed sample for bias, a cracked jar spilling dots for data leakage, a road sign with stickers on it for an adversarial input, and a black box with a keyhole for opaque decisions.',
};

const SIZES: Record<ModuleId, [number, number]> = { foundations: [600, 460], synthesis: [1000, 400], ethics: [800, 400] };

function Foundations() {
  return useMemo(() => {
    const out: ReactNode[] = [];
    const inputs: [number, number, string, string, number][] = [[64, 118, '0.8', '0.8', 4.6], [64, 230, '0.2', '0.1', 1.3], [64, 342, '0.6', '0.4', 2.8]];
    inputs.forEach(([x, y, v, wv, wt], i) => {
      const my = (y + 230) / 2 + (i - 1) * 8;
      out.push(<Pen key={`w${i}`} pts={[[x + 22, y], [140, my], [216, 222 + (i - 1) * 18]]} w={wt} color={i === 1 ? C.graphite2 : C.cobalt} opacity={0.85} wob={1} taper={0.14} seed={30 + i} />);
      out.push(<Wash key={`iw${i}`} pts={ell(x, y, 22, 22, 12, 0.04, i + 4)} color={C.cobaltWash} opacity={1} seed={i} />);
      out.push(<Round key={`i${i}`} cx={x} cy={y} r={22} w={2.2} seed={20 + i} irr={0.03} />);
      out.push(<Note key={`n${i}`} x={x} y={y + 4.5} anchor="middle" size={13} color={C.ink}>{v}</Note>);
      out.push(<Note key={`l${i}`} x={x} y={y - 32} anchor="middle" size={10} color={C.graphite2}>INPUT {i + 1}</Note>);
      out.push(<Note key={`wl${i}`} x={128} y={my - (i === 1 ? 10 : i === 0 ? 14 : -22)} anchor="middle" size={11} color={C.cobaltLo}>×{wv}</Note>);
    });
    out.push(<Note key="wh" x={128} y={72} anchor="middle" size={10} color={C.graphite2}>WEIGHTS</Note>);
    const unit = ell(304, 225, 74, 74, 20, 0.02, 6);
    out.push(<Wash key="uw" pts={unit} color={C.cobalt} opacity={0.2} seed={9} />);
    out.push(<Shade key="us" pts={ell(304, 244, 62, 50, 18, 0.02, 7)} spacing={4.4} angle={48} color={C.cobaltLo} opacity={0.5} weight={0.9} cross seed={4} />);
    out.push(<Round key="u" cx={304} cy={225} r={74} w={3.2} seed={5} irr={0.02} />);
    // a proper sigma: top bar, in to the middle, out to the bottom bar
    out.push(<Pen key="sg" pts={[[330, 190], [284, 190], [310, 224], [284, 260], [332, 260]]} w={5} smooth={false} color={C.ink} wob={0.3} seed={19} taper={0.1} />);
    out.push(<Note key="ul" x={304} y={328} anchor="middle" size={11} color={C.graphite2}>SUM = 0.90</Note>);
    // the arrow into the squash curve
    out.push(<Pen key="a1" pts={[[380, 225], [414, 225]]} w={3} color={C.ink} smooth={false} seed={21} />);
    out.push(<Pen key="a2" pts={[[404, 215], [416, 225], [404, 235]]} w={2.6} color={C.ink} smooth={false} seed={22} />);
    // the squash: a small graph
    out.push(<Pen key="ax" pts={[[428, 280], [574, 280]]} w={1.8} smooth={false} color={C.ink} wob={0.4} seed={23} />);
    out.push(<Pen key="ay" pts={[[470, 154], [470, 296]]} w={1.8} smooth={false} color={C.ink} wob={0.4} seed={24} />);
    const curve: Pt[] = [];
    for (let t = -4; t <= 4.001; t += 0.5) curve.push([470 + t * 21, 280 - (1 / (1 + Math.exp(-t))) * 112]);
    out.push(<Pen key="cv" pts={curve} w={3.4} color={C.cobalt} wob={0.3} seed={25} />);
    const cx = 470 + 0.9 * 21;
    const cy = 280 - (1 / (1 + Math.exp(-0.9))) * 112;
    out.push(<Pen key="dl" pts={[[cx, 280], [cx, cy]]} w={1.6} smooth={false} color={C.vermilion} wob={0.3} seed={27} />);
    out.push(<Pen key="dh" pts={[[470, cy], [cx, cy]]} w={1.6} smooth={false} color={C.vermilion} wob={0.3} seed={29} />);
    out.push(<Round key="dot" cx={cx} cy={cy} r={6.5} w={2} fill={C.vermilion} seed={26} />);
    out.push(<Note key="al" x={500} y={142} anchor="middle" size={10} color={C.graphite2}>SQUASH</Note>);
    out.push(<Note key="x0" x={cx} y={296} anchor="middle" size={10} color={C.vermilionLo}>0.9</Note>);
    out.push(<Pen key="ol" pts={[[cx + 8, cy + 8], [cx + 44, 330]]} w={1.6} color={C.vermilion} wob={0.5} seed={28} />);
    out.push(<Note key="out" x={cx + 46} y={348} anchor="middle" size={14} color={C.ink}>out 0.71</Note>);
    out.push(<Dots key="g" pts={ell(300, 420, 250, 14, 22, 0.02, 2)} count={150} opacity={0.4} seed={3} />);
    return out;
  }, []);
}

function Synthesis() {
  return useMemo(() => {
    const out: ReactNode[] = [];
    const chips: [number, number, string, 'role' | 'task' | 'con'][] = [
      [40, 112, 'You are', 'role'], [152, 124, 'an analyst.', 'role'], [284, 126, 'Summarize', 'task'], [418, 94, 'the report', 'task'],
      [522, 90, 'in three', 'con'], [622, 98, 'bullets,', 'con'], [730, 92, 'no jargon.', 'con'],
    ];
    chips.forEach(([x, w, text, kind], i) => {
      const poly: Pt[] = [[x, 78], [x + w, 78], [x + w, 122], [x, 122]];
      out.push(<Wash key={`cw${i}`} pts={poly} smooth={false} color={kind === 'task' ? C.boneLo : C.vermilionWash} opacity={1} seed={i + 1} />);
      out.push(<Loop key={`c${i}`} pts={poly} smooth={false} w={2} seed={40 + i} wob={0.7} />);
      out.push(<Note key={`t${i}`} x={x + w / 2} y={105} anchor="middle" size={13} color={C.ink}>{text}</Note>);
    });
    const bracket = (x0: number, x1: number, label: string, color: string, seed: number) => {
      out.push(<Pen key={`b${seed}`} pts={[[x0, 62], [x0, 50], [x1, 50], [x1, 62]]} w={2.6} smooth={false} color={color} wob={0.7} seed={seed} />);
      out.push(<Note key={`bl${seed}`} x={(x0 + x1) / 2} y={36} anchor="middle" size={11} color={color === C.ink ? C.ink : C.vermilionLo}>{label}</Note>);
    };
    bracket(40, 262, 'ROLE: whose view?', C.vermilion, 3);
    bracket(284, 512, 'TASK: what to do', C.ink, 4);
    bracket(522, 822, 'CONSTRAINTS: how to check it', C.vermilionLo, 5);
    // the temperature dial
    out.push(<Round key="dial" cx={920} cy={118} r={46} w={2.4} fill={C.boneHi} seed={7} irr={0.015} />);
    for (let a = -140; a <= 140; a += 20) {
      const r1 = 58; const r2 = a % 40 === 0 ? 70 : 65;
      const t = ((a - 90) * Math.PI) / 180;
      out.push(<Pen key={`tk${a}`} pts={[[920 + Math.cos(t) * (r1 - 4), 118 + Math.sin(t) * (r1 - 4)], [920 + Math.cos(t) * (r2 - 4), 118 + Math.sin(t) * (r2 - 4)]]} w={1.6} smooth={false} wob={0.15} taper={0.3} color={C.graphite2} seed={a + 200} />);
    }
    const pt = ((-38 - 90) * Math.PI) / 180;
    out.push(<Pen key="needle" pts={[[920, 118], [920 + Math.cos(pt) * 36, 118 + Math.sin(pt) * 36]]} w={4} smooth={false} color={C.vermilion} wob={0.3} seed={9} />);
    out.push(<Round key="hub" cx={920} cy={118} r={8} w={2} fill={C.boneHi} seed={10} />);
    out.push(<Note key="dl" x={920} y={196} anchor="middle" size={11} color={C.graphite2}>TEMPERATURE</Note>);
    // next-word odds
    // the cursor after the last word: the next one has not been chosen yet
    out.push(<Pen key="cursor" pts={[[836, 80], [836, 120]]} w={3.4} smooth={false} color={C.vermilion} wob={0.3} seed={11} taper={0.1} />);
    out.push(<Note key="nl" x={40} y={218} size={11} color={C.graphite2}>THE NEXT WORD, AND THE ODDS OF EACH</Note>);
    const cands: [string, number][] = [['•', 0.46], ['Revenue', 0.22], ['The', 0.13], ['Q3', 0.08], ['Costs', 0.05], ['—', 0.03]];
    cands.forEach(([word, p], i) => {
      const y = 240 + i * 24;
      const len = 560 * p / 0.46;
      const poly: Pt[] = [[210, y], [210 + len, y], [210 + len, y + 15], [210, y + 15]];
      out.push(<Wash key={`pw${i}`} pts={poly} smooth={false} color={i === 0 ? C.vermilion : C.vermilionWash} opacity={i === 0 ? 0.55 : 1} seed={60 + i} off={[1.2, 1]} />);
      if (i === 0) out.push(<Shade key="ps" pts={poly} spacing={4} angle={52} color={C.vermilionLo} opacity={0.6} weight={0.9} seed={61} />);
      out.push(<Loop key={`p${i}`} pts={poly} smooth={false} w={1.7} seed={70 + i} wob={0.5} />);
      out.push(<Note key={`pt${i}`} x={196} y={y + 12} anchor="end" size={12} color={C.ink}>{word}</Note>);
      out.push(<Note key={`pp${i}`} x={218 + len} y={y + 12} size={11} color={C.graphite2}>{Math.round(p * 100)}%</Note>);
    });
    out.push(<Dots key="g" pts={ell(500, 392, 420, 7, 22, 0.02, 3)} count={120} opacity={0.4} seed={4} />);
    return out;
  }, []);
}

function Ethics() {
  return useMemo(() => {
    const out: ReactNode[] = [];
    const cols = [0, 1, 2, 3].map((i) => 20 + i * 190);
    cols.forEach((x, i) => {
      if (i) out.push(<Pen key={`sep${i}`} pts={[[x - 8, 44], [x - 8, 372]]} w={1.1} smooth={false} color={C.graphite2} wob={0.6} opacity={0.5} seed={i + 90} />);
    });
    const title = (x: number, text: string, n: number) => {
      out.push(<Note key={`n${n}`} x={x + 8} y={34} size={11} color={C.ochreLo}>{String(n).padStart(2, '0')}</Note>);
      out.push(<Note key={`t${n}`} x={x + 30} y={34} size={11} color={C.ink}>{text}</Note>);
    };

    // 1: bias. A sample that is dense on one side and thin on the other, over a tipping balance.
    const bx = cols[0]!;
    title(bx, 'BIAS', 1);
    let a = 7;
    const rnd = () => { a = (a * 9301 + 49297) % 233280; return a / 233280; };
    for (let k = 0; k < 44; k++) out.push(<Round key={`bd${k}`} cx={bx + 14 + rnd() * 70} cy={66 + rnd() * 168} r={3.2 + rnd() * 1.4} w={1.2} fill={C.ochre} fillOpacity={0.85} seed={k + 3} irr={0.1} />);
    for (let k = 0; k < 11; k++) out.push(<Round key={`bo${k}`} cx={bx + 104 + rnd() * 58} cy={66 + rnd() * 168} r={3.2 + rnd() * 1.2} w={1.2} seed={k + 80} irr={0.1} />);
    out.push(<Pen key="bdiv" pts={[[bx + 94, 58], [bx + 92, 120], [bx + 95, 180], [bx + 93, 242]]} w={1.6} color={C.ink} wob={0.8} taper={0.15} opacity={0.8} seed={12} />);
    // the balance: heavy on the left, so the beam tips
    const px = bx + 88;
    out.push(<Loop key="fulc" pts={[[px - 14, 362], [px + 14, 362], [px, 318]]} smooth={false} w={2.4} seed={13} wob={0.4} fill={C.ochreWash} fillOpacity={1} />);
    out.push(<Pen key="beam" pts={[[bx + 16, 322], [px, 308], [bx + 160, 294]]} w={3.6} color={C.ink} wob={0.4} seed={14} />);
    out.push(<Round key="piv" cx={px} cy={309} r={4.5} w={1.6} fill={C.boneHi} seed={15} irr={0.03} />);
    [[bx + 16, 322], [bx + 160, 294]].forEach(([x, y], k) => {
      out.push(<Pen key={`st${k}a`} pts={[[x!, y!], [x! - 14, y! + 26]]} w={1.2} smooth={false} color={C.ink} wob={0.2} seed={16 + k} />);
      out.push(<Pen key={`st${k}b`} pts={[[x!, y!], [x! + 14, y! + 26]]} w={1.2} smooth={false} color={C.ink} wob={0.2} seed={18 + k} />);
      const pan = arc(x!, y! + 26, 18, 7, 0, Math.PI, 10);
      out.push(<Loop key={`pan${k}`} pts={pan} w={2} seed={20 + k} wob={0.2} fill={C.ochreWash} fillOpacity={1} smooth />);
    });
    for (let k = 0; k < 5; k++) out.push(<Round key={`pl${k}`} cx={bx + 8 + k * 6.5} cy={346 - (k % 2) * 6} r={3.4} w={1.1} fill={C.ochre} fillOpacity={0.9} seed={40 + k} irr={0.06} />);
    out.push(<Round key="pr0" cx={bx + 160} cy={320} r={3.4} w={1.1} seed={50} irr={0.06} />);

    // 2: leakage. A cracked jar; what was inside is falling out.
    const lx = cols[1]!;
    title(lx, 'LEAKAGE', 2);
    const jar: Pt[] = [[lx + 56, 92], [lx + 124, 92], [lx + 126, 108], [lx + 144, 130], [lx + 148, 210], [lx + 138, 262], [lx + 34, 262], [lx + 24, 210], [lx + 28, 130], [lx + 54, 108]];
    out.push(<Wash key="jw" pts={jar} color={C.ochreWash} opacity={1} seed={20} />);
    out.push(<Shade key="js" pts={[[lx + 28, 150], [lx + 144, 150], [lx + 148, 210], [lx + 138, 262], [lx + 34, 262], [lx + 24, 210]]} spacing={6} angle={58} color={C.ochreLo} opacity={0.38} weight={0.9} seed={21} />);
    out.push(<Loop key="j" pts={jar} w={2.6} seed={22} />);
    out.push(<Pen key="lid" pts={[[lx + 48, 84], [lx + 132, 84]]} w={5.5} smooth={false} color={C.ink} wob={0.5} seed={23} />);
    out.push(<Pen key="lev" pts={[[lx + 30, 150], [lx + 60, 146], [lx + 96, 152], [lx + 146, 148]]} w={1.6} color={C.ink} wob={0.6} seed={24} />);
    out.push(<Pen key="crack" pts={[[lx + 112, 214], [lx + 104, 232], [lx + 114, 246], [lx + 106, 262]]} w={2.2} color={C.ink} wob={0.6} seed={25} />);
    for (let k = 0; k < 20; k++) {
      const y = 268 + k * 5 + (k % 3) * 5;
      const x = lx + 108 + Math.sin(k * 1.7) * (5 + k * 1.2);
      out.push(<Round key={`sp${k}`} cx={x} cy={y} r={Math.max(1.6, 4.3 - k * 0.13)} w={1} fill={C.ochre} fillOpacity={0.9} seed={60 + k} irr={0.08} />);
    }
    out.push(<Dots key="lj" pts={jar} count={50} opacity={0.4} seed={26} />);

    // 3: attack. A sign with stickers, and what the model reads instead.
    const ax = cols[2]!;
    title(ax, 'ATTACK', 3);
    const oct: Pt[] = Array.from({ length: 8 }, (_, k) => { const t = (Math.PI / 4) * k + Math.PI / 8; return [ax + 85 + Math.cos(t) * 70, 146 + Math.sin(t) * 70] as Pt; });
    out.push(<Wash key="ow" pts={oct} smooth={false} color={C.ochre} opacity={0.55} seed={30} />);
    out.push(<Loop key="o" pts={oct} smooth={false} w={3} seed={31} wob={0.5} />);
    out.push(<Note key="stop" x={ax + 85} y={156} anchor="middle" size={30} color={C.ink}>STOP</Note>);
    [[-48, -34, 40, 16, -6], [-6, -8, 34, 22, 5], [-44, 24, 36, 16, 4], [16, 28, 32, 14, -4]].forEach(([dx, dy, w, h], k) => {
      const x = ax + 85 + dx!;
      const y = 146 + dy!;
      const poly: Pt[] = [[x, y], [x + w!, y], [x + w!, y + h!], [x, y + h!]];
      out.push(<Wash key={`st${k}`} pts={poly} smooth={false} color={C.boneHi} opacity={1} seed={33 + k} off={[0.5, 0.5]} />);
      out.push(<Shade key={`sh${k}`} pts={poly} spacing={3.6} angle={30 + k * 20} color={C.ink} opacity={0.35} weight={0.8} seed={36 + k} />);
      out.push(<Loop key={`sl${k}`} pts={poly} smooth={false} w={1.7} seed={40 + k} wob={0.4} />);
    });
    out.push(<Pen key="pole" pts={[[ax + 85, 218], [ax + 85, 258]]} w={5} smooth={false} color={C.ink} wob={0.5} seed={32} />);
    out.push(<Pen key="rd" pts={[[ax + 85, 262], [ax + 85, 282]]} w={2} smooth={false} color={C.vermilion} wob={0.3} seed={50} />);
    out.push(<Pen key="rd2" pts={[[ax + 77, 274], [ax + 85, 284], [ax + 93, 274]]} w={2} smooth={false} color={C.vermilion} wob={0.2} seed={51} />);
    out.push(<Round key="mis" cx={ax + 85} cy={326} r={30} w={3} fill={C.boneHi} seed={52} irr={0.03} />);
    out.push(<Note key="mn" x={ax + 85} y={334} anchor="middle" size={22} color={C.ink}>45</Note>);
    out.push(<Dots key="no" pts={oct} count={90} opacity={0.35} seed={53} />);

    // 4: opacity. A black box with a keyhole, and a thread of questions.
    const ox = cols[3]!;
    title(ox, 'OPACITY', 4);
    const box: Pt[] = [[ox + 22, 100], [ox + 150, 100], [ox + 150, 246], [ox + 22, 246]];
    out.push(<Wash key="xw" pts={box} smooth={false} color={C.ink} opacity={0.94} seed={60} off={[1.2, 1.2]} />);
    out.push(<Loop key="x" pts={box} smooth={false} w={3} seed={61} wob={0.6} />);
    out.push(<Shade key="xs" pts={[[ox + 26, 104], [ox + 146, 104], [ox + 146, 242], [ox + 26, 242]]} spacing={7} angle={40} color={C.onNight} opacity={0.12} weight={0.9} seed={66} />);
    out.push(<Round key="kh" cx={ox + 86} cy={160} r={12} w={2} fill={C.boneHi} seed={62} irr={0.03} />);
    out.push(<Loop key="kh2" pts={[[ox + 86, 168], [ox + 74, 214], [ox + 98, 214]]} smooth={false} w={2} fill={C.boneHi} fillOpacity={1} seed={63} wob={0.2} />);
    out.push(<Pen key="thread" pts={[[ox + 86, 250], [ox + 124, 288], [ox + 100, 318], [ox + 134, 352]]} w={1.8} color={C.ink} wob={0.5} seed={64} />);
    out.push(<Note key="q0" x={ox + 96} y={292} size={26} color={C.ochreLo} serif>?</Note>);
    out.push(<Note key="q1" x={ox + 114} y={326} size={22} color={C.ochreLo} serif>?</Note>);
    out.push(<Note key="q2" x={ox + 84} y={344} size={18} color={C.ochreLo} serif>?</Note>);
    return out;
  }, []);
}

const BODY: Record<ModuleId, () => ReactNode> = { foundations: Foundations, synthesis: Synthesis, ethics: Ethics };

export function ModulePlate({ module, large }: { module: ModuleId; large?: boolean }) {
  const [w, h] = SIZES[module];
  const Body = BODY[module];
  return (
    <figure className={`module-plate module-plate--${module} figure`}>
      <div className="plate">
        <svg viewBox={`0 0 ${w} ${h}`} role={large ? 'img' : undefined} aria-label={large ? DESCRIPTIONS[module] : undefined} aria-hidden={large ? undefined : true} focusable="false">
          <Body />
        </svg>
      </div>
    </figure>
  );
}
