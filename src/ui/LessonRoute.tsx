import { Link } from '@/router';
import { Icon } from '@/art/Icons';
import { lessonSteps, recommendNext } from '@/engine/progress';
import { useProgress } from '@/engine/store';
import { lessonNumber } from '@/content/paths';
import type { PathContent } from '@/content/types';
import { Chip } from './primitives';

/**
 * The lessons of a path as a route with stops. Every stop is a real link that states its status in words and shapes,
 * never by colour alone. All lessons are open: nothing is locked, so students can explore in any order.
 */
export function LessonRoute({ path }: { path: PathContent }) {
  const state = useProgress((s) => s);
  const rec = recommendNext(state);
  return (
    <ol className="route-list" data-path={path.id}>
      {path.lessons.map((lesson) => {
        const st = lessonSteps(state, lesson.id);
        const status = st.done ? 'Finished' : st.started ? 'In progress' : 'Not started';
        const n = lessonNumber(lesson);
        return (
          <li key={lesson.id} className={`stop${st.done ? ' is-done' : ''}${st.started && !st.done ? ' is-active' : ''}`}>
            <span className="stop__node" aria-hidden="true">
              {st.done ? <Icon name="check" /> : n}
            </span>
            <Link to={`/learn/${path.id}/${lesson.id}`} className="stop__link">
              <span className="stop__title">{lesson.title}</span>
              <span className="stop__meta">
                {lesson.kicker} · {lesson.minutes} min
              </span>
              <span className="stop__steps" aria-label={`Steps done: learn ${st.learn ? 'yes' : 'no'}, experiment ${st.try ? 'yes' : 'no'}, check ${st.check ? 'yes' : 'no'}`}>
                <span className={st.learn ? 'on' : ''}>Learn</span>
                <span className={st.try ? 'on' : ''}>Try</span>
                <span className={st.check ? 'on' : ''}>Check</span>
              </span>
            </Link>
            <span className="stop__status">
              {rec.lesson === lesson.id ? <Chip tone="seal" icon="flag">Up next</Chip> : null}
              <span className="stop__word">{status}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
