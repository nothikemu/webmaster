import type { ReactNode } from 'react';
import { Link } from '@/router';
import { Callout } from '@/ui/primitives';
import { MODULES, coreLessons, furtherLessons } from '@/content/modules';

const ext = (href: string, label: string) => (
  <a href={href} target="_blank" rel="noopener noreferrer">
    {label}
    <span className="visually-hidden"> (opens in a new tab)</span>
  </a>
);

/** The shape the three reference pages share: a title, the text, and beside it a list of what is on the page. */
function Doc({ kicker, title, lead, toc, children }: { kicker: string; title: ReactNode; lead: string; toc: [id: string, label: string][]; children: ReactNode }) {
  return (
    <div className="wrap page doc">
      <header className="page-head">
        <p className="kicker">{kicker}</p>
        <h1>{title}</h1>
        <p className="page-head__lead">{lead}</p>
      </header>
      <div className="doc__grid">
        <aside className="doc__side">
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
        <div className="doc__body prose">{children}</div>
      </div>
    </div>
  );
}

export function About() {
  return (
    <Doc
      kicker="About and sources"
      title={
        <>
          About <em>Parameter</em>
        </>
      }
      lead="A free, illustrated guide to how AI works, for students in grades 9 to 12, built for the TSA Webmaster event, 2026–27."
      toc={[
        ['what', 'What it teaches'],
        ['use', 'How to use it'],
        ['data', 'Your data'],
        ['research', 'How the content was researched'],
        ['built', 'How the site is built'],
        ['limits', 'What we are upfront about'],
      ]}
    >
      <section aria-labelledby="what">
        <h2 id="what">What it teaches</h2>
        <p>The portal answers the three parts of the challenge: fundamental AI concepts, practical AI tools and techniques, and ethical AI use.</p>
        <ul>
          {MODULES.map((m) => (
            <li key={m.id}>
              <strong>
                {m.number}. {m.title}.
              </strong>{' '}
              {m.tsaSection}. {coreLessons(m).length} core lessons and {furtherLessons(m).length} optional ones, and one instrument: {m.centerpiece.name.toLowerCase()}. <Link to={`/modules/${m.id}`}>Open the module</Link>.
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="use">
        <h2 id="use">How to use it</h2>
        <p>Every lesson is open from the start, in any order. A lesson is a few minutes of reading, sometimes a guided experiment, and a short check. The checks are for you: they are untimed, they explain every answer, you can try them again, and nothing is scored or unlocked.</p>
        <p>Earlier versions of Parameter had points, levels, badges and a game. They were taken out so that nothing here competes with the ideas for your attention.</p>
      </section>
      <section aria-labelledby="data">
        <h2 id="data">Your data</h2>
        <p>
          There are no accounts and no server. The only thing the site stores is which lessons you have opened and which you marked complete, kept in your browser&apos;s own storage. You can download that, load it on another device, or erase it from the <Link to="/overview">overview</Link>. If you used an earlier version on this device, your finished lessons were carried over and the earlier save was left untouched.
        </p>
      </section>
      <section aria-labelledby="research">
        <h2 id="research">How the content was researched</h2>
        <p>The lessons follow published AI education guidance, and the lessons that come from it name the idea they serve. References are in APA style. “n.d.” means the page shows no date.</p>
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
        <p>
          The studies behind the Foundations, Synthesis and Ethics lessons (training-data extraction, physical adversarial attacks, few-shot learning, chain-of-thought prompting, model cards and the EU AI Act) are listed on the <Link to="/credits#research">credits page</Link>.
        </p>
      </section>
      <section aria-labelledby="built">
        <h2 id="built">How the site is built</h2>
        <p>
          Parameter is a single-page site written in TypeScript with React, a user-interface library, and built with Vite. No website builder, page template or theme was used. The layout, the styles and every illustration were made for this project.
        </p>
        <p>
          The pictures are drawn by code. A small brush engine in the project turns a few points into tapered ink strokes, hatching and stippling, so every picture on the site shares one pen. The experiments are small real programs: the neural network in Foundations trains in your browser, and you can read its code in the project.
        </p>
      </section>
      <section aria-labelledby="limits">
        <h2 id="limits">What we are upfront about</h2>
        <Callout icon="info">
          <p>
            The tool atlas lists only tools whose rules we could check, each with the date. Some facts are marked “Reported, confirm” because we could not read the vendor page directly. The prompt console in Synthesis is a deterministic simulation, not a live AI, and says so on the page. The experiments are deliberately tiny so you can see how they work.
          </p>
        </Callout>
        <p>AI products change quickly. Treat dates on this site as a starting point and check the vendor&apos;s own page before you rely on a rule.</p>
      </section>
    </Doc>
  );
}

export function Accessibility() {
  return (
    <Doc
      kicker="Accessibility"
      title={
        <>
          <em>Accessibility</em> statement
        </>
      }
      lead="The target is WCAG 2.2 level AA. Here is what is built in, how it is checked, and what is still imperfect."
      toc={[
        ['built', 'What is built in'],
        ['checked', 'How it is checked'],
        ['known', 'Known limits'],
        ['feedback', 'Feedback'],
      ]}
    >
      <section aria-labelledby="built">
        <h2 id="built">What is built in</h2>
        <ul>
          <li><strong>Keyboard.</strong> Every control is a real link, button, input or select, reachable in a sensible order with a visible focus ring. A skip link jumps past the navigation. Nothing needs a mouse, a drag or a hover.</li>
          <li><strong>Structure.</strong> One main heading per page, a logical heading order, landmarks, and a label on every form field. Focus moves to the page when you move to another page.</li>
          <li><strong>Menu.</strong> On narrow screens the navigation becomes a menu that opens as a dialog: focus stays inside it, Escape closes it, and focus returns to the button.</li>
          <li><strong>Colour.</strong> Text and key interface colours are checked against WCAG AA contrast by a script in the project (<code>pnpm contrast</code>). Meaning is never carried by colour alone: correct and incorrect answers, and the state of a lesson, always have a word as well.</li>
          <li><strong>Targets.</strong> Buttons, links in menus and answer options are at least 44 pixels tall.</li>
          <li><strong>Reflow.</strong> Pages are laid out again, not shrunk, for narrow screens, and have no sideways scrolling at 320 CSS pixels wide or at 200 percent zoom. Wide tables scroll inside a labelled region you can reach with the keyboard.</li>
          <li><strong>Motion.</strong> Movement is short and answers something you did. Nothing loops or plays on its own, and all of it stops when your device asks for reduced motion.</li>
          <li><strong>Text.</strong> Body text is a serif set at about 19 pixels with a comfortable line length. Interface text uses Atkinson Hyperlegible, a typeface designed for legibility.</li>
          <li><strong>Pictures and instruments.</strong> Every illustration has a text description, and the labels on drawings are real text. Each instrument has keyboard controls and a written explanation of what it shows and why.</li>
        </ul>
      </section>
      <section aria-labelledby="checked">
        <h2 id="checked">How it is checked</h2>
        <p>Each build runs the project&apos;s checks, including the contrast script. The pages were also scanned with the axe-core accessibility checker in a real browser and tried by keyboard at several screen widths. Automated checks catch only part of what matters.</p>
      </section>
      <section aria-labelledby="known">
        <h2 id="known">Known limits</h2>
        <ul>
          <li>The drawings in the lessons and the instruments are visual by nature. Their meaning is always written out in text beside them, but the text cannot replace seeing the picture.</li>
          <li>The neural topology and decision-map plots are explored with a keyboard and described in text, but we have not tested them with every screen reader, so some rough edges may remain.</li>
          <li>Links to outside pages open sites that have their own accessibility.</li>
        </ul>
      </section>
      <section aria-labelledby="feedback">
        <h2 id="feedback">Feedback</h2>
        <p>If something here does not work for you, tell your teacher or TSA advisor so it can be passed on and fixed. Please say which page it was and what assistive technology you used.</p>
      </section>
    </Doc>
  );
}

export function Credits() {
  return (
    <Doc
      kicker="Credits"
      title={
        <>
          Credits and <em>citations</em>
        </>
      }
      lead="What this site is made of, and the research its lessons draw on."
      toc={[
        ['research', 'Research cited in the lessons'],
        ['art', 'Writing and artwork'],
        ['soft', 'Software and fonts'],
      ]}
    >
      <section aria-labelledby="research">
        <h2 id="research">Research cited in the lessons</h2>
        <ul>
          <li>Buolamwini and Gebru, Gender Shades, 2018: per-group error rates of commercial face-analysis systems.</li>
          <li>Carlini et al., Extracting Training Data from Large Language Models, 2021.</li>
          <li>Eykholt et al., Robust Physical-World Attacks on Deep Learning Models, 2018.</li>
          <li>Brown et al., Language Models are Few-Shot Learners, 2020.</li>
          <li>Wei et al., Chain-of-Thought Prompting Elicits Reasoning in Large Language Models, 2022.</li>
          <li>Mitchell et al., Model Cards for Model Reporting, 2019.</li>
          <li>Regulation (EU) 2024/1689, the EU AI Act.</li>
        </ul>
        <p>Guidance and cases used in the other lessons are listed, with links, on the <Link to="/about#research">about page</Link>.</p>
      </section>
      <section aria-labelledby="art">
        <h2 id="art">Writing and artwork</h2>
        <p>The words, the lesson content, the icons and every illustration were written or drawn for this project. The illustrations are made in code with a small brush engine: tapered lines, uneven edges, hatching and stippling, so that they look inked by hand. No stock photography, video or audio is used.</p>
        <p>The look is influenced by printed natural-history field guides and laboratory notebooks. No characters, scenes, logos or text from any other work are copied.</p>
      </section>
      <section aria-labelledby="soft">
        <h2 id="soft">Software and fonts</h2>
        <ul>
          <li>React, the user-interface library (MIT license).</li>
          <li>Vite and TypeScript, the build tool and the language (MIT license; Apache-2.0 license).</li>
          <li>Newsreader, a typeface by Production Type for Google Fonts, used for headings and reading text (SIL Open Font License 1.1).</li>
          <li>IBM Plex Mono, used for labels, figure numbers and numerals (SIL Open Font License 1.1).</li>
          <li>Atkinson Hyperlegible, designed by the Braille Institute, used for interface text (SIL Open Font License 1.1).</li>
          <li>The fonts are bundled with Fontsource and served from this site.</li>
          <li>Vitest, Playwright and axe-core, used to test the site (MIT; Apache-2.0; MPL-2.0).</li>
        </ul>
        <p>No analytics, advertising or tracking code is included, and the site makes no requests to other servers.</p>
      </section>
    </Doc>
  );
}
