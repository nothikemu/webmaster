import { memo } from 'react';
import { C, INK } from './palette';
import { Flecks, Hatch, Shape, Stroke, Wash } from './Draw';
import { box, ell, type Pt } from './ink';

/** What Kernel is doing. Each mood changes the arms, the eyes, the brows and the mouth, never the character. */
export type Mood = 'idle' | 'think' | 'cheer' | 'alert' | 'wave' | 'point' | 'read' | 'look';
/** What Kernel carries in the lowered hand (idle and alert only). */
export type Hold = 'lantern' | 'none' | 'scroll' | 'flag' | 'brush' | 'map';

interface KernelProps {
  mood?: Mood;
  hold?: Hold;
  /** Accessible description. Decorative uses leave it empty. */
  label?: string;
  className?: string;
}

/** An arm: a thick inked tube, drawn as a dark stroke with a lighter stroke on top. */
function Arm({ pts, seed }: { pts: Pt[]; seed: number }) {
  return (
    <g>
      <Stroke pts={pts} w={15} color={INK} seed={seed} taper={0.12} wob={0.6} />
      <Stroke pts={pts} w={9} color={C.bone} seed={seed + 1} taper={0.1} wob={0.6} />
    </g>
  );
}

function Hand({ x, y, seed }: { x: number; y: number; seed: number }) {
  return (
    <g>
      <Shape pts={ell(x, y, 9.5, 9, 9, 0.07, seed)} smooth fill={C.bone} w={2.8} hatch={{ angle: -50, gap: 4.5, w: 1.1 }} hatchOpacity={0.55} />
      <Stroke pts={[[x - 3, y + 1], [x, y + 6], [x + 3, y + 1]]} w={1.6} />
    </g>
  );
}

/** A small paper lantern with ribs, caps, a tassel and ink ticks for light. */
function Lantern({ x, y, lit = true }: { x: number; y: number; lit?: boolean }) {
  return (
    <g>
      <Stroke pts={[[x, y - 28], [x, y - 17]]} w={2.6} />
      <Shape pts={box(x - 9, y - 19, 18, 6)} fill={INK} w={2} />
      <Shape pts={ell(x, y, 16, 20, 10, 0.05, 41)} smooth fill={C.lantern} w={3.2} hatch={{ angle: -60, gap: 6, w: 1.3 }} hatchOpacity={0.5} />
      <Stroke pts={[[x - 15, y - 3], [x, y + 3], [x + 15, y - 3]]} w={1.8} opacity={0.7} />
      <Stroke pts={[[x - 9, y - 16], [x - 11, y], [x - 8, y + 16]]} w={1.6} opacity={0.7} />
      <Stroke pts={[[x + 9, y - 16], [x + 11, y], [x + 8, y + 16]]} w={1.6} opacity={0.7} />
      <Shape pts={box(x - 8, y + 15, 16, 5)} fill={INK} w={2} />
      <Stroke pts={[[x, y + 20], [x - 2, y + 30]]} w={2.2} color={C.seal} />
      <Stroke pts={[[x, y + 20], [x + 3, y + 29]]} w={2.2} color={C.seal} />
      {lit ? <Flecks marks={[[x - 26, y - 8, 7, 200], [x + 26, y - 8, 7, -20], [x - 24, y + 12, 6, 150], [x + 24, y + 12, 6, 30], [x, y - 36, 7, -90]]} w={1.8} /> : null}
    </g>
  );
}

