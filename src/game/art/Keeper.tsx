/**
 * The lamplighter: the player's figure. A hooded cloak, a satchel, and a lantern held out in front.
 * Drawn once in a 120 x 200 box, feet at y = 190, facing right. The room mirrors it to face left.
 * The legs are separate groups so a CSS walk cycle can swing them.
 */
import { memo } from 'react';
import { C, INK } from '@/art/palette';
import { Flecks, Hatch, Shape, Stroke, Wash } from '@/art/Draw';
import { box, ell } from '@/art/ink';

export const Keeper = memo(function Keeper() {
  return (
    <svg className="keeper" viewBox="0 0 120 200" aria-hidden="true" focusable="false">
      <g filter="url(#rough)">
        <Wash pts={ell(58, 192, 34, 6, 10, 0.05, 11)} fill={INK} opacity={0.3} />
        <g className="keeper__leg keeper__leg--b">
          <Stroke pts={[[52, 130], [48, 160], [46, 186]]} w={12} color={INK} seed={21} taper={0.1} />
          <Shape pts={[[38, 184], [58, 184], [60, 192], [36, 192]]} fill={C.woodDeep} w={2.4} seed={22} />
        </g>
        <g className="keeper__body">
          {/* satchel strap and bag, behind the cloak */}
          <Shape pts={[[36, 120], [26, 128], [28, 150], [44, 148]]} fill={C.wood} w={2.4} seed={31} hatch={{ angle: -55, gap: 4, w: 1 }} hatchOpacity={0.5} />
          {/* the cloak */}
          <Shape pts={[[60, 30], [78, 44], [86, 90], [92, 156], [30, 160], [36, 92], [42, 44]]} smooth fill={C.indigo} w={3.4} seed={41} hatch={{ angle: -62, gap: 4.2, w: 1.1 }} hatchOpacity={0.55} />
          <Hatch pts={box(30, 100, 20, 60)} angle={-60} gap={3.6} w={1.1} opacity={0.55} seed={43} />
          <Shape pts={[[30, 156], [92, 152], [94, 164], [28, 166]]} fill={C.ink3} w={2.4} seed={44} />
          <Flecks marks={[[44, 110, 22, 80], [58, 108, 26, 82], [72, 112, 22, 80]]} w={1.5} color={C.paperLo} seed={45} opacity={0.5} />
          {/* hood: a dark opening with two points of light */}
          <Shape pts={[[44, 40], [60, 12], [80, 38], [74, 64], [50, 64]]} smooth fill={C.indigoLo} w={3.2} seed={51} />
          <Shape pts={ell(62, 44, 11, 13, 9, 0.08, 52)} smooth fill={C.ink} w={0} reg={[0, 0]} />
          <Shape pts={ell(66, 43, 2.4, 2.4, 6, 0.1, 53)} smooth fill={C.lantern} w={0} reg={[0, 0]} />
          <Shape pts={ell(74, 43, 2.4, 2.4, 6, 0.1, 54)} smooth fill={C.lantern} w={0} reg={[0, 0]} />
          {/* belt */}
          <Stroke pts={[[40, 108], [66, 112], [90, 106]]} w={5} color={INK} seed={55} />
        </g>
        <g className="keeper__leg keeper__leg--f">
          <Stroke pts={[[68, 130], [72, 160], [76, 186]]} w={12} color={C.ink3} seed={61} taper={0.1} />
          <Shape pts={[[66, 184], [88, 184], [92, 192], [64, 192]]} fill={C.woodDeep} w={2.4} seed={62} />
        </g>
        {/* the lantern arm and the lantern */}
        <g className="keeper__lamp">
          <Stroke pts={[[80, 92], [96, 100], [104, 112]]} w={11} color={INK} seed={71} taper={0.1} />
          <Stroke pts={[[80, 92], [96, 100], [104, 112]]} w={6} color={C.indigo} seed={72} taper={0.1} />
          <Stroke pts={[[104, 112], [104, 120]]} w={2} seed={73} smooth={false} />
          <Shape pts={[[98, 120], [110, 120], [112, 144], [96, 144]]} fill={C.lantern} w={2.4} seed={74} />
          <Shape pts={[[96, 118], [112, 118], [110, 122], [98, 122]]} fill={C.ink} w={1.6} seed={75} />
          <Shape pts={[[96, 144], [112, 144], [110, 148], [98, 148]]} fill={C.ink} w={1.6} seed={76} />
          <Flecks marks={[[104, 150, 7, 90], [92, 134, 7, 180], [116, 134, 7, 0], [96, 124, 6, 225], [112, 124, 6, -45]]} w={1.6} seed={77} />
        </g>
      </g>
    </svg>
  );
});
