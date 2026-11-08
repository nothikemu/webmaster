import { Link } from '@/router';
import { Callout, PageHead } from '@/ui/primitives';
import { PATHS } from '@/content/paths';

const ext = (href: string, label: string) => (
  <a href={href} target="_blank" rel="noopener noreferrer">
    {label}
    <span className="visually-hidden"> (opens in a new tab)</span>
  </a>
);

export function About() {
  return (
    <div className="wrap page prose-page">
      <PageHead title="About Tideweight" kicker="About and sources" lead="A free, game-inspired AI learning portal for students in grades 9 to 12, built for the TSA Webmaster event, 2026-27." />
      <section className="prose" aria-labelledby="what">
        <h2 id="what">What it teaches</h2>
        <p>The portal answers the three parts of the challenge: fundamental AI concepts, practical AI tools and techniques, and ethical AI use in school.</p>
        <ul>
          {PATHS.map((p) => (
            <li key={p.id}><strong>{p.title}.</strong> {p.tsaSection}. {p.lessons.length} lessons. <Link to={`/learn/${p.id}`}>Open the path</Link>.</li>
          ))}
        </ul>
        <p>Progress, XP, levels and nine badges track real work: finishing the lessons, solving the experiments, passing the checks and the final certification. Everything is saved only in your browser.</p>
      </section>
      <section className="prose" aria-labelledby="research">
        <h2 id="research">How the content was researched</h2>
        <p>The lessons follow published AI education guidance, and every lesson names the idea it serves. References are in APA style. “n.d.” means the page shows no date.</p>
        <ul className="refs">
          <li>AI4K12. (n.d.). <em>Five big ideas in AI</em>. {ext('https://ai4k12.org/', 'https://ai4k12.org/')}</li>
          <li>Computer Science Teachers Association &amp; AI4K12. (n.d.). <em>Identifying AI priorities for all K-12 students</em>. {ext('https://csteachers.org/ai-learning-priorities-for-all-k-12-students-about/', 'https://csteachers.org/ai-learning-priorities-for-all-k-12-students-about/')}</li>
          <li>Common Sense Education. (n.d.). <em>AI literacy: Digital literacy and well-being curriculum, grades 9-12</em>. {ext('https://www.commonsense.org/education/digital-literacy/grades-9-12/ai-literacy', 'https://www.commonsense.org/education/digital-literacy/grades-9-12/ai-literacy')}</li>
          <li>UNESCO. (n.d.). <em>Guidance for generative AI in education and research</em>. {ext('https://www.unesco.org/en/articles/guidance-generative-ai-education-and-research', 'https://www.unesco.org/en/articles/guidance-generative-ai-education-and-research')}</li>
          <li>National Institute of Standards and Technology. (2023, January 26). <em>Artificial intelligence risk management framework (AI RMF 1.0)</em>. {ext('https://www.nist.gov/itl/ai-risk-management-framework', 'https://www.nist.gov/itl/ai-risk-management-framework')}</li>
        </ul>
        <h3>Real cases used in lessons</h3>
        <ul>
          <li>Buolamwini and Gebru, “Gender Shades” (2018): error-rate gaps in commercial face-analysis systems.</li>
          <li>Reuters (2018): reporting that Amazon dropped an experimental hiring tool that marked down resumes containing “women&apos;s”.</li>
          <li>Mata v. Avianca (S.D.N.Y., 2023): lawyers sanctioned over AI-invented case citations.</li>
          <li>The January 2024 AI-voice robocall in New Hampshire, and the FCC&apos;s later ruling on AI voices in robocalls.</li>
          <li>The U.S. Copyright Office&apos;s published position that material produced purely by AI, without human authorship, is not protected.</li>
        </ul>
      </section>
      <section className="prose" aria-labelledby="limits">
        <h2 id="limits">What we are upfront about</h2>
        <Callout icon="info">
          <p>The Tool Atlas lists only tools whose rules we could check, each with the date. Some facts are marked “Reported, confirm” because we could not read the vendor page directly. The Prompt Lab uses pre-written sample responses and is not a live AI. The experiments are deliberately tiny so you can see how they work.</p>
        </Callout>
        <p>AI products change quickly. Treat dates on this site as a starting point and check the vendor&apos;s own page before you rely on a rule.</p>
      </section>
    </div>
  );
}

