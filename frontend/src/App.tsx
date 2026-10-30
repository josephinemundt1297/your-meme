import { useState } from 'react'
import './App.css'

type Meme = { id: number; title: string; category: string; emoji: string; likes: number }

const sampleMemes: Meme[] = [
  { id: 1, title: 'Wenn der Code beim ersten Versuch funktioniert', category: 'Programmieren', emoji: '🎉', likes: 42 },
  { id: 2, title: 'Ich: Heute mache ich nur eine kleine Änderung', category: 'Alltag', emoji: '😅', likes: 28 },
  { id: 3, title: 'Montag und der erste Kaffee', category: 'Arbeit', emoji: '☕', likes: 35 },
]

function App() {
  const [search, setSearch] = useState('')
  const [likedMemes, setLikedMemes] = useState<number[]>([])
  const visibleMemes = sampleMemes.filter((meme) => `${meme.title} ${meme.category}`.toLowerCase().includes(search.toLowerCase()))

  const toggleLike = (memeId: number) => {
    setLikedMemes((current) => current.includes(memeId) ? current.filter((id) => id !== memeId) : [...current, memeId])
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="logo" href="/" aria-label="Your Meme Startseite">Your Meme</a>
        <nav aria-label="Hauptnavigation">
          <a href="#memes">Memes</a><a href="#categories">Kategorien</a><a href="#login">Anmelden</a>
        </nav>
      </header>
      <main>
        <section className="hero-section">
          <p className="eyebrow">Deine tägliche Meme-Auszeit</p>
          <h1>Finde dein nächstes Lieblingsmeme</h1>
          <p className="intro">Entdecke lustige Memes und teile sie mit der Community.</p>
          <label className="search-box">
            <span className="search-icon" aria-hidden="true">⌕</span>
            <span className="sr-only">Memes durchsuchen</span>
            <input type="search" placeholder="Memes durchsuchen ..." value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
        </section>
        <section className="meme-section" id="memes" aria-labelledby="meme-heading">
          <div className="section-heading"><div><p className="eyebrow">Für dich ausgewählt</p><h2 id="meme-heading">Aktuelle Memes</h2></div><span className="meme-count">{visibleMemes.length} Memes</span></div>
          {visibleMemes.length > 0 ? <div className="meme-grid">{visibleMemes.map((meme) => {
            const isLiked = likedMemes.includes(meme.id)
            return <article className="meme-card" key={meme.id}>
              <div className="meme-image" role="img" aria-label={`Beispielbild für ${meme.title}`}><span aria-hidden="true">{meme.emoji}</span></div>
              <div className="meme-card-content"><span className="category">{meme.category}</span><h3>{meme.title}</h3>
                <button className={`like-button${isLiked ? ' liked' : ''}`} type="button" aria-pressed={isLiked} onClick={() => toggleLike(meme.id)}><span aria-hidden="true">{isLiked ? '♥' : '♡'}</span>{meme.likes + (isLiked ? 1 : 0)} Likes</button>
              </div>
            </article>
          })}</div> : <p className="empty-state">Keine Memes gefunden.</p>}
        </section>
      </main>
      <footer className="site-footer">Your Meme · Mehr Lachen im Alltag</footer>
    </div>
  )
}

export default App
