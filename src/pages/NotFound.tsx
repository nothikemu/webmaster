import { Kernel } from '@/art/Kernel';
import { LinkBtn } from '@/ui/primitives';

export default function NotFound() {
  return (
    <div className="wrap page notfound">
      <Kernel mood="alert" className="notfound__kernel" label="Kernel looking surprised" />
      <div>
        <p className="label">Page not found</p>
        <h1>That route is not on the chart</h1>
        <p className="prose">The link may be old or mistyped. These places are always open.</p>
        <div className="row">
          <LinkBtn to="/" variant="primary" go>Go to the home page</LinkBtn>
          <LinkBtn to="/learn" variant="secondary">Open the chart</LinkBtn>
        </div>
      </div>
    </div>
  );
}
