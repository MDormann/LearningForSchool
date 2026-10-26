import { CATEGORIES, EXERCISES } from './exercises';
import { MouthIcon, SpeakerIcon, StarIcon } from './components/icons';
import { useApp } from './lib/app';
import { goTo } from './lib/route';
import { sfx } from './lib/sound';

export function Home() {
  const { prefs, setPrefs, stars, totalStars } = useApp();
  return (
    <div className="screen home">
      <header className="home-bar">
        <h1 className="brand">
          Lern<span>kiste</span>
        </h1>
        <span className="star-count big" title="Alle gesammelten Sterne">
          <StarIcon size={30} /> {totalStars}
        </span>
      </header>
      <p className="lead">Such dir eine Übung aus! Die Aufgaben werden vorgelesen – du tippst die Antwort.</p>

      {CATEGORIES.map((cat) => (
        <section key={cat.id} className={`category cat-${cat.id}`} aria-labelledby={`cat-${cat.id}`}>
          <h2 id={`cat-${cat.id}`}>
            {cat.title} <small>{cat.blurb}</small>
          </h2>
          <div className="cards">
            {EXERCISES.filter((e) => e.category === cat.id).map((e) => (
              <button
                key={e.id}
                type="button"
                className="ex-card"
                onClick={() => {
                  sfx.unlock();
                  goTo(e.id);
                }}
              >
                <span className="ex-card-preview">{e.preview}</span>
                <span className="ex-card-title">{e.title}</span>
                <span className="ex-card-text">{e.description}</span>
                {(stars[e.id] ?? 0) > 0 && (
                  <span className="ex-card-stars">
                    <StarIcon size={18} /> {stars[e.id]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>
      ))}

      <section className="parents" aria-labelledby="parents-title">
        <h2 id="parents-title">Für Eltern</h2>
        <div className="toggles">
          <button type="button" className="toggle" aria-pressed={prefs.speech} onClick={() => setPrefs({ ...prefs, speech: !prefs.speech })}>
            <MouthIcon muted={!prefs.speech} /> Vorlesen {prefs.speech ? 'an' : 'aus'}
          </button>
          <button type="button" className="toggle" aria-pressed={prefs.sound} onClick={() => setPrefs({ ...prefs, sound: !prefs.sound })}>
            <SpeakerIcon muted={!prefs.sound} /> Töne {prefs.sound ? 'an' : 'aus'}
          </button>
        </div>
        <p>
          Die Übungen orientieren sich am Vorwissen, das in der Schuleingangsuntersuchung angeschaut wird: Zahlen und Mengen,
          Anlaute und Silben, Muster und Merkfähigkeit. Die Farben folgen der Rechenkette aus der Grundschule: 1 bis 5 rot,
          6 bis 10 blau. Kurze Runden von ein paar Minuten reichen völlig.
        </p>
        <p>
          Tipp: Über „Zum Startbildschirm hinzufügen“ im Browser wird die Lernkiste zur App auf dem Handy oder Tablet – und
          funktioniert dann auch ohne Internet.
        </p>
      </section>
    </div>
  );
}