/** The things Kernel can carry instead of the lantern. Drawn at the lowered right hand, (200, 223). */
function Held({ hold, lit }: { hold: Hold; lit: boolean }) {
  if (hold === 'lantern') return <Lantern x={200} y={256} lit={lit} />;
  if (hold === 'scroll') {
    return (
      <g>
        <Shape pts={[[191, 200], [209, 198], [211, 252], [193, 254]]} fill={C.bone} w={2.6} hatch={{ angle: -70, gap: 5, w: 1 }} hatchOpacity={0.35} />
        <Shape pts={ell(200, 199, 10, 4, 8, 0.05, 301)} smooth fill={C.paperLo} w={2.2} />
        <Shape pts={ell(202, 253, 10, 4, 8, 0.05, 302)} smooth fill={C.paperLo} w={2.2} />
        <Stroke pts={[[191, 226], [201, 229], [211, 225]]} w={4.4} color={C.seal} />
        <Shape pts={ell(201, 228, 4, 4, 6, 0.1, 303)} smooth fill={C.seal} w={1.6} />
      </g>
    );
  }
  if (hold === 'flag') {
    return (
      <g>
        <Stroke pts={[[201, 262], [202, 200], [205, 132]]} w={6.4} color={INK} taper={0.05} wob={0.5} />
        <Stroke pts={[[201, 262], [202, 200], [205, 132]]} w={3} color={C.woodLight} taper={0.05} wob={0.5} />
        <Shape pts={[[206, 134], [244, 142], [230, 156], [246, 170], [205, 172]]} smooth fill={C.seal} w={2.8} hatch={{ angle: 60, gap: 5, w: 1.1 }} hatchOpacity={0.5} />
        <Shape pts={ell(205, 130, 4.5, 4.5, 6, 0.1, 304)} smooth fill={C.lantern} w={2} />
      </g>
    );
  }
  if (hold === 'brush') {
    return (
      <g>
        <Stroke pts={[[196, 136], [200, 200], [203, 244]]} w={8} color={INK} taper={0.05} wob={0.5} />
        <Stroke pts={[[196, 136], [200, 200], [203, 244]]} w={4.4} color={C.woodLight} taper={0.05} wob={0.5} />
        <Shape pts={box(197, 240, 12, 9)} fill={C.lantern} w={2} />
        <Shape pts={[[197, 249], [210, 249], [207, 264], [204, 276], [200, 262]]} smooth fill={INK} w={0} reg={[0, 0]} />
        <Flecks marks={[[204, 280, 5, 90], [198, 284, 3, 90]]} w={2.4} />
      </g>
    );
  }
  if (hold === 'map') {
    return (
      <g>
        <Shape pts={[[186, 214], [226, 206], [234, 250], [194, 260]]} fill={C.paperHi} w={2.6} />
        <Stroke pts={[[206, 210], [214, 256]]} w={1.4} opacity={0.6} />
        <Stroke pts={[[194, 232], [204, 226], [214, 236], [226, 228]]} w={1.8} color={C.teal} />
        <Flecks marks={[[198, 244, 5, 45], [198, 248, 5, -45]]} w={2} color={C.seal} />
      </g>
    );
  }
  return null;
}

/**
 * Kernel, the guide: a small, dented automaton in a woven travelling hat, with a scarf the wind will not leave alone.
 * One character, eight moods, drawn from the same parts so it is always recognisably the same person.
 */
