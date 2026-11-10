import { memo } from 'react';
import { C, INK } from './palette';
import { Flecks, Hatch, Shape, Stroke, Wash } from './Draw';
import { box, ell, type Pt } from './ink';
import { PaperLantern } from './props';

/** A limb: dark outline stroke with a colour stroke on top. */
function Limb({ pts, w = 14, color, seed }: { pts: Pt[]; w?: number; color: string; seed: number }) {
  return (
    <g>
      <Stroke pts={pts} w={w + 6} color={INK} seed={seed} taper={0.1} wob={0.6} />
      <Stroke pts={pts} w={w} color={color} seed={seed + 1} taper={0.08} wob={0.6} />
    </g>
  );
}

const Hand = ({ x, y, tone, seed }: { x: number; y: number; tone: string; seed: number }) => <Shape pts={ell(x, y, 9, 8.5, 8, 0.08, seed)} smooth fill={tone} w={2.6} />;

/**
 * Wren the Weaver: short, round and unhurried, under a hat as wide as she is tall.
 * Drawn in a 210 x 300 box with her feet at y = 290.
 */
export const Wren = memo(function Wren() {
  return (
    <g>
      <Wash pts={ell(104, 292, 58, 8, 10, 0.04, 81)} fill={INK} opacity={0.22} />
      <Shape pts={ell(84, 287, 16, 8, 8, 0.08, 82)} smooth fill={C.woodDeep} w={2.8} />
      <Shape pts={ell(126, 287, 16, 8, 8, 0.08, 83)} smooth fill={C.woodDeep} w={2.8} />
      {/* the dress, with a woven diamond pattern worked in by hand */}
      <Shape pts={[[72, 150], [54, 230], [60, 284], [150, 284], [156, 230], [138, 150]]} smooth fill={C.indigo} w={3.6} />
      <Hatch pts={[[70, 156], [56, 230], [62, 282], [90, 282], [92, 160]]} angle={-55} gap={5.5} w={1.3} opacity={0.7} smooth />
      <Flecks marks={[[64, 250, 7, 45], [76, 250, 7, -45], [128, 258, 7, 45], [140, 258, 7, -45], [66, 268, 7, 45], [78, 268, 7, -45], [130, 272, 7, 45], [142, 272, 7, -45]]} w={2} color={C.lantern} />
      <Shape pts={[[86, 168], [80, 268], [128, 268], [122, 168]]} smooth fill={C.bone} w={3} />
      <Shape pts={[[90, 224], [118, 224], [118, 248], [90, 248]]} fill={C.paperLo} w={2.2} />
      <Flecks marks={[[93, 228, 4, 90], [99, 228, 4, 90], [105, 228, 4, 90], [111, 228, 4, 90]]} w={1.3} opacity={0.8} />
      <Stroke pts={[[96, 168], [104, 174], [112, 168]]} w={2.4} color={C.seal} />
      {/* staff with a knob, and a needle through the top */}
      <Stroke pts={[[52, 64], [54, 150], [52, 290]]} w={9} color={INK} seed={90} taper={0.05} wob={0.8} />
      <Stroke pts={[[52, 64], [54, 150], [52, 290]]} w={5} color={C.woodLight} seed={91} taper={0.05} wob={0.8} />
      <Shape pts={ell(52, 62, 9, 9, 8, 0.08, 92)} smooth fill={C.straw} w={2.6} />
      <Limb pts={[[80, 160], [62, 196], [58, 226]]} color={C.indigo} seed={94} />
      <Hand x={56} y={232} tone={C.skinDeep} seed={95} />
      <Limb pts={[[132, 160], [162, 172], [176, 150]]} color={C.indigo} seed={96} />
      <Hand x={178} y={144} tone={C.skinDeep} seed={97} />
      <Shape pts={box(172, 128, 14, 20)} fill={C.clothRed} w={2.2} />
      <Stroke pts={[[186, 134], [198, 116], [206, 140], [194, 176]]} w={1.8} color={C.clothRed} />
      {/* head */}
      <Shape pts={ell(104, 114, 27, 29, 12, 0.04, 98)} smooth fill={C.skinDeep} w={3.2} />
      <Hatch pts={ell(104, 114, 27, 29, 12, 0.04, 98).filter((p) => p[0] > 108)} angle={-55} gap={5} w={1.2} opacity={0.6} />
      <Shape pts={[[78, 108], [82, 84], [104, 76], [126, 84], [130, 108], [122, 94], [104, 90], [86, 94]]} smooth fill={C.hairGrey} w={2.8} />
      <Shape pts={ell(104, 70, 13, 11, 8, 0.07, 99)} smooth fill={C.hairGrey} w={2.8} />
      <Shape pts={ell(92, 114, 9.5, 9.5, 9, 0.04, 100)} smooth fill={C.bone} fillOpacity={0.5} w={2.2} />
      <Shape pts={ell(116, 114, 9.5, 9.5, 9, 0.04, 101)} smooth fill={C.bone} fillOpacity={0.5} w={2.2} />
      <Stroke pts={[[101, 112], [104, 110], [107, 112]]} w={1.8} />
      <Shape pts={ell(92, 115, 2.4, 2.8, 6, 0.1, 102)} smooth fill={INK} w={0} reg={[0, 0]} />
      <Shape pts={ell(116, 115, 2.4, 2.8, 6, 0.1, 103)} smooth fill={INK} w={0} reg={[0, 0]} />
      <Stroke pts={[[104, 118], [102, 126], [107, 127]]} w={2} />
      <Stroke pts={[[94, 134], [104, 139], [114, 133]]} w={2.6} />
      <Flecks marks={[[82, 124, 6, 120], [128, 124, 6, 60], [96, 102, 8, 190], [114, 102, 8, 350]]} w={1.5} opacity={0.7} />
      <Shape pts={ell(84, 130, 4.5, 3, 6, 0.1, 104)} smooth fill={C.seal} fillOpacity={0.7} w={0} reg={[0, 0]} />
      {/* the hat: a straw wheel with a pinned spool of thread */}
      <Shape pts={ell(104, 86, 76, 17, 16, 0.03, 105)} smooth fill={C.straw} w={3.6} hatch={{ angle: 4, gap: 5, w: 1.1 }} hatchOpacity={0.45} />
      <Shape pts={[[76, 90], [78, 66], [104, 58], [130, 66], [132, 90]]} smooth fill={C.straw} w={3.4} />
      <Hatch pts={[[110, 62], [130, 68], [132, 88], [112, 90]]} angle={-60} gap={5} w={1.2} opacity={0.6} />
      <Stroke pts={[[76, 82], [104, 88], [132, 82]]} w={5} color={C.seal} />
      <Shape pts={box(138, 88, 12, 16)} fill={C.clothTeal} w={2.2} />
      <Stroke pts={[[138, 94], [150, 94]]} w={1.4} color={C.bone} />
      <Stroke pts={[[138, 99], [150, 99]]} w={1.4} color={C.bone} />
    </g>
  );
});