export function Accessibility() {
  return (
    <div className="wrap page prose-page">
      <PageHead title="Accessibility" kicker="Statement" lead="We aim for WCAG 2.2 level AA. Here is what we did and what we know is still imperfect." />
      <section className="prose" aria-labelledby="did">
        <h2 id="did">What we did</h2>
        <ul>
          <li><strong>Keyboard.</strong> Every control is a real link, button, input or select, reachable in a sensible order with a clear focus ring. A skip link jumps past the navigation. Nothing needs a mouse or a drag.</li>
          <li><strong>Structure.</strong> One main heading per page, a logical heading order, landmarks, and labels on every form field.</li>
          <li><strong>Colour.</strong> Text and key interface colours are checked against WCAG AA contrast by a script in the project (<code>pnpm contrast</code>). Meaning is never carried by colour alone. Right and wrong answers also show words and icons, and locked badges are hatched and carry a padlock.</li>
          <li><strong>Targets.</strong> Buttons and options are at least 48 pixels tall.</li>
          <li><strong>Motion and sound.</strong> Animation is small and stops when your device asks for reduced motion. Sound is off by default and optional.</li>
          <li><strong>Text.</strong> Body text uses Atkinson Hyperlegible, a typeface designed for legibility.</li>
          <li><strong>Pictures.</strong> Illustrations have text descriptions. Diagrams have captions. The experiments each have a written summary of their result.</li>
        </ul>
      </section>
      <section className="prose" aria-labelledby="known">
        <h2 id="known">Known limits</h2>
        <ul>
          <li>The decision-map plots in two experiments are visual. Their results are always repeated in text, but you cannot explore the plot itself with a screen reader.</li>
          <li>We tested with an automated checker and by keyboard. We have not yet tested with every screen reader, so some rough edges may remain.</li>
        </ul>
        <p>If something does not work for you, tell your teacher or TSA advisor so it can be passed on and fixed.</p>
      </section>
    </div>
  );
}

export function Credits() {
  return (
    <div className="wrap page prose-page">
      <PageHead title="Credits and AI disclosure" kicker="Credits" lead="What this site is made of, and how it was made." />
      <section className="prose" aria-labelledby="art">
        <h2 id="art">Artwork and sound</h2>
        <p>All illustrations, characters, badges and icons are original vector artwork drawn in code for this project, in one shared ink-and-print style. No stock images are used. Interface sounds are synthesized in your browser and use no audio files. The look is influenced by ink illustration and print design, with no copied characters, scenes or sounds.</p>
      </section>
      <section className="prose" aria-labelledby="soft">
        <h2 id="soft">Software and fonts</h2>
        <ul>
          <li>React, the user-interface library (MIT license).</li>
          <li>Vite, the build tool (MIT license).</li>
          <li>Dela Gothic One, Barlow Condensed and Atkinson Hyperlegible, bundled with Fontsource (SIL Open Font License 1.1).</li>
        </ul>
        <p>No analytics, advertising or tracking code is included, and the site makes no requests to other servers.</p>
      </section>
      <section className="prose" aria-labelledby="ai">
        <h2 id="ai">AI assistance disclosure</h2>
        <Callout icon="info">
          <p>An AI coding assistant (Claude, by Anthropic) was used during development to help research, write code, draft lesson text and write the illustration code for this project. The team is responsible for everything on this site. The project repository keeps a record of AI use in <code>docs/AI_USE_LOG.md</code>.</p>
        </Callout>
      </section>
    </div>
  );
}
