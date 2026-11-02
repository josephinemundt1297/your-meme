import { Link, Outlet, createRootRoute, createRoute, createRouter, useParams } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { sampleMemes } from './data/sampleMemes'
import type { Meme } from './types/meme'
import { MemeState } from './components/ui/MemeState'
import './App.css'

function Layout() {
  const categories = ['Programmieren', 'Alltag', 'Arbeit', 'Sport', 'Gaming', 'Tech', 'Animal', 'Movies', 'Outdoor', 'Study', 'Drinks', 'Food', 'Holiday', 'Book', 'Meeting']
  return <div className="app-shell">
    <header className="site-header">
      <Link className="account-link" to="/account">Anmelden / Registrieren</Link>
    </header>
    <nav className="main-nav" aria-label="Hauptnavigation"><Link to="/">Home</Link><Link to="/popular">Popular</Link><Link to="/new">New</Link><Link to="/top">Most liked</Link></nav>
    <div className="site-body">
      <aside id="site-sidebar" className="site-sidebar">
        <div className="sidebar-section"><p className="sidebar-title">Kategorien</p>{categories.map((category) => <Link key={category} to="/" search={{ category }}>{category}</Link>)}</div>
        <div className="sidebar-divider" />
        <div className="sidebar-section"><div className="sidebar-heading"><p className="sidebar-title">Meine Ordner</p><Link className="add-folder" to="/account" aria-label="Ordner anlegen">＋</Link></div><p className="sidebar-note">Anmelden, um Ordner anzulegen.</p></div>
      </aside>
      <main className="page-content"><Outlet /></main>
    </div>
    <footer className="site-footer">Your Meme · Mehr Lachen im Alltag</footer>
  </div>
}

function MemeList({ top = false }: { top?: boolean }) {
  const [search, setSearch] = useState('')
  const [likedMemes, setLikedMemes] = useState<string[]>([])
  const visibleMemes = [...sampleMemes].sort((a, b) => top ? b.likeCount - a.likeCount : b.createdAt.localeCompare(a.createdAt)).filter((meme) => `${meme.title} ${meme.category}`.toLowerCase().includes(search.toLowerCase()))
  return <>
    <section className="hero-section"><p className="eyebrow">Deine tägliche Meme-Auszeit</p><h1>{top ? 'Die meist gelikten Memes' : 'Finde dein nächstes Lieblingsmeme'}</h1><p className="intro">Entdecke lustige Memes und teile sie mit der Community.</p><label className="search-box"><span className="search-icon" aria-hidden="true">⌕</span><span className="sr-only">Memes durchsuchen</span><input type="search" placeholder="Memes durchsuchen ..." value={search} onChange={(event) => setSearch(event.target.value)} /></label></section>
    <section className="meme-section" aria-labelledby="meme-heading"><div className="section-heading"><div><p className="eyebrow">{top ? 'Community-Favoriten' : 'Für dich ausgewählt'}</p><h2 id="meme-heading">{top ? 'Meist geliked' : 'Neue Memes'}</h2></div><span className="meme-count">{visibleMemes.length} Memes</span></div>
      {visibleMemes.length > 0 ? <div className="meme-grid">{visibleMemes.map((meme: Meme) => { const isLiked = likedMemes.includes(meme.id); return <article className="meme-card" key={meme.id}><Link to="/memes/$memeId" params={{ memeId: meme.id }}><div className="meme-image" role="img" aria-label={`Beispielbild für ${meme.title}`}><span aria-hidden="true">{meme.emoji}</span></div></Link><div className="meme-card-content"><span className="category">{meme.category}</span><h3>{meme.title}</h3><button className={`like-button${isLiked ? ' liked' : ''}`} type="button" aria-pressed={isLiked} onClick={() => setLikedMemes((current) => current.includes(meme.id) ? current.filter((id) => id !== meme.id) : [...current, meme.id])}><span aria-hidden="true">{isLiked ? '♥' : '♡'}</span>{meme.likeCount + (isLiked ? 1 : 0)} Likes</button></div></article> })}</div> : <MemeState type="empty" />}
    </section>
  </>
}

