import { Adrift } from '@/art/PageScenes';
import { LinkBtn, Panel } from '@/ui/primitives';

export default function NotFound() {
  return (
    <section className="lost" aria-labelledby="lost-h">
      <Adrift className="lost__art" />
      <div className="wrap lost__inner">
        <Panel lift className="lost__copy">
          <h1 id="lost-h">That route is not on the chart</h1>
          <p>The link may be old or mistyped, and Kernel has rowed off the edge of the map looking for it. These places are always open.</p>
          <div className="row">
            <LinkBtn to="/" variant="primary" go>Go to the home page</LinkBtn>
            <LinkBtn to="/learn" variant="secondary">Open the chart</LinkBtn>
          </div>
        </Panel>
      </div>
    </section>
  );
}
