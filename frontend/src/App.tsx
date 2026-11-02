import { Link, Outlet, createRootRoute, createRoute, createRouter, useParams } from '@tanstack/react-router'
import { useState } from 'react'
import { sampleMemes } from './data/sampleMemes'
import type { Meme } from './types/meme'
import { MemeState } from './components/ui/MemeState'
import './App.css'

function Layout() {
  return <div className="app-shell">
    <header className="site-header">
      <div className="brand-banner"><Link className="logo" to="/" aria-label="Your Meme Startseite">Your Meme</Link><p>Your daily dose of laughing</p></div>
      <Link className="account-link" to="/account">Anmelden / Registrieren</Link>
    </header>
    <nav className="main-nav" aria-label="Hauptnavigation"><Link to="/">Neu</Link><Link to="/top">Meist geliked</Link><Link to="/upload">Hochladen</Link></nav>
    <div className="site-body">
      <aside id="site-sidebar" className="site-sidebar">
        <div className="sidebar-section"><p className="sidebar-title">Kategorien</p><Link to="/" search={{ category: 'Programmieren' }}>Programmieren</Link><Link to="/" search={{ category: 'Alltag' }}>Alltag</Link><Link to="/" search={{ category: 'Arbeit' }}>Arbeit</Link></div>
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
const topRoute = createRoute({ getParentRoute: () => rootRoute, path: '/top', component: () => <MemeList top /> })
const uploadRoute = createRoute({ getParentRoute: () => rootRoute, path: '/upload', component: () => <PlaceholderPage title="Meme hochladen" text="Melde dich an, um dein eigenes Meme hochzuladen." /> })
const accountRoute = createRoute({ getParentRoute: () => rootRoute, path: '/account', component: () => <PlaceholderPage title="Anmelden / Profil" text="Hier erscheinen Anmeldung und Kontoeinstellungen." /> })
const memeRoute = createRoute({ getParentRoute: () => rootRoute, path: '/memes/$memeId', component: MemeDetailPage })
const folderRoute = createRoute({ getParentRoute: () => rootRoute, path: '/folders/$folderId', component: () => <PlaceholderPage title="Mein Ordner" text="Dieser persönliche Ordner wird nach der Anmeldung verfügbar." /> })
const routeTree = rootRoute.addChildren([homeRoute, topRoute, uploadRoute, accountRoute, memeRoute, folderRoute])
export const router = createRouter({ routeTree })
declare module '@tanstack/react-router' { interface Register { router: typeof router } }