function PlaceholderPage({ title, text }: { title: string; text: string }) { return <section className="placeholder-page"><p className="eyebrow">Your Meme</p><h1>{title}</h1><p>{text}</p><Link className="primary-link" to="/">Zur Übersicht</Link></section> }
function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const previewUrl = selectedFile ? URL.createObjectURL(selectedFile) : null

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (selectedFile && title.trim() && category) setSubmitted(true)
  }

  return <section className="upload-page">
    <Link className="back-link" to="/">← Zurück zu den Memes</Link>
    <div className="upload-intro"><p className="eyebrow">Dein Beitrag</p><h1>Eigenes Meme hochladen</h1><p>Teile dein Meme mit der Your-Meme-Community.</p></div>
    <form className="upload-form" onSubmit={handleSubmit}>
      <label className="upload-field"><span>Meme-Bild</span><input type="file" accept="image/png,image/jpeg,image/gif,image/webp" onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} required />{previewUrl && <img className="upload-preview" src={previewUrl} alt="Vorschau des ausgewählten Memes" />}</label>
      <label className="upload-field"><span>Titel</span><input type="text" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Gib deinem Meme einen Titel" maxLength={100} required /></label>
      <label className="upload-field"><span>Kategorie</span><select value={category} onChange={(event) => setCategory(event.target.value)} required><option value="">Kategorie auswählen</option><option value="Programmieren">Programmieren</option><option value="Alltag">Alltag</option><option value="Arbeit">Arbeit</option></select></label>
      <p className="upload-hint">Der Upload wird später mit Anmeldung und Backend verbunden.</p>
      <button className="primary-link upload-submit" type="submit">Meme hochladen</button>
      {submitted && <p className="upload-success" role="status">Dein Meme ist für die Veröffentlichung vorbereitet.</p>}
    </form>
  </section>
}
function MemeDetailPage() {
  const { memeId } = useParams({ from: '/memes/$memeId' })
  const meme = sampleMemes.find((item) => item.id === memeId)
  if (!meme) return <section className="placeholder-page"><MemeState type="not-found" /><Link className="primary-link" to="/">Zur Übersicht</Link></section>

  return <section className="detail-page">
    <Link className="back-link" to="/">← Zurück zu den Memes</Link>
    <article className="detail-card">
      <div className="detail-image" role="img" aria-label={`Meme-Bild für ${meme.title}`}><span aria-hidden="true">{meme.emoji}</span></div>
      <div className="detail-content">
        <span className="category">{meme.category}</span>
        <h1>{meme.title}</h1>
        <p className="detail-author">Von <strong>{meme.author.username}</strong> · {new Date(meme.createdAt).toLocaleDateString('de-DE')}</p>
        <div className="detail-actions"><button className="like-button liked" type="button"><span aria-hidden="true">♡</span>{meme.likeCount} Likes</button><span className="comment-count">💬 {meme.commentCount} Kommentare</span></div>
        <section className="comments-section" aria-labelledby="comments-heading"><h2 id="comments-heading">Kommentare</h2><div className="comment-placeholder">Kommentare werden mit dem Backend verbunden.</div></section>
      </div>
    </article>
  </section>
}

const rootRoute = createRootRoute({ component: Layout })
const homeRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: () => <MemeList /> })
const popularRoute = createRoute({ getParentRoute: () => rootRoute, path: '/popular', component: () => <MemeList top /> })
const newRoute = createRoute({ getParentRoute: () => rootRoute, path: '/new', component: () => <MemeList /> })
const topRoute = createRoute({ getParentRoute: () => rootRoute, path: '/top', component: () => <MemeList top /> })
const uploadRoute = createRoute({ getParentRoute: () => rootRoute, path: '/upload', component: UploadPage })
const accountRoute = createRoute({ getParentRoute: () => rootRoute, path: '/account', component: () => <PlaceholderPage title="Anmelden / Profil" text="Hier erscheinen Anmeldung und Kontoeinstellungen." /> })
const memeRoute = createRoute({ getParentRoute: () => rootRoute, path: '/memes/$memeId', component: MemeDetailPage })
const folderRoute = createRoute({ getParentRoute: () => rootRoute, path: '/folders/$folderId', component: () => <PlaceholderPage title="Mein Ordner" text="Dieser persönliche Ordner wird nach der Anmeldung verfügbar." /> })
const routeTree = rootRoute.addChildren([homeRoute, popularRoute, newRoute, topRoute, uploadRoute, accountRoute, memeRoute, folderRoute])
export const router = createRouter({ routeTree })
declare module '@tanstack/react-router' { interface Register { router: typeof router } }