/**
 * Brannock the Foundry-master: wide, heavy and mid-swing, with goggles pushed up and a beard like a hedge.
 */
export const Brannock = memo(function Brannock() {
  return (
    <g>
      <Wash pts={ell(106, 292, 72, 9, 10, 0.04, 111)} fill={INK} opacity={0.24} />
      {/* legs and boots, planted wide */}
      <Shape pts={[[66, 240], [100, 240], [102, 280], [62, 280]]} fill={C.ink3} w={3} />
      <Shape pts={[[112, 240], [146, 240], [150, 280], [110, 280]]} fill={C.ink3} w={3} />
      <Shape pts={[[56, 278], [104, 276], [108, 292], [52, 292]]} smooth fill={C.woodDeep} w={3.2} hatch={{ angle: -40, gap: 5, w: 1.2 }} hatchOpacity={0.5} />
      <Shape pts={[[108, 276], [156, 278], [160, 292], [106, 292]]} smooth fill={C.woodDeep} w={3.2} hatch={{ angle: -40, gap: 5, w: 1.2 }} hatchOpacity={0.5} />
      {/* shirt, then a leather apron over it */}
      <Shape pts={[[56, 140], [38, 196], [50, 246], [160, 246], [172, 196], [154, 140]]} smooth fill={C.bone} w={3.6} />
      <Hatch pts={[[150, 146], [168, 196], [158, 244], [136, 244], [142, 190]]} angle={-55} gap={5} w={1.3} opacity={0.6} smooth />
      <Shape pts={[[72, 160], [64, 256], [146, 256], [138, 160]]} smooth fill={C.woodLight} w={3.4} hatch={{ angle: -50, gap: 6, w: 1.3 }} hatchOpacity={0.5} />
      <Stroke pts={[[74, 160], [96, 140]]} w={4} color={C.woodDeep} />
      <Stroke pts={[[136, 160], [116, 140]]} w={4} color={C.woodDeep} />
      <Shape pts={box(82, 206, 46, 30)} fill={C.wood} w={2.6} />
      <Flecks marks={[[88, 210, 4, 90], [98, 210, 4, 90], [108, 210, 4, 90], [118, 210, 4, 90]]} w={1.4} opacity={0.7} />
      <Shape pts={[[88, 194], [94, 188], [100, 194], [94, 200]]} fill={C.ink2} w={1.8} />
      {/* the arm that holds the hammer over the shoulder, and the one hanging with a spanner */}
      <Limb pts={[[52, 160], [28, 192], [32, 232]]} w={22} color={C.skinTan} seed={113} />
      <Shape pts={ell(34, 238, 12, 11, 8, 0.08, 114)} smooth fill={C.skinTan} w={3} />
      <Stroke pts={[[30, 250], [34, 288]]} w={6} color={C.woodDeep} />
      <Shape pts={[[24, 284], [44, 284], [46, 298], [22, 298]]} fill={C.ink3} w={2.4} />
      <Limb pts={[[158, 158], [188, 138], [176, 100]]} w={22} color={C.skinTan} seed={115} />
      <Shape pts={ell(174, 92, 12, 11, 8, 0.08, 116)} smooth fill={C.skinTan} w={3} />
      <Stroke pts={[[172, 90], [150, 18]]} w={9} color={INK} taper={0.04} wob={0.5} />
      <Stroke pts={[[172, 90], [150, 18]]} w={5.4} color={C.woodLight} taper={0.04} wob={0.5} />
      <Shape pts={[[130, 6], [172, 14], [168, 40], [128, 34]]} fill={C.ink3} w={3.2} hatch={{ angle: -45, gap: 5, w: 1.2 }} hatchColor={C.paper} hatchOpacity={0.4} />
      {/* head, beard, hair and goggles */}
      <Shape pts={[[78, 92], [84, 70], [106, 64], [128, 70], [134, 92], [130, 124], [106, 134], [82, 124]]} smooth fill={C.skinTan} w={3.4} />
      <Hatch pts={[[116, 70], [132, 92], [128, 122], [112, 128]]} angle={-55} gap={5} w={1.2} opacity={0.55} smooth />
      <Shape pts={[[78, 112], [88, 132], [106, 148], [126, 132], [136, 112], [128, 120], [106, 124], [86, 120]]} smooth fill={C.ink3} w={3} hatch={{ angle: 70, gap: 4.5, w: 1.1 }} hatchColor={C.hairGrey} hatchOpacity={0.5} />
      <Shape pts={[[76, 80], [80, 56], [92, 66], [98, 46], [108, 62], [120, 46], [126, 66], [138, 58], [136, 82], [120, 72], [106, 70], [92, 72]]} fill={C.ink3} w={3} />
      <Stroke pts={[[78, 74], [106, 78], [136, 74]]} w={5} color={C.ink2} />
      <Shape pts={ell(92, 74, 11, 10, 9, 0.04, 117)} smooth fill={C.tealLight} w={3.2} />
      <Shape pts={ell(122, 74, 11, 10, 9, 0.04, 118)} smooth fill={C.tealLight} w={3.2} />
      <Stroke pts={[[88, 70], [92, 76]]} w={1.8} color={C.bone} />
      <Stroke pts={[[118, 70], [122, 76]]} w={1.8} color={C.bone} />
      <Stroke pts={[[82, 96], [92, 100]]} w={4} />
      <Stroke pts={[[130, 96], [120, 100]]} w={4} />
      <Shape pts={ell(94, 104, 2.6, 3, 6, 0.1, 119)} smooth fill={INK} w={0} reg={[0, 0]} />
      <Shape pts={ell(118, 104, 2.6, 3, 6, 0.1, 120)} smooth fill={INK} w={0} reg={[0, 0]} />
      <Stroke pts={[[106, 104], [102, 114], [110, 116]]} w={2.4} />
      <Stroke pts={[[94, 124], [106, 130], [120, 123]]} w={3} color={C.bone} />
    </g>
  );
});

