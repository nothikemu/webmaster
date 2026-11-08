import { useRef, useState } from 'react';
import { Link } from '@/router';
import { Medal } from '@/art/Medals';
import { Icon } from '@/art/Icons';
import { BADGES, CHECK_PASS, XP, levelInfo, overallProgress, pathProgress, recommendNext, lessonSteps } from '@/engine/progress';
import { dispatch, importProgress, resetAll, storageInfo, useProgress, getState } from '@/engine/store';
import { exportJson } from '@/engine/persistence';
import { LESSONS, PATHS, lessonById } from '@/content/paths';
import { Btn, Callout, Chip, LinkBtn, Meter, PageHead, Panel } from '@/ui/primitives';
import { configureSound, play } from '@/audio/sfx';

const dayLabel = (iso: string) => new Date(iso + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

export default function Logbook() {
  const state = useProgress((s) => s);
  const lv = levelInfo(state.xp);
  const overall = overallProgress(state);
  const rec = recommendNext(state);
  const recLesson = rec.lesson ? lessonById(rec.lesson) : undefined;
  const [confirmReset, setConfirmReset] = useState(false);
  const [msg, setMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const info = storageInfo();

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 86400000).toISOString().slice(0, 10);
    return { d, xp: state.xpByDay[d] ?? 0 };
  });
  const maxXp = Math.max(40, ...days.map((x) => x.xp));
  const earned = BADGES.filter((b) => state.badges[b.id]);

  const download = () => {
    const blob = new Blob([exportJson(getState())], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tideweight-progress.json';
    a.click();
    URL.revokeObjectURL(url);
    setMsg('Progress file downloaded.');
  };
  const onFile = async (f: File | undefined) => {
    if (!f) return;
    const r = importProgress(await f.text());
    setMsg(r.ok ? 'Progress imported.' : r.reason);
  };

  return (
    <div className="wrap page logbook">
      <PageHead title="Logbook" kicker="Your progress" lead="Everything here is stored only in this browser. There are no accounts and nothing is sent to a server." />
      {!info.persistent ? <Callout icon="warning" tone="bad"><p><strong>Saving is blocked in this browser window</strong> (private mode or blocked storage). Your progress works now but will be lost when you close the tab. Use “Download progress” below to keep a copy.</p></Callout> : null}
      {info.loadStatus === 'recovered' ? <Callout icon="warning"><p>A saved file could not be read, so you are starting fresh. The unreadable data was kept under a separate key in case it can be recovered.</p></Callout> : null}

      <section className="lb-top" aria-label="Level and next step">
        <Panel tone="ink" className="lb-level">
          <p className="label">Level</p>
          <p className="lb-level__num">{lv.level}</p>
          <p className="lb-level__name">{lv.name}</p>
          <Meter value={lv.pct} label={`Progress to the next level, ${lv.pct} percent`} />
          <p className="small">{state.xp} XP{lv.next ? ` · ${lv.remaining} XP to level ${lv.level + 1}` : ' · top level reached'}</p>
        </Panel>
        <Panel className="lb-next">
          <p className="label">Recommended next</p>
          {recLesson ? (
            <>
              <h2>{recLesson.title}</h2>
              <p>{rec.why}</p>
              <LinkBtn to={`/learn/${recLesson.path}/${recLesson.id}`} variant="primary" go>Open lesson</LinkBtn>
            </>
          ) : rec.kind === 'certification' ? (
            <>
              <h2>Final certification</h2>
              <p>{rec.why}</p>
              <LinkBtn to="/certification" variant="primary" go>Start the certification</LinkBtn>
            </>
          ) : (
            <>
              <h2>Course complete</h2>
              <p>{rec.why}</p>
              <LinkBtn to="/scenarios" variant="primary" go>Open scenarios</LinkBtn>
            </>
          )}
        </Panel>
        <Panel className="lb-stats">
          <dl className="stats">
            <div><dt>Lessons finished</dt><dd>{overall.done} / {overall.total}</dd></div>
            <div><dt>Badges</dt><dd>{earned.length} / {BADGES.length}</dd></div>
            <div><dt>Days active</dt><dd>{Object.keys(state.xpByDay).length}</dd></div>
            <div><dt>Terms collected</dt><dd>{state.codex.length}</dd></div>
          </dl>
        </Panel>
      </section>

      <section aria-labelledby="paths-h" className="lb-sec">
        <h2 id="paths-h">Paths</h2>
        <div className="lb-paths">
          {PATHS.map((p) => {
            const prog = pathProgress(state, p.id);
            return (
              <Panel key={p.id} className="lb-path" data-path={p.id} hue>
                <p className="label">Path {p.number}</p>
                <h3><Link to={`/learn/${p.id}`}>{p.title}</Link></h3>
                <Meter value={prog.pct} label={`${p.title}: ${prog.pct} percent`} />
                <p className="small">{prog.done} of {prog.total} lessons finished{state.pathsDone[p.id] ? ' · path complete' : ''}</p>
              </Panel>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="lessons-h" className="lb-sec">
        <h2 id="lessons-h">Every lesson</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th scope="col">Lesson</th><th scope="col">Learn</th><th scope="col">Try</th><th scope="col">Check</th><th scope="col">Status</th></tr></thead>
            <tbody>
              {LESSONS.map((l) => {
                const st = lessonSteps(state, l.id);
                const sv = state.lessons[l.id];
                return (
                  <tr key={l.id}>
                    <th scope="row"><Link to={`/learn/${l.path}/${l.id}`}>{l.title}</Link></th>
                    <td>{st.learn ? <><Icon name="check" /> Read</> : '–'}</td>
                    <td>{sv?.tryScore ? `${sv.tryScore}/100${st.try ? '' : ` (need ${l.widget.pass})`}` : '–'}</td>
                    <td>{sv?.checkBest ? `${sv.checkBest}/${l.check.length}${st.check ? '' : ` (need ${CHECK_PASS})`}` : '–'}</td>
                    <td>{st.done ? <Chip tone="hue" icon="seal">Finished</Chip> : st.started ? 'In progress' : 'Not started'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="badges-h" className="lb-sec">
        <h2 id="badges-h">Badges</h2>
        <p className="prose">Badges are checked against what you have really finished. Nothing is awarded for visiting or clicking.</p>
        <ul className="shelf">
          {BADGES.map((b) => {
            const got = state.badges[b.id];
            return (
              <li key={b.id} className={got ? 'is-got' : 'is-locked'}>
                <Medal id={b.id} path={b.path} earned={!!got} className="shelf__medal" />
                <h3>{b.name}</h3>
                <p className="small"><strong>{got ? 'Earned' : 'Locked'}.</strong> {b.title}</p>
                <p className="small">{b.how}</p>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="act-h" className="lb-sec lb-two">
        <div>
          <h2 id="act-h">XP, last 14 days</h2>
          <figure>
            <svg viewBox="0 0 420 150" className="xp-chart" role="img" aria-label={`XP earned each day for the last 14 days. Total ${days.reduce((a, d) => a + d.xp, 0)} XP.`}>
              {days.map((d, i) => {
                const h = (d.xp / maxXp) * 100;
                return (
                  <g key={d.d}>
                    <rect x={8 + i * 29} y={110 - h} width="22" height={Math.max(h, d.xp ? 3 : 0)} fill="var(--seal)" stroke="var(--ink)" strokeWidth="2" />
                    <text x={19 + i * 29} y="128" textAnchor="middle" className="xp-chart__t">{i % 2 === 0 ? dayLabel(d.d).replace(/\s/, ' ') : ''}</text>
                    {d.xp ? <text x={19 + i * 29} y={104 - h} textAnchor="middle" className="xp-chart__v">{d.xp}</text> : null}
                  </g>
                );
              })}
              <path d="M4 110H416" stroke="var(--ink)" strokeWidth="3" />
            </svg>
            <figcaption className="small">Each bar is one day. The number above a bar is the XP you earned that day.</figcaption>
          </figure>
        </div>
        <div>
          <h2>Recent activity</h2>
          {state.activity.length === 0 ? (
            <p>Nothing yet. Finish a step in any lesson to start your log.</p>
          ) : (
            <ul className="activity">
              {state.activity.slice(0, 8).map((a, i) => (
                <li key={i}><span>{a.label}</span><strong>+{a.xp} XP</strong></li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section aria-labelledby="how-xp" className="lb-sec">
        <details className="xp-rules">
          <summary id="how-xp">How XP works</summary>
          <ul>
            <li>Reading a lesson: {XP.learn} XP, once.</li>
            <li>Experiment: up to {XP.tryMax} XP, in proportion to your best score. Improving a score pays only the difference.</li>
            <li>Knowledge check: {XP.checkPerQuestion} XP per correct answer (best attempt), plus {XP.checkPerfect} for all correct, once.</li>
            <li>Sealing a lesson: {XP.lessonDone} XP. Finishing a path: {XP.path} XP. A badge: {XP.badge} XP. Passing the certification: {XP.certification} XP.</li>
            <li>Repeating something you already did pays nothing, so there is no way to grind. XP only moves when you learn or improve.</li>
          </ul>
        </details>
      </section>

      <section aria-labelledby="set-h" className="lb-sec">
        <h2 id="set-h">Settings and your data</h2>
        <Panel className="settings">
          <div className="settings__grid">
            <div className="stack">
              <h3>Sound</h3>
              <p className="small">Off by default. Short original sounds made in your browser. Nothing depends on them.</p>
              <div className="row">
                <Btn variant={state.settings.sound ? 'primary' : 'secondary'} aria-pressed={state.settings.sound} icon={state.settings.sound ? 'sound-on' : 'sound-off'} onClick={() => { const n = !state.settings.sound; dispatch({ type: 'settings', patch: { sound: n } }); configureSound(n, state.settings.volume); if (n) play('xp'); }}>
                  Sound {state.settings.sound ? 'on' : 'off'}
                </Btn>
              </div>
              <div className="field">
                <label htmlFor="vol">Volume: {Math.round(state.settings.volume * 100)}%</label>
                <input id="vol" type="range" min={0} max={100} value={Math.round(state.settings.volume * 100)} onChange={(e) => dispatch({ type: 'settings', patch: { volume: +e.target.value / 100 } })} onMouseUp={() => play('right')} />
              </div>
            </div>
            <div className="stack">
              <h3>Name for your certificate</h3>
              <div className="field">
                <label htmlFor="cert-name">Name (optional)</label>
                <input id="cert-name" className="input" value={state.settings.name} maxLength={60} autoComplete="off" onChange={(e) => dispatch({ type: 'settings', patch: { name: e.target.value } })} />
                <span className="field__hint">Only used on the printable certificate, and kept on this device.</span>
              </div>
            </div>
            <div className="stack">
              <h3>Back up or reset</h3>
              <div className="row">
                <Btn variant="quiet" icon="download" onClick={download}>Download progress</Btn>
                <Btn variant="quiet" icon="upload" onClick={() => fileRef.current?.click()}>Import progress</Btn>
                <input ref={fileRef} type="file" accept="application/json,.json" className="visually-hidden" tabIndex={-1} aria-label="Choose a progress file to import" onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ''; }} />
              </div>
              {!confirmReset ? (
                <Btn variant="quiet" icon="reset" onClick={() => setConfirmReset(true)}>Reset all progress…</Btn>
              ) : (
                <Callout icon="warning" tone="bad">
                  <p><strong>Delete all XP, lessons, badges and settings on this device?</strong> This cannot be undone. Download a copy first if you might want it back.</p>
                  <div className="row">
                    <Btn variant="primary" onClick={() => { resetAll(); setConfirmReset(false); setMsg('All progress was reset.'); }}>Yes, delete everything</Btn>
                    <Btn variant="quiet" onClick={() => setConfirmReset(false)}>Cancel</Btn>
                  </div>
                </Callout>
              )}
              <p role="status" className="small">{msg}</p>
            </div>
          </div>
        </Panel>
      </section>
    </div>
  );
}
