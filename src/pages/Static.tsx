import type { ReactNode } from 'react';
import { Link } from '@/router';
import { Callout } from '@/ui/primitives';
import { PATHS } from '@/content/paths';
import { Gangway, NoticeBoard, PrintTable } from '@/art/PageScenes';

const ext = (href: string, label: string) => (
  <a href={href} target="_blank" rel="noopener noreferrer">
    {label}
    <span className="visually-hidden"> (opens in a new tab)</span>
  </a>
);

/** The shape the three reference pages share: a title, the text, and beside it a picture and a list of what is on the page. */
function Doc({ title, lead, art, toc, children }: { title: string; lead: string; art: ReactNode; toc: [id: string, label: string][]; children: ReactNode }) {
  return (
    <div className="wrap page doc">
      <header className="doc__head">
        <h1>{title}</h1>
        <p className="page-head__lead">{lead}</p>
      </header>
      <div className="doc__grid">
        <div className="doc__body prose-page">{children}</div>
        <aside className="doc__side">
          {art}
          <nav aria-label="On this page" className="doc__toc">
            <p className="label">On this page</p>
            <ul>
              {toc.map(([id, label]) => (
                <li key={id}>
                  <a href={`#${id}`}>{label}</a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      </div>
    </div>
  );
}

export function About() {
  return (
    <Doc
      title="About Tideweight"
      lead="A free, game-inspired AI learning portal for students in grades 9 to 12, built for the TSA Webmaster event, 2026-27."
      art={<NoticeBoard className="plate" />}
      toc={[
        ['what', 'What it teaches'],
        ['game', 'The game'],
        ['research', 'How the content was researched'],
        ['built', 'How the site is built'],
        ['limits', 'What we are upfront about'],
      ]}
    >
      <section className="prose" aria-labelledby="what">
        <h2 id="what">What it teaches</h2>
        <p>The portal answers the three parts of the challenge: fundamental AI concepts, practical AI tools and techniques, and ethical AI use in school.</p>
        <ul>
          {PATHS.map((p) => (
            <li key={p.id}>
              <strong>{p.title}.</strong> {p.tsaSection}. {p.lessons.length} lessons at {p.place}. <Link to={`/learn/${p.id}`}>Open the path</Link>.
            </li>
          ))}
        </ul>
        <p>Progress, XP, ten ranks and nine badges track real work: finishing the lessons, solving the experiments, passing the checks and the final certification. Everything is saved only in your browser.</p>
      </section>
      <section className="prose" aria-labelledby="game">
        <h2 id="game">The game</h2>
        <p>
          <Link to="/play">Tideweight: the lamplighter&apos;s harbor</Link> is the hands-on side of the same three learning areas. You walk a harbor, step into six buildings, work small games called stations, and find hidden relics that each explain one idea. Every station has an objective, a way to clear it, feedback that says why, and an XP reward, and every one of them is tied to a lesson.
        </p>
        <ul>
          <li><strong>Fundamental AI concepts.</strong> The Loom House: the Curator&apos;s Cabinet (learning from labeled examples, and why coverage matters) and the Weight Frame (weights, bias and training). The Archive: the Timeline of Minds (the history of AI). Lessons: Understand AI.</li>
          <li><strong>Practical AI tools and techniques.</strong> The Foundry Docks: the Anvil Orders (the five parts of a prompt, and keeping private details out) and the Weld Test (checking AI output when you cannot check everything). Lessons: Use AI.</li>
          <li><strong>Ethical AI use.</strong> The Beacon: the Fairness Audit (bias, proxy traits, and what fixing it costs). The Trial Hall: six school scenarios and the final examination. Lessons: Use AI Responsibly.</li>
          <li><strong>Your records.</strong> The Harbor Office: missions, the logbook and the Codex.</li>
        </ul>
        <p>
          Nothing is hidden behind the game. Every lesson, the Codex and the tools stay open from the main menu, and the pause menu has an <em>Open every door</em> switch for anyone who wants to see everything. The stations are teaching simulations: the prompt forge follows fixed rules and is not a live AI, the classifier is a one-nearest-neighbor model, and the people in the audit are invented.
        </p>
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
      <section className="prose" aria-labelledby="built">
        <h2 id="built">How the site is built</h2>
        <p>Tideweight is a single-page site written in TypeScript with React, a user-interface library, and built with Vite. No website builder, page template or theme was used. The layout, the styles and every illustration were made for this project.</p>
        <p>The pictures are drawn by code. A small brush engine in the project turns a few points into tapered ink strokes, hatching and dry-brush marks, so every picture on the site shares one pen. The experiments are small real programs: the neural network trains in your browser, and you can read its code in the project.</p>
        <p>There is no server. Your progress is kept in your browser&apos;s own storage, and you can download it or erase it from the <Link to="/logbook">Logbook</Link>.</p>
      </section>
      <section className="prose" aria-labelledby="limits">
        <h2 id="limits">What we are upfront about</h2>
        <Callout icon="info">
          <p>The Tool Atlas lists only tools whose rules we could check, each with the date. Some facts are marked “Reported, confirm” because we could not read the vendor page directly. The Prompt Lab uses pre-written sample responses and is not a live AI. The experiments are deliberately tiny so you can see how they work.</p>
        </Callout>
        <p>AI products change quickly. Treat dates on this site as a starting point and check the vendor&apos;s own page before you rely on a rule.</p>
      </section>
    </Doc>
  );
}

export function Accessibility() {
  return (
    <Doc
      title="Accessibility"
      lead="We aim for WCAG 2.2 level AA. Here is what we did and what we know is still imperfect."
      art={<Gangway className="plate" />}
      toc={[
        ['did', 'What we did'],
        ['known', 'Known limits'],
      ]}
    >
      <section className="prose" aria-labelledby="did">
        <h2 id="did">What we did</h2>
        <ul>
          <li><strong>Keyboard.</strong> Every control is a real link, button, input or select, reachable in a sensible order with a clear focus ring. A skip link jumps past the navigation. Nothing needs a mouse or a drag.</li>
          <li><strong>Structure.</strong> One main heading per page, a logical heading order, landmarks, and labels on every form field.</li>
          <li><strong>Colour.</strong> Text and key interface colours are checked against WCAG AA contrast by a script in the project (<code>pnpm contrast</code>). Meaning is never carried by colour alone. Right and wrong answers also show words and icons, and locked badges are hatched and carry a padlock.</li>
          <li><strong>Targets.</strong> Buttons and options are at least 48 pixels tall.</li>
          <li><strong>The game.</strong> It plays from the keyboard (arrow keys or A and D to walk, E to use, Esc to pause), by touch with on-screen buttons or by tapping where to go, and by mouse. Under the picture, an <em>In this room</em> list offers everything in the room as plain buttons, so the game never depends on walking or on seeing the picture. Windows over the game trap focus and give it back. Sound is off until you turn it on and nothing needs it. Walking animation, camera easing, fades and pulsing stop when your system asks for reduced motion.</li>
          <li><strong>Motion and sound.</strong> Movement is short and answers something you did. Nothing loops, and it all stops when your device asks for reduced motion. Sound is off by default and optional.</li>
          <li><strong>Text.</strong> Body text uses Atkinson Hyperlegible, a typeface designed for legibility.</li>
          <li><strong>Pictures.</strong> Every illustration has a text description. Where a picture shows your progress, such as the lanterns over the harbor or the scrolls in the Codex cabinet, the same numbers are written next to it. Diagrams have captions, and each experiment has a written summary of its result.</li>
        </ul>
      </section>
      <section className="prose" aria-labelledby="known">
        <h2 id="known">Known limits</h2>
        <ul>
          <li>The decision-map plots in two experiments are visual. Their results are always repeated in text, but you cannot explore the plot itself with a screen reader.</li>
          <li>The chart of the harbor on the Learn page scrolls sideways on small screens. Every stop on it is also in the list underneath.</li>
          <li>We tested with an automated checker and by keyboard. We have not yet tested with every screen reader, so some rough edges may remain.</li>
        </ul>
        <p>If something does not work for you, tell your teacher or TSA advisor so it can be passed on and fixed.</p>
      </section>
    </Doc>
  );
}

export function Credits() {
  return (
    <Doc
      title="Credits"
      lead="What this site is made of."
      art={<PrintTable className="plate" />}
      toc={[
        ['art', 'Artwork and sound'],
        ['soft', 'Software and fonts'],
      ]}
    >
      <section className="prose" aria-labelledby="art">
        <h2 id="art">Artwork and sound</h2>
        <p>All illustrations, characters, badges, rank insignia and icons are original artwork drawn in code for this project, in one shared ink-and-print style. No stock images are used. Interface sounds, the game\u2019s footsteps and room ambience, and the optional music are synthesized in your browser and use no audio files.</p>
        <p>The look is influenced by ink illustration, woodblock printing and the menus of competitive games. No characters, scenes, logos or sounds from any other work are copied.</p>
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
    </Doc>
  );
}
