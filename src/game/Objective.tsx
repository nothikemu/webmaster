/** The objective tracker: one sentence for what to do next, one line for how, and (in the 3D game) how far away it is. */
import type { Objective } from './objective';

export function ObjectiveTracker({ obj, distance }: { obj: Objective; distance?: number | null }) {
  return (
    <aside className="objective" aria-label="Objective">
      <p className="objective__tag" aria-hidden="true">
        Objective
      </p>
      <div key={obj.id} className="objective__body" role="status">
        <p className="objective__title">{obj.title}</p>
        <p className="objective__hint">{obj.hint}</p>
      </div>
      {distance !== null && distance !== undefined ? (
        <p className="objective__dist" aria-label={`${distance} metres to go`}>
          <b>{distance}</b> m
        </p>
      ) : null}
    </aside>
  );
}