/**
 * Sedge the Beacon-keeper: tall and narrow, in a coat the wind has taken hold of, with a lantern on a pole.
 */
export const Sedge = memo(function Sedge() {
  return (
    <g>
      <Wash pts={ell(102, 296, 52, 7, 10, 0.04, 121)} fill={INK} opacity={0.22} />
      <Shape pts={[[78, 280], [100, 280], [102, 296], [72, 296]]} smooth fill={C.woodDeep} w={3} />
      <Shape pts={[[108, 280], [130, 280], [136, 296], [106, 296]]} smooth fill={C.woodDeep} w={3} />
      {/* the long coat, flaring to the left in the wind */}
      <Shape pts={[[84, 100], [70, 150], [52, 230], [26, 292], [100, 290], [150, 292], [152, 220], [138, 150], [132, 100]]} smooth fill={C.woodDeep} w={3.6} />
      <Hatch pts={[[72, 150], [54, 228], [30, 288], [64, 288], [84, 220], [86, 150]]} angle={-60} gap={5.5} w={1.3} opacity={0.75} color={C.bone} smooth />
      <Hatch pts={[[132, 110], [148, 220], [146, 288], [128, 288], [124, 190]]} angle={-60} gap={5.5} w={1.3} opacity={0.5} smooth />
      <Stroke pts={[[104, 112], [102, 200], [100, 286]]} w={2.2} color={C.ochre} opacity={0.85} />
      {[[100, 150], [100, 176], [100, 202]].map(([x, y], i) => (
        <Shape key={i} pts={ell(x!, y!, 3.4, 3.4, 6, 0.1, 130 + i)} smooth fill={C.lantern} w={1.8} reg={[0.6, 0.6]} />
      ))}
      <Shape pts={[[60, 184], [42, 262], [64, 266], [76, 190]]} smooth fill={C.ochre} w={0} hatch={{ angle: 20, gap: 6, w: 1.2 }} hatchColor={INK} hatchOpacity={0.5} reg={[0, 0]} fillOpacity={0.0} />
      {/* the scarf, streaming */}
      <Shape pts={[[88, 98], [64, 92], [36, 106], [8, 96], [14, 114], [40, 118], [68, 112], [90, 112]]} smooth fill={C.clothRed} w={3} hatch={{ angle: 60, gap: 6, w: 1.2 }} hatchOpacity={0.55} />
      {/* arm holding the pole, and the pole */}
      <Limb pts={[[134, 118], [162, 130], [168, 100]]} w={12} color={C.woodDeep} seed={141} />
      <Shape pts={ell(168, 92, 8.5, 8, 8, 0.08, 142)} smooth fill={C.skinPale} w={2.6} />
      <Stroke pts={[[168, 30], [168, 94], [170, 290]]} w={7} color={INK} taper={0.04} wob={0.7} />
      <Stroke pts={[[168, 30], [168, 94], [170, 290]]} w={3.6} color={C.woodLight} taper={0.04} wob={0.7} />
      <Stroke pts={[[168, 36], [150, 26]]} w={3} />
      <PaperLantern x={150} y={52} s={1.35} seed={143} />
      <Limb pts={[[84, 120], [66, 160], [74, 196]]} w={12} color={C.woodDeep} seed={144} />
      <Shape pts={ell(76, 202, 8.5, 8, 8, 0.08, 145)} smooth fill={C.skinPale} w={2.6} />
      {/* hood and head */}
      <Shape pts={[[78, 100], [74, 62], [90, 42], [112, 40], [130, 56], [134, 100], [118, 90], [96, 90]]} smooth fill={C.bone} w={3.4} />
      <Hatch pts={[[118, 50], [132, 62], [134, 96], [118, 88]]} angle={-55} gap={5} w={1.2} opacity={0.55} smooth />
      <Shape pts={[[88, 98], [90, 70], [106, 62], [122, 70], [124, 98], [114, 110], [98, 110]]} smooth fill={C.skinPale} w={3} />
      <Hatch pts={[[110, 70], [124, 72], [124, 98], [112, 108]]} angle={-55} gap={5} w={1.2} opacity={0.5} smooth />
      <Shape pts={[[88, 78], [96, 66], [108, 64], [124, 72], [112, 70], [98, 74]]} smooth fill={C.hairGrey} w={2.4} />
      <Stroke pts={[[93, 82], [101, 85]]} w={2.6} />
      <Stroke pts={[[116, 82], [108, 85]]} w={2.6} />
      <Shape pts={ell(98, 90, 2.2, 2.6, 6, 0.1, 146)} smooth fill={INK} w={0} reg={[0, 0]} />
      <Shape pts={ell(115, 90, 2.2, 2.6, 6, 0.1, 147)} smooth fill={INK} w={0} reg={[0, 0]} />
      <Stroke pts={[[106, 88], [100, 102], [109, 104]]} w={2.2} />
      <Stroke pts={[[96, 108], [105, 111], [116, 107]]} w={2.2} />
      <Flecks marks={[[94, 96, 5, 200], [118, 96, 5, 340]]} w={1.3} opacity={0.6} />
    </g>
  );
});

const BUST: Record<'understand' | 'use' | 'responsible', { view: string; fill: string }> = {
  understand: { view: '26 40 156 124', fill: C.indigo },
  use: { view: '40 30 132 124', fill: C.tealDeep },
  responsible: { view: '40 22 130 124', fill: C.ochre },
};

/** Head and shoulders of a mentor on their path's colour, for the places where they speak. Decorative: their name is always in the text beside it. */
export const MentorBust = memo(function MentorBust({ who, className }: { who: 'understand' | 'use' | 'responsible'; className?: string }) {
  const b = BUST[who];
  const [x, y, w, h] = b.view.split(' ').map(Number) as [number, number, number, number];
  return (
    <svg className={className} viewBox={b.view} aria-hidden="true" focusable="false">
      <rect x={x} y={y} width={w} height={h} fill={b.fill} />
      <Hatch pts={box(x, y + h * 0.55, w, h * 0.45)} angle={-55} gap={7} w={1.3} opacity={0.35} />
      {who === 'understand' ? <Wren /> : who === 'use' ? <Brannock /> : <Sedge />}
    </svg>
  );
});
