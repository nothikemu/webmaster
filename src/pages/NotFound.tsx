import { LinkBtn } from '@/ui/primitives';
import { Link } from '@/router';
import { MODULES } from '@/content/modules';

export default function NotFound() {
  return (
    <div className="wrap page notfound">
      <p className="kicker">Page not found</p>
      <h1>
        That page is not in the <em>guide</em>
      </h1>
      <p className="page-head__lead">The address may be mistyped, or the page may have moved. These are the places that do exist.</p>
      <div className="row">
        <LinkBtn to="/" variant="primary" go>
          Go to the home page
        </LinkBtn>
        <LinkBtn to="/modules">See the three modules</LinkBtn>
      </div>
      <ul className="notfound__list">
        {MODULES.map((m) => (
          <li key={m.id}>
            <Link to={`/modules/${m.id}`}>
              {String(m.number).padStart(2, '0')} · {m.title}
            </Link>
          </li>
        ))}
        <li>
          <Link to="/glossary">Glossary</Link>
        </li>
      </ul>
    </div>
  );
}