export const KernelParts = memo(function KernelParts({ mood = 'idle', hold = 'lantern' }: { mood?: Mood; hold?: Hold }) {
  const cheer = mood === 'cheer';
  const think = mood === 'think';
  const alert = mood === 'alert';
  const wave = mood === 'wave';
  const point = mood === 'point';
  const read = mood === 'read';
  const look = mood === 'look';
  const happy = cheer;
  // where the pupils sit: thinking looks up, pointing and looking glance right, reading looks down
  const px = think ? 4 : point || look ? 3.5 : read ? -1 : 0;
  const py = think ? -7 : read ? 5 : 0;
  return (
    <g>
      <Wash pts={ell(112, 271, 68, 9, 12, 0.04, 3)} fill={INK} opacity={0.22} />
      <Flecks marks={[[52, 272, 10, 0], [160, 274, 12, 0], [178, 270, 8, 5]]} w={2} opacity={0.5} />

      {/* the scarf, streaming behind in the wind */}
      <Shape pts={[[146, 176], [170, 183], [196, 171], [226, 178], [216, 194], [198, 190], [178, 206], [152, 196]]} smooth fill={C.clothRed} w={3} hatch={{ angle: 55, gap: 6, w: 1.3 }} hatchOpacity={0.6} />
      <Stroke pts={[[168, 188], [190, 180], [214, 184]]} w={1.6} opacity={0.6} />

      {/* legs and boots */}
      <Shape pts={[[78, 224], [100, 224], [103, 254], [76, 254]]} fill={C.ink3} w={2.8} />
      <Shape pts={[[124, 224], [146, 224], [148, 254], [122, 254]]} fill={C.ink3} w={2.8} />
      <Stroke pts={[[77, 238], [90, 242], [103, 238]]} w={3} color={C.paper} />
      <Stroke pts={[[123, 238], [136, 242], [148, 238]]} w={3} color={C.paper} />
      <Shape pts={[[64, 252], [104, 250], [112, 262], [104, 274], [60, 274], [56, 262]]} smooth fill={C.wood} w={3.2} hatch={{ angle: -40, gap: 5, w: 1.3 }} hatchOpacity={0.6} />
      <Shape pts={[[112, 250], [152, 252], [158, 262], [152, 274], [108, 274], [102, 262]]} smooth fill={C.wood} w={3.2} hatch={{ angle: -40, gap: 5, w: 1.3 }} hatchOpacity={0.6} />
      <Stroke pts={[[68, 258], [84, 255], [98, 258]]} w={1.8} color={C.woodLight} />

      {/* torso: a barrel with rivets, a chest plate and a mended patch */}
      <Shape pts={[[62, 172], [53, 198], [61, 224], [88, 235], [136, 235], [163, 224], [171, 198], [162, 172]]} smooth fill={C.teal} w={3.4} />
      <Hatch pts={[[60, 178], [55, 198], [62, 222], [88, 233], [106, 233], [94, 204], [92, 178]]} angle={-52} gap={5.5} w={1.4} opacity={0.7} smooth />
      <Stroke pts={[[58, 202], [100, 208], [142, 206], [168, 200]]} w={2.2} opacity={0.75} />
      {[[70, 205], [92, 209], [118, 209], [146, 206]].map(([x, y], i) => (
        <Shape key={i} pts={ell(x!, y!, 2.6, 2.6, 6, 0.1, i + 5)} smooth fill={C.bone} w={1.4} reg={[0.5, 0.5]} />
      ))}
      <Shape pts={box(92, 182, 40, 28)} fill={C.bone} w={2.8} />
      <Shape pts={ell(104, 196, 6.5, 6.5, 8, 0.05, 9)} smooth fill={C.ochre} w={2} />
      <Stroke pts={[[104, 196], [107, 192]]} w={1.8} />
      <Shape pts={ell(120, 196, 4, 4, 7, 0.08, 4)} smooth fill={C.seal} w={1.8} />
      <Stroke pts={[[126, 188], [130, 192], [127, 202]]} w={2.2} />
      <Shape pts={[[139, 212], [156, 210], [158, 226], [140, 228]]} fill={C.paperLo} w={2.2} />
      <Flecks marks={[[142, 214, 4, 90], [147, 213, 4, 90], [152, 212, 4, 90], [142, 224, 4, 90], [148, 223, 4, 90]]} w={1.3} opacity={0.8} />

      {/* left arm */}
      {cheer ? (
        <>
          <Arm pts={[[68, 188], [42, 172], [31, 142]]} seed={11} />
          <Hand x={29} y={134} seed={12} />
        </>
      ) : read ? (
        <Arm pts={[[68, 190], [56, 212], [80, 226]]} seed={23} />
      ) : (
        <>
          <Arm pts={[[68, 190], [50, 208], [45, 232]]} seed={15} />
          <Hand x={44} y={239} seed={16} />
        </>
      )}

      {/* right arm */}
      {cheer || wave ? (
        <>
          <Arm pts={[[158, 188], [184, 172], [197, 142]]} seed={13} />
          <Hand x={199} y={134} seed={14} />
          {wave ? <Flecks marks={[[214, 122, 9, -30], [218, 136, 9, 0], [184, 118, 8, 210]]} w={2.2} /> : null}
        </>
      ) : think ? (
        <>
          <Arm pts={[[158, 190], [190, 192], [176, 168]]} seed={17} />
          <Hand x={170} y={160} seed={18} />
        </>
      ) : point ? (
        <>
          <Arm pts={[[158, 190], [192, 186], [222, 172]]} seed={25} />
          <Hand x={228} y={169} seed={26} />
          <Stroke pts={[[234, 166], [246, 160]]} w={4} />
        </>
      ) : read ? (
        <Arm pts={[[158, 190], [168, 212], [144, 226]]} seed={27} />
      ) : look ? null : (
        <>
          <Arm pts={[[158, 190], [186, 198], [199, 218]]} seed={19} />
          <Hand x={200} y={223} seed={20} />
          <Held hold={hold} lit={!alert} />
        </>
      )}

      {/* the book Kernel reads from, held open against the chest */}
      {read ? (
        <g>
          <Shape pts={[[70, 208], [112, 214], [154, 208], [156, 240], [112, 246], [68, 240]]} fill={C.clothRed} w={3} />
          <Shape pts={[[74, 206], [112, 211], [112, 241], [72, 236]]} fill={C.paperHi} w={2.2} />
          <Shape pts={[[112, 211], [150, 206], [152, 236], [112, 241]]} fill={C.paperHi} w={2.2} />
          <Flecks marks={[[79, 215, 26, 6], [79, 222, 22, 6], [79, 229, 26, 6], [118, 218, 26, -6], [118, 225, 20, -6], [118, 232, 26, -6]]} w={1.4} opacity={0.7} />
          <Hand x={72} y={228} seed={28} />
          <Hand x={152} y={228} seed={29} />
        </g>
      ) : null}

      {/* head */}
      <Shape pts={[[56, 114], [70, 97], [112, 92], [156, 97], [170, 114], [172, 150], [160, 177], [112, 183], [64, 177], [52, 150]]} smooth fill={C.bone} w={3.6} />
      <Hatch pts={[[150, 100], [168, 114], [171, 150], [160, 176], [138, 181], [150, 142]]} angle={-55} gap={5} w={1.3} opacity={0.65} smooth />
      <Stroke pts={[[148, 104], [153, 113], [146, 122], [152, 133]]} w={2} opacity={0.8} />
      <Shape pts={ell(51, 139, 9, 10, 8, 0.06, 21)} smooth fill={C.ochre} w={3} />
      <Shape pts={ell(173, 139, 9, 10, 8, 0.06, 22)} smooth fill={C.ochre} w={3} />
      <Stroke pts={[[48, 139], [54, 139]]} w={1.8} />
      <Stroke pts={[[170, 139], [176, 139]]} w={1.8} />
      <Shape pts={[[67, 113], [157, 113], [162, 135], [157, 165], [112, 169], [67, 165], [62, 135]]} smooth fill={C.ink} w={2.4} reg={[0, 0]} />

      {/* eyes and brows: this is where the acting happens */}
      {happy ? (
        <>
          <Stroke pts={[[80, 140], [91, 128], [102, 140]]} w={4.4} color={C.bone} />
          <Stroke pts={[[122, 140], [133, 128], [144, 140]]} w={4.4} color={C.bone} />
        </>
      ) : (
        <>
          <Shape pts={ell(91, 136, alert ? 13 : 11, alert ? 14 : 12, 10, 0.05, 31)} smooth fill={C.bone} w={0} reg={[0, 0]} />
          <Shape pts={ell(133, 136, alert ? 13 : 11, alert ? 14 : 12, 10, 0.05, 32)} smooth fill={C.bone} w={0} reg={[0, 0]} />
          <Shape pts={ell(92 + px, 138 + py, alert ? 3.6 : 5.4, alert ? 4 : 6.4, 8, 0.05, 33)} smooth fill={C.ink} w={0} reg={[0, 0]} />
          <Shape pts={ell(134 + px, 138 + py, alert ? 3.6 : 5.4, alert ? 4 : 6.4, 8, 0.05, 34)} smooth fill={C.ink} w={0} reg={[0, 0]} />
          <Shape pts={ell(94 + px, 135 + py, 1.8, 1.8, 6, 0.1, 35)} smooth fill={C.bone} w={0} reg={[0, 0]} />
          <Shape pts={ell(136 + px, 135 + py, 1.8, 1.8, 6, 0.1, 36)} smooth fill={C.bone} w={0} reg={[0, 0]} />
          {read ? (
            <>
              <Shape pts={[[79, 124], [103, 124], [103, 134], [79, 133]]} smooth fill={C.ink} w={0} reg={[0, 0]} />
              <Shape pts={[[121, 124], [145, 124], [145, 133], [121, 134]]} smooth fill={C.ink} w={0} reg={[0, 0]} />
            </>
          ) : null}
        </>
      )}
      {alert ? (
        <>
          <Stroke pts={[[76, 114], [102, 122]]} w={3.6} color={C.lantern} />
          <Stroke pts={[[148, 114], [122, 122]]} w={3.6} color={C.lantern} />
        </>
      ) : think ? (
        <>
          <Stroke pts={[[78, 118], [90, 116], [102, 119]]} w={3.2} color={C.lantern} />
          <Stroke pts={[[122, 111], [134, 107], [146, 112]]} w={3.2} color={C.lantern} />
        </>
      ) : happy || wave ? (
        <>
          <Stroke pts={[[78, 116], [91, 108], [104, 116]]} w={3.2} color={C.lantern} />
          <Stroke pts={[[120, 116], [133, 108], [146, 116]]} w={3.2} color={C.lantern} />
        </>
      ) : look ? (
        <Stroke pts={[[78, 117], [91, 113], [103, 118]]} w={3.2} color={C.lantern} />
      ) : (
        <>
          <Stroke pts={[[78, 119], [91, 114], [103, 119]]} w={3.2} color={C.lantern} />
          <Stroke pts={[[121, 119], [134, 114], [146, 119]]} w={3.2} color={C.lantern} />
        </>
      )}
      {/* mouth */}
      {happy || wave ? (
        <Shape pts={[[98, 148], [112, 164], [126, 148], [112, 152]]} smooth fill={C.lantern} w={0} reg={[0, 0]} />
      ) : alert ? (
        <Shape pts={ell(112, 156, 5.5, 7, 8, 0.05, 37)} smooth fill={C.lantern} w={0} reg={[0, 0]} />
      ) : think || read ? (
        <Stroke pts={[[103, 155], [112, 153], [122, 156]]} w={3.4} color={C.lantern} />
      ) : look ? (
        <Shape pts={ell(108, 157, 4.4, 4.8, 7, 0.05, 37)} smooth fill={C.lantern} w={0} reg={[0, 0]} />
      ) : (
        <Stroke pts={[[100, 151], [112, 160], [125, 151]]} w={3.6} color={C.lantern} />
      )}
      <Shape pts={ell(75, 152, 4.6, 3.4, 7, 0.1, 38)} smooth fill={C.seal} w={0} reg={[0, 0]} />
      <Shape pts={ell(149, 152, 4.6, 3.4, 7, 0.1, 39)} smooth fill={C.seal} w={0} reg={[0, 0]} />

      {/* looking: a brass spyglass held up to the right eye, drawn over the face */}
      {look ? (
        <g>
          <Arm pts={[[158, 190], [190, 182], [180, 154]]} seed={31} />
          <Shape pts={[[122, 126], [160, 121], [162, 147], [124, 150]]} fill={C.strawDeep} w={3} hatch={{ angle: -70, gap: 4.5, w: 1.1 }} hatchOpacity={0.5} />
          <Shape pts={[[160, 118], [204, 110], [207, 146], [162, 150]]} fill={C.straw} w={3} hatch={{ angle: -70, gap: 5, w: 1.1 }} hatchOpacity={0.4} />
          <Shape pts={[[204, 106], [240, 98], [244, 146], [207, 150]]} fill={C.lantern} w={3.2} />
          <Shape pts={ell(242, 122, 5, 24, 10, 0.03, 32)} smooth fill={C.tealLight} w={2.6} />
          <Stroke pts={[[240, 110], [244, 118]]} w={1.8} color={C.bone} />
          <Stroke pts={[[160, 119], [162, 149]]} w={3.4} />
          <Stroke pts={[[204, 108], [207, 148]]} w={3.4} />
          <Hand x={180} y={150} seed={33} />
        </g>
      ) : null}

      {/* the woven travelling hat, tipped a little to one side */}
      <g transform="translate(0 -9) rotate(-5 112 104)">
        <Wash pts={[[60, 110], [112, 118], [164, 110], [158, 124], [112, 128], [66, 124]]} fill={INK} opacity={0.3} />
        <Shape pts={[[112, 24], [224, 98], [198, 108], [112, 118], [26, 108], [0, 98]]} fill={C.straw} w={3.6} />
        <Wash pts={[[112, 28], [220, 98], [196, 106], [150, 112], [158, 70]]} fill={C.strawDeep} opacity={0.5} smooth={false} />
        <Hatch pts={[[126, 40], [214, 98], [190, 104], [146, 110], [150, 66]]} angle={62} gap={5.4} w={1.3} opacity={0.55} />
        {[[112, 24, 28, 106], [112, 24, 66, 112], [112, 24, 112, 117], [112, 24, 160, 113], [112, 24, 198, 106]].map(([x1, y1, x2, y2], i) => (
          <Stroke key={i} pts={[[x1!, y1!], [(x1! + x2!) / 2 + (i - 2) * 2, (y1! + y2!) / 2], [x2!, y2!]]} w={1.5} opacity={0.65} seed={50 + i} />
        ))}
        <Stroke pts={[[52, 82], [112, 94], [172, 82]]} w={2} opacity={0.6} />
        <Stroke pts={[[34, 94], [112, 108], [190, 94]]} w={2} opacity={0.6} />
        <Stroke pts={[[70, 68], [112, 76], [154, 68]]} w={1.8} opacity={0.6} />
        <Stroke pts={[[40, 86], [112, 100], [186, 86]]} w={4.6} color={C.seal} opacity={0.95} />
        <Shape pts={ell(112, 24, 6.5, 6.5, 7, 0.1, 61)} smooth fill={C.seal} w={3} />
        <Stroke pts={[[112, 18], [116, 8], [112, 2]]} w={2.4} />
      </g>
      {/* the chin cord, with a knot and a loose end */}
      <Stroke pts={[[52, 106], [53, 140], [68, 174]]} w={3.4} color={C.seal} />
      <Stroke pts={[[172, 106], [171, 140], [156, 174]]} w={3.4} color={C.seal} />
      {read ? null : (
        <>
          <Shape pts={ell(112, 186, 8, 7, 7, 0.1, 62)} smooth fill={C.seal} w={2.6} />
          <Stroke pts={[[108, 190], [103, 204]]} w={2.8} color={C.seal} />
          <Stroke pts={[[116, 190], [121, 202]]} w={2.8} color={C.seal} />
        </>
      )}

      {think ? (
        <g>
          <Shape pts={ell(196, 80, 6, 6, 8, 0.05, 71)} smooth fill={C.bone} w={2.6} />
          <Shape pts={ell(210, 56, 9, 9, 8, 0.05, 72)} smooth fill={C.bone} w={2.8} />
          <Shape pts={ell(222, 24, 14, 11, 10, 0.06, 73)} smooth fill={C.bone} w={3} />
        </g>
      ) : null}
      {alert ? (
        <g>
          <Stroke pts={[[204, 52], [205, 70], [203, 84]]} w={9} color={C.seal} />
          <Shape pts={ell(203, 98, 5, 5, 7, 0.1, 74)} smooth fill={C.seal} w={0} reg={[0, 0]} />
          <Flecks marks={[[186, 60, 10, 200], [222, 58, 10, -20], [184, 84, 9, 160], [224, 84, 9, 20]]} w={2.2} />
        </g>
      ) : null}
      {cheer ? <Flecks marks={[[10, 112, 12, 200], [14, 90, 10, 230], [214, 112, 12, -20], [212, 90, 10, -50], [112, -4, 10, -90]]} w={2.6} /> : null}
    </g>
  );
});

/** Stand-alone Kernel, for use outside another illustration. */
export const Kernel = memo(function Kernel({ mood = 'idle', hold = 'lantern', label, className }: KernelProps) {
  return (
    <svg className={className} viewBox="-8 -12 262 300" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} focusable="false">
      <KernelParts mood={mood} hold={hold} />
    </svg>
  );
});
