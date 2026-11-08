import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { MODULES, getModule, type ModuleId } from '../content';
import { announce } from '../core/announce';
import { t } from '../core/assets';
import { BADGE_QUIZ_MIN, levelInfo } from '../core/gamification';
import { exportProgress, parseImport } from '../core/persistence';
import { dayKey, masteryRank } from '../core/schema';
import { useServices } from '../core/services';
import { Link } from '../router';
import { CurriculumMap, MapSummary, Mark, lessonNodeState } from '../ui/CurriculumMap';
import { useData, useOverall, useRecommendation, useSnapshot, useTween } from '../ui/hooks';
import { edgeClass } from '../ui/edge';

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKS = 12;

function lastDays(n: number): string[] {
  const out: string[] = [];
  const now = Date.now();
  for (let i = n - 1; i >= 0; i--) out.push(dayKey(now - i * DAY_MS));
  return out;
}

function shortDate(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/** Fourteen days of XP as columns. Every height is a day's saved total; the best day is marked in amber. */
function XpHistory(): ReactNode {
  const { xpByDay } = useData();
  const days = lastDays(14);
  const values = days.map((d) => xpByDay[d] ?? 0);
  const peak = Math.max(...values);
  const top = Math.max(50, Math.ceil(peak / 50) * 50);
  const total = values.reduce((a, b) => a + b, 0);
  const active = values.filter((v) => v > 0).length;
  const bestIndex = peak > 0 ? values.indexOf(peak) : -1;
  const summary =
    total === 0
      ? t('pd.xpSummaryNone', { days: 14 })
      : t('pd.xpSummary', {
          total,
          days: 14,
          active,
          best: peak,
          date: shortDate(days[bestIndex]!),
        });
  return (
    <figure className="chart xp-chart">
      <div className="xp-plot">
        <ul className="xp-scale" aria-hidden="true">
          {[top, top / 2, 0].map((v) => (
            <li key={v}>
              <span className="num">{v}</span>
            </li>
          ))}
        </ul>
        <div className="xp-bars" role="img" aria-label={t('pd.xpLabel', { total, days: 14 })}>
          {values.map((v, i) => (
            <div key={days[i]} data-best={i === bestIndex || undefined}>
              <span className="xp-col">
                <span
                  className="xp-fill"
                  style={{ height: `${(v / top) * 100}%` }}
                  data-empty={v === 0}
                />
                {i === bestIndex && <span className="xp-val num">{v}</span>}
              </span>
              <span className="xp-day num">{days[i]!.slice(8)}</span>
            </div>
          ))}
        </div>
      </div>
      <figcaption>{summary}</figcaption>
    </figure>
  );
}

/** Twelve weeks, Monday to Sunday down each column, with month and weekday labels from the real dates. */
function StreakCalendar(): ReactNode {
  const { activeDays, streak } = useData();
  const cells = useMemo(() => {
    const today = new Date();
    const dow = (today.getDay() + 6) % 7; // Monday = 0
    const total = WEEKS * 7;
    const list: Array<{ key: string; count: number; future: boolean; today: boolean; ms: number }> =
      [];
    const start = Date.now() - (total - 1 - (6 - dow)) * DAY_MS;
    const todayKey = dayKey(Date.now());
    for (let i = 0; i < total; i++) {
      const ms = start + i * DAY_MS;
      const key = dayKey(ms);
      list.push({
        key,
        count: activeDays[key] ?? 0,
        future: ms > Date.now() + DAY_MS / 2,
        today: key === todayKey,
        ms,
      });
    }
    return list;
  }, [activeDays]);
  const level = (n: number): number => (n === 0 ? 0 : n < 3 ? 1 : n < 6 ? 2 : 3);
  const past = cells.filter((c) => !c.future);
  const activeCount = past.filter((c) => c.count > 0).length;
  const months = cells
    .map((c, i) => ({ i, c }))
    .filter(
      ({ i, c }) =>
        i % 7 === 0 &&
        (i === 0 || new Date(c.ms).getMonth() !== new Date(cells[i - 7]!.ms).getMonth()),
    )
    .map(({ i, c }) => ({
      col: i / 7,
      label: new Date(c.ms).toLocaleDateString('en-US', { month: 'short' }),
    }));
  const legend: Array<[number, string]> = [
    [0, t('pd.cal0')],
    [1, t('pd.cal1')],
    [2, t('pd.cal2')],
    [3, t('pd.cal3')],
  ];
  return (
    <figure className="chart cal-chart">
      <div className="cal">
        {months.map((m) => (
          <span
            key={m.col}
            className="cal-month"
            style={{ gridColumn: m.col + 2, gridRow: 1 }}
            aria-hidden="true"
          >
            {m.label}
          </span>
        ))}
        {['M', 'W', 'F'].map((d, i) => (
          <span
            key={d}
            className="cal-dow"
            style={{ gridColumn: 1, gridRow: 2 + i * 2 }}
            aria-hidden="true"
          >
            {d}
          </span>
        ))}
        <ul className="calendar" aria-label={t('pd.calLabel', { weeks: WEEKS })}>
          {cells.map((c) => (
            <li
              key={c.key}
              data-level={c.future ? 'x' : level(c.count)}
              data-today={c.today || undefined}
              aria-label={c.future ? undefined : t('pd.calDay', { day: c.key, n: c.count })}
              aria-hidden={c.future || undefined}
            />
          ))}
        </ul>
      </div>
      <ul className="cal-legend" aria-label={t('pd.calLegend')}>
        {legend.map(([l, label]) => (
          <li key={l}>
            <i data-level={l} aria-hidden="true" />
            {label}
          </li>
        ))}
        <li>
          <i data-today="true" data-level="0" aria-hidden="true" />
          {t('pd.today')}
        </li>
      </ul>
      <figcaption>
        {t('pd.calSummary', {
          n: activeCount,
          total: past.length,
          current: streak.current,
          best: streak.best,
        })}
      </figcaption>
    </figure>
  );
}

function Heatmap(): ReactNode {
  const data = useData();
  return (
    // A horizontally scrollable region must be reachable by keyboard (WCAG 2.1.1), so it takes a tab stop and a name.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
    <div className="table-wrap" role="region" aria-label={t('pd.mastery')} tabIndex={0}>
      <table className="heatmap">
        <caption className="sr-only">{t('pd.heatCaption')}</caption>
        <thead>
          <tr>
            <th scope="col">{t('pd.module')}</th>
            {Array.from({ length: 5 }, (_, i) => (
              <th key={i} scope="col" className="num">
                {i + 1}
              </th>
            ))}
            <th scope="col">{t('module.check')}</th>
            <th scope="col">{t('module.challenge')}</th>
          </tr>
        </thead>
        <tbody>
          {MODULES.map((m) => {
            const d = data.modules[m.id];
            return (
              <tr key={m.id}>
                <th scope="row">{m.title}</th>
                {m.lessons.map((l) => {
                  const s = d.lessons[l.id] ?? 'unseen';
                  return (
                    <td key={l.id} data-state={s} data-rank={masteryRank(s)}>
                      {t(`mastery.${s}`)}
                    </td>
                  );
                })}
                <td
                  data-state={
                    d.quiz.best >= 4 ? 'mastered' : d.quiz.attempts > 0 ? 'practiced' : 'unseen'
                  }
                >
                  <span className="num">{d.quiz.best}/5</span>
                </td>
                <td
                  data-state={
                    d.challenge.done
                      ? 'mastered'
                      : d.challenge.attempts > 0
                        ? 'practiced'
                        : 'unseen'
                  }
                >
                  <span>
                    {d.challenge.done
                      ? t('check.done')
                      : d.challenge.attempts > 0
                        ? t('pd.tried')
                        : '-'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DataControls(): ReactNode {
  const { store, signer, actor } = useServices();
  const game = actor.getSnapshot().context.game;
  const resetting = useSnapshot(game).matches('confirmingReset');
  const [message, setMessage] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  // Focus lands on the safe choice, so a stray Enter keeps the progress instead of erasing it.
  const keepRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (resetting) keepRef.current?.focus();
  }, [resetting]);

  const doExport = async (): Promise<void> => {
    const text = await exportProgress(signer, store.getState().data, Date.now());
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `parameter-progress-${dayKey(Date.now())}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage(t('pd.exported'));
    announce(t('pd.exported'));
  };

  const doImport = async (e: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 512 * 1024) {
      setMessage(t('pd.importTooBig'));
      return;
    }
    const result = await parseImport(await file.text(), signer, Date.now());
    if (!result.ok) {
      setMessage(`${t('pd.importFailed')} ${result.reason}`);
      return;
    }
    store.getState().replace(result.state);
    actor.send({
      type: 'BADGE_SYNC',
      unlocked: {
        foundations: result.state.modules.foundations.badge,
        synthesis: result.state.modules.synthesis.badge,
        ethics: result.state.modules.ethics.badge,
      },
    });
    setMessage(t('pd.imported'));
    announce(t('pd.imported'));
  };

  return (
    <section aria-labelledby="data-h" className={`data-controls ${edgeClass}`}>
      <h2 id="data-h" className="h2">
        {t('pd.dataTitle')}
      </h2>
      <div className="data-groups">
        <div className="data-group">
          <h3>{t('pd.backupTitle')}</h3>
          <div className="check-actions">
            <button type="button" className="btn btn-ghost" onClick={() => void doExport()}>
              {t('pd.export')}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => fileRef.current?.click()}
            >
              {t('pd.import')}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              tabIndex={-1}
              aria-label={t('pd.importFile')}
              onChange={(e) => void doImport(e)}
            />
          </div>
        </div>
        <div className="data-group">
          <h3>{t('pd.startOverTitle')}</h3>
          {!resetting && (
            <div className="check-actions">
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => actor.send({ type: 'RESET_REQUEST' })}
              >
                {t('pd.reset')}
              </button>
            </div>
          )}
        </div>
      </div>
      {resetting && (
        <div
          className="confirm glass"
          role="alertdialog"
          aria-labelledby="confirm-h"
          aria-describedby="confirm-b"
        >
          <h3 id="confirm-h" className="mono sub">
            {t('pd.confirmTitle')}
          </h3>
          <p id="confirm-b" className="prose">
            {t('pd.confirmBody')}
          </p>
          <div className="check-actions">
            <button
              ref={keepRef}
              type="button"
              className="btn btn-ghost"
              onClick={() => actor.send({ type: 'RESET_CANCEL' })}
              onKeyDown={(e) => e.key === 'Escape' && actor.send({ type: 'RESET_CANCEL' })}
            >
              {t('pd.keep')}
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => actor.send({ type: 'RESET_CONFIRM' })}
            >
              {t('pd.confirm')}
            </button>
          </div>
        </div>
      )}
      <p className="muted" role="status" aria-live="polite">
        {message}
      </p>
    </section>
  );
}

/** Each module's whole ladder in one row: five lessons, the check, the challenge, the badge. */
function Ladder({ id }: { id: ModuleId }): ReactNode {
  const m = getModule(id);
  const d = useData().modules[id];
  return (
    <span className="ladder" data-module={id} aria-hidden="true">
      {m.lessons.map((l) => (
        <Mark
          key={l.id}
          kind="lesson"
          state={lessonNodeState(d.lessons[l.id] ?? 'unseen')}
          size={22}
        />
      ))}
      <Mark
        kind="check"
        state={d.quiz.best >= BADGE_QUIZ_MIN ? 'done' : d.quiz.attempts > 0 ? 'started' : 'none'}
        size={22}
      />
      <Mark
        kind="challenge"
        state={d.challenge.done ? 'done' : d.challenge.attempts > 0 ? 'started' : 'none'}
        size={22}
      />
      <Mark kind="badge" state={d.badge ? 'done' : 'none'} size={22} />
    </span>
  );
}

export default function ProgressDashboard(): ReactNode {
  const data = useData();
  const overall = useOverall();
  const rec = useRecommendation();
  const level = levelInfo(data.xp);
  const xpT = useTween(data.xp);
  return (
    <div className="wrap page dashboard">
      <header className="page-head">
        <h1 className="display">{t('pd.title')}</h1>
      </header>

      <section className="pd-top" aria-label={t('pd.summary')}>
        <div className="pd-level glass edge" data-surface="ink">
          <p className="label">{t('hub.level', { level: level.level })}</p>
          <p className="pd-level-n num">{level.level}</p>
          <div className="pd-level-copy">
            <p className="pd-level-name">{level.name}</p>
            <p className="num">
              {Math.round(xpT).toLocaleString('en-US')} <span className="muted">XP</span>
            </p>
          </div>
          <span
            className="bar"
            role="img"
            aria-label={t('hub.toNext', {
              xp: Math.max(0, level.span - level.into),
              level: level.level + 1,
            })}
          >
            <span style={{ transform: `scaleX(${Math.max(0.01, level.fraction)})` }} />
          </span>
          <p className="muted num">
            {t('hub.toNext', { xp: Math.max(0, level.span - level.into), level: level.level + 1 })}
          </p>
        </div>
        <div className="pd-stat glass">
          <p className="label">{t('pd.streak')}</p>
          <p className="pd-stat-n num">{data.streak.current}</p>
          <p className="muted">{t('pd.streakBest', { n: data.streak.best })}</p>
        </div>
        <div className="pd-stat glass">
          <p className="label">{t('home.overall')}</p>
          <p className="pd-stat-n num">{overall}%</p>
          <p className="muted">{t('pd.byModule')}</p>
        </div>
        <div className="pd-next glass edge">
          <p className="label">{t('hub.next')}</p>
          <p className="pd-next-title">{rec.label}</p>
          <p className="muted">{rec.reason}</p>
          <Link to={rec.href} className="btn btn-primary">
            {rec.kind === 'start' ? t('home.begin') : t('home.continue')}
          </Link>
        </div>
      </section>

      <section aria-labelledby="map-h" className="pd-section">
        <h2 id="map-h" className="h2">
          {t('pd.mapTitle')}
        </h2>
        <CurriculumMap />
        <MapSummary />
      </section>

      <section aria-labelledby="mods-h" className="pd-section">
        <h2 id="mods-h" className="h2">
          {t('pd.byModule')}
        </h2>
        <ul className="mod-bars">
          {MODULES.map((m) => (
            <li key={m.id} data-module={m.id}>
              <span className="mod-bar-name">
                <span className="mod-bar-n" aria-hidden="true">
                  {String(m.index).padStart(2, '0')}
                </span>
                {m.title}
              </span>
              <Ladder id={m.id} />
              <span
                className="bar"
                role="img"
                aria-label={`${m.title}: ${data.modules[m.id].progress} percent`}
              >
                <span
                  style={{
                    transform: `scaleX(${Math.max(0.005, data.modules[m.id].progress / 100)})`,
                  }}
                />
              </span>
              <span className="num mod-bar-pct">{data.modules[m.id].progress}%</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="pd-two">
        <section aria-labelledby="xp-h" className="pd-section">
          <h2 id="xp-h" className="h2">
            {t('pd.xpHistory')}
          </h2>
          <XpHistory />
        </section>
        <section aria-labelledby="cal-h" className="pd-section">
          <h2 id="cal-h" className="h2">
            {t('pd.streakCal')}
          </h2>
          <StreakCalendar />
        </section>
      </div>

      <section aria-labelledby="heat-h" className="pd-section">
        <h2 id="heat-h" className="h2">
          {t('pd.mastery')}
        </h2>
        <Heatmap />
      </section>

      <DataControls />
    </div>
  );
}
