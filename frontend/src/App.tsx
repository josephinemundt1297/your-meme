import { Link, Outlet, useNavigate, useParams } from '@tanstack/react-router'
import { useEffect, useState, type FormEvent } from 'react'
import { Show, SignIn, SignUp, UserButton, useAuth } from '@clerk/react'
import type { Meme, MemeComment } from './types/meme'
import { MemeState } from './components/ui/MemeState'
import { createMemeComment, createMemeFormData, fetchMemeById, fetchMemeComments, fetchMemes, setMemeLike, syncCurrentUser, uploadMeme, validateMemeImage } from './api/memes'
import './App.css'

type MemeListProps = {
  top?: boolean
}

type MemeCardProps = {
  meme: Meme
  onToggleLike: (memeId: string, liked: boolean) => void
}

function MemeCard({ meme, onToggleLike }: MemeCardProps) {
  return <article className="meme-card">
    <Link to="/memes/$memeId" params={{ memeId: meme.id }}><div className="meme-image" role="img" aria-label={`Meme-Bild für ${meme.title}`}>{meme.imageUrl ? <img src={meme.imageUrl} alt={meme.title} loading="lazy" decoding="async" width="600" height="400" /> : <span aria-hidden="true">{meme.emoji}</span>}</div></Link>
    <div className="meme-card-content"><span className="category">{meme.category}</span><h3>{meme.title}</h3><button className={`like-button${meme.likedByMe ? ' liked' : ''}`} type="button" aria-pressed={meme.likedByMe} onClick={() => onToggleLike(meme.id, !meme.likedByMe)}><span aria-hidden="true">{meme.likedByMe ? '♥' : '♡'}</span>{meme.likeCount} Likes</button></div>
  </article>
}

export function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { getToken, isSignedIn } = useAuth()
  const categories = ['Programmieren', 'Alltag', 'Arbeit', 'Sport', 'Gaming', 'Tech', 'Animal', 'Movies', 'Outdoor', 'Study', 'Drinks', 'Food', 'Holiday', 'Book', 'Meeting']

  useEffect(() => {
    if (!isSignedIn) return

    let active = true
    void getToken().then((token) => {
      if (active && token) return syncCurrentUser(token)
      return undefined
    }).catch(() => undefined)

    return () => { active = false }
  }, [getToken, isSignedIn])

  return <div className="app-shell">
    <header className="site-header">
      <button className="menu-button" type="button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-controls="main-navigation"><span aria-hidden="true">☰</span><span className="sr-only">{menuOpen ? 'Menü schließen' : 'Menü öffnen'}</span></button>
      <div className="account-link"><Show when="signed-out"><Link to="/account">Anmelden / Registrieren</Link></Show><Show when="signed-in"><UserButton /></Show></div>
    </header>
    <nav id="main-navigation" className={`main-nav${menuOpen ? ' is-open' : ''}`} aria-label="Hauptnavigation"><Link to="/" onClick={() => setMenuOpen(false)}>Home</Link><Link to="/popular" onClick={() => setMenuOpen(false)}>Popular</Link><Link to="/new" onClick={() => setMenuOpen(false)}>New</Link><Link to="/top" onClick={() => setMenuOpen(false)}>Most liked</Link></nav>
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

export function MemeList({ top = false }: MemeListProps) {
  const [search, setSearch] = useState('')
  const [memes, setMemes] = useState<Meme[] | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [likeError, setLikeError] = useState('')
  const { getToken, isSignedIn } = useAuth()
  const loadMemeList = () => { setLoadError(false); setMemes(null); void fetchMemes().then(setMemes).catch(() => setLoadError(true)) }
  useEffect(() => {
    let active = true
    void fetchMemes().then((data) => { if (active) setMemes(data) }).catch(() => { if (active) setLoadError(true) })
    return () => { active = false }
  }, [])
  const handleToggleLike = async (memeId: string, liked: boolean) => {
    if (!isSignedIn) {
      setLikeError('Bitte melde dich an, um Memes zu liken.')
      return
    }
    try {
      const token = await getToken()
      if (!token) throw new Error('Bitte melde dich an, um Memes zu liken.')
      const result = await setMemeLike(memeId, liked, token)
      setMemes((current) => current?.map((meme) => meme.id === memeId ? { ...meme, likedByMe: result.liked, likeCount: result.likeCount } : meme) ?? current)
      setLikeError('')
    } catch (error: unknown) {
      setLikeError(error instanceof Error ? error.message : 'Der Like konnte nicht gespeichert werden.')
    }
  }
  const visibleMemes = memes ? [...memes].sort((a, b) => top ? b.likeCount - a.likeCount : b.createdAt.localeCompare(a.createdAt)).filter((meme) => `${meme.title} ${meme.category}`.toLowerCase().includes(search.toLowerCase())) : []
  return <>
    <section className="hero-section"><p className="eyebrow">Deine tägliche Meme-Auszeit</p><h1>{top ? 'Die meist gelikten Memes' : 'Finde dein nächstes Lieblingsmeme'}</h1><p className="intro">Entdecke lustige Memes und teile sie mit der Community.</p><label className="search-box"><span className="search-icon" aria-hidden="true">⌕</span><span className="sr-only">Memes durchsuchen</span><input type="search" placeholder="Memes durchsuchen ..." value={search} onChange={(event) => setSearch(event.target.value)} /></label></section>
    <section className="meme-section" aria-labelledby="meme-heading"><div className="section-heading"><div><p className="eyebrow">{top ? 'Community-Favoriten' : 'Für dich ausgewählt'}</p><h2 id="meme-heading">{top ? 'Meist geliked' : 'Neue Memes'}</h2></div><span className="meme-count">{visibleMemes.length} Memes</span></div>
      {likeError && <p className="like-error" role="alert">{likeError}</p>}{loadError ? <MemeState type="error" onRetry={loadMemeList} /> : !memes ? <MemeState type="loading" /> : visibleMemes.length > 0 ? <div className="meme-grid">{visibleMemes.map((meme) => <MemeCard key={meme.id} meme={meme} onToggleLike={handleToggleLike} />)}</div> : <MemeState type="empty" />}
    </section>
  </>
}

export function PlaceholderPage({ title, text }: { title: string; text: string }) { return <section className="placeholder-page"><p className="eyebrow">Your Meme</p><h1>{title}</h1><p>{text}</p><Link className="primary-link" to="/">Zur Übersicht</Link></section> }
export function AccountPage() {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  return <section className="account-page"><Show when="signed-in"><div className="account-signed-in"><p className="eyebrow">Dein Konto</p><h1>Willkommen zurück!</h1><p>Du bist bereits angemeldet.</p><UserButton showName /></div></Show><Show when="signed-out"><div className="auth-switcher" role="group" aria-label="Anmeldung auswählen"><button className={mode === 'sign-in' ? 'active' : ''} type="button" onClick={() => setMode('sign-in')}>Anmelden</button><button className={mode === 'sign-up' ? 'active' : ''} type="button" onClick={() => setMode('sign-up')}>Registrieren</button></div>{mode === 'sign-in' ? <SignIn routing="hash" /> : <SignUp routing="hash" />}</Show></section>
}
export function UploadPage() {
  const navigate = useNavigate()
  const { getToken } = useAuth()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [fileError, setFileError] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const previewUrl = selectedFile ? URL.createObjectURL(selectedFile) : null

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setUploadError('')
    const validationError = selectedFile ? validateMemeImage(selectedFile) : 'Bitte wähle eine PNG-Datei aus.'
    setFileError(validationError ?? '')
    if (validationError || !selectedFile || !title.trim()) return

    setIsUploading(true)
    try {
      const token = await getToken()
      if (!token) throw new Error('Bitte melde dich an, um ein Meme hochzuladen.')
      await syncCurrentUser(token)
      const { id } = await uploadMeme(createMemeFormData(title, selectedFile), token)
      await navigate({ to: '/memes/$memeId', params: { memeId: id } })
    } catch (error: unknown) {
      setUploadError(error instanceof Error ? error.message : 'Das Meme konnte nicht hochgeladen werden.')
    } finally {
      setIsUploading(false)
    }
  }

  return <section className="upload-page">
    <Link className="back-link" to="/">← Zurück zu den Memes</Link>
    <div className="upload-intro"><p className="eyebrow">Dein Beitrag</p><h1>Eigenes Meme hochladen</h1><p>Teile dein Meme mit der Your-Meme-Community.</p></div>
    <form className="upload-form" onSubmit={handleSubmit}>
      <label className="upload-field"><span>Meme-Bild</span><input type="file" accept="image/png" onChange={(event) => { const file = event.target.files?.[0] ?? null; setSelectedFile(file); setFileError(file ? validateMemeImage(file) ?? '' : '') }} required />{previewUrl && <img className="upload-preview" src={previewUrl} alt="Vorschau des ausgewählten Memes" loading="lazy" decoding="async" />}{fileError && <span className="upload-error" role="alert">{fileError}</span>}</label>
      <label className="upload-field"><span>Titel</span><input type="text" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Gib deinem Meme einen Titel" maxLength={100} required /></label>
      <p className="upload-hint">Erlaubt ist eine PNG-Datei mit maximal 5 MiB.</p>
      {uploadError && <p className="upload-error" role="alert">{uploadError}</p>}
      <button className="primary-link upload-submit" type="submit" disabled={isUploading}>{isUploading ? 'Wird hochgeladen …' : 'Meme hochladen'}</button>
    </form>
  </section>
}
export function MemeDetailPage() {
  const { memeId } = useParams({ from: '/memes/$memeId' })
  const { getToken, isSignedIn } = useAuth()
  const [detailState, setDetailState] = useState<{ id: string; status: 'loading' | 'loaded' | 'not-found' | 'error'; meme?: Meme }>({ id: '', status: 'loading' })
  const [commentState, setCommentState] = useState<{ id: string; status: 'loading' | 'loaded' | 'error'; comments?: MemeComment[] }>({ id: '', status: 'loading' })
  const [commentText, setCommentText] = useState('')
  const [commentError, setCommentError] = useState('')
  const [isSendingComment, setIsSendingComment] = useState(false)
  const [detailLike, setDetailLike] = useState({ id: '', liked: false, likeCount: 0 })
  const [likeError, setLikeError] = useState('')
  const [isUpdatingLike, setIsUpdatingLike] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    void fetchMemeById(memeId, controller.signal)
      .then((data) => {
        setDetailState(data ? { id: memeId, status: 'loaded', meme: data } : { id: memeId, status: 'not-found' })
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setDetailState({ id: memeId, status: 'error' })
      })

    return () => controller.abort()
  }, [memeId])

  useEffect(() => {
    const controller = new AbortController()

    void fetchMemeComments(memeId, controller.signal)
      .then((comments) => setCommentState({ id: memeId, status: 'loaded', comments }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setCommentState({ id: memeId, status: 'error' })
      })

    return () => controller.abort()
  }, [memeId])

  const currentState = detailState.id === memeId ? detailState : { id: memeId, status: 'loading' as const }
  const currentCommentState = commentState.id === memeId ? commentState : { id: memeId, status: 'loading' as const }
  if (currentState.status === 'error') return <section className="placeholder-page"><MemeState type="error" onRetry={() => window.location.reload()} /><Link className="primary-link" to="/">Zur Übersicht</Link></section>
  if (currentState.status === 'not-found') return <section className="placeholder-page"><MemeState type="not-found" /><Link className="primary-link" to="/">Zur Übersicht</Link></section>
  if (currentState.status === 'loading' || !currentState.meme) return <section className="placeholder-page"><MemeState type="loading" /></section>

  const meme = currentState.meme

  const displayedLike = detailLike.id === memeId ? detailLike : { id: memeId, liked: meme.likedByMe, likeCount: meme.likeCount }
  const handleLike = async () => {
    if (!isSignedIn) {
      setLikeError('Bitte melde dich an, um Memes zu liken.')
      return
    }
    setIsUpdatingLike(true)
    setLikeError('')
    try {
      const token = await getToken()
      if (!token) throw new Error('Bitte melde dich an, um Memes zu liken.')
      const result = await setMemeLike(memeId, !displayedLike.liked, token)
      setDetailLike({ id: memeId, liked: result.liked, likeCount: result.likeCount })
    } catch (error: unknown) {
      setLikeError(error instanceof Error ? error.message : 'Der Like konnte nicht gespeichert werden.')
    } finally {
      setIsUpdatingLike(false)
    }
  }

  const handleCommentSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const content = commentText.trim()
    if (!content) {
      setCommentError('Bitte schreibe einen Kommentar.')
      return
    }
    if (content.length > 1000) {
      setCommentError('Dein Kommentar darf höchstens 1.000 Zeichen enthalten.')
      return
    }

    setCommentError('')
    setIsSendingComment(true)
    try {
      const token = await getToken()
      if (!token) throw new Error('Bitte melde dich an, um zu kommentieren.')
      const comment = await createMemeComment(memeId, content, token)
      setCommentState((current) => ({ id: memeId, status: 'loaded', comments: [...(current.id === memeId ? current.comments ?? [] : []), comment] }))
      setCommentText('')
    } catch (error: unknown) {
      setCommentError(error instanceof Error ? error.message : 'Der Kommentar konnte nicht gespeichert werden.')
    } finally {
      setIsSendingComment(false)
    }
  }

  const commentCount = currentCommentState.status === 'loaded' ? currentCommentState.comments?.length ?? meme.commentCount : meme.commentCount

  return <section className="detail-page">
    <Link className="back-link" to="/">← Zurück zu den Memes</Link>
    <article className="detail-card">
      <div className="detail-image" role="img" aria-label={`Meme-Bild für ${meme.title}`}>{meme.imageUrl ? <img src={meme.imageUrl} alt={meme.title} decoding="async" width="900" height="600" /> : <span aria-hidden="true">{meme.emoji}</span>}</div>
      <div className="detail-content">
        <span className="category">{meme.category}</span>
        <h1>{meme.title}</h1>
        <p className="detail-author">Von <strong>{meme.author.username}</strong> · {new Date(meme.createdAt).toLocaleDateString('de-DE')}</p>
        <div className="detail-actions"><button className={`like-button${displayedLike.liked ? ' liked' : ''}`} type="button" aria-pressed={displayedLike.liked} onClick={handleLike} disabled={isUpdatingLike}><span aria-hidden="true">{displayedLike.liked ? '♥' : '♡'}</span>{displayedLike.likeCount} Likes</button><span className="comment-count">💬 {commentCount} Kommentare</span></div>{likeError && <p className="like-error" role="alert">{likeError}</p>}
        <section className="comments-section" aria-labelledby="comments-heading"><h2 id="comments-heading">Kommentare</h2>{isSignedIn ? <form className="comment-form" onSubmit={handleCommentSubmit}><label htmlFor="comment-content">Dein Kommentar</label><textarea id="comment-content" value={commentText} onChange={(event) => { setCommentText(event.target.value); setCommentError('') }} maxLength={1000} rows={4} placeholder="Schreibe einen Kommentar …" required /><button className="primary-link" type="submit" disabled={isSendingComment}>{isSendingComment ? 'Wird gesendet …' : 'Kommentar senden'}</button>{commentError && <p className="comment-error" role="alert">{commentError}</p>}</form> : <p className="comment-placeholder">Bitte <Link to="/account">melde dich an</Link>, um zu kommentieren.</p>}{currentCommentState.status === 'loading' && <p className="comment-placeholder">Kommentare werden geladen …</p>}{currentCommentState.status === 'error' && <p className="comment-placeholder">Kommentare konnten nicht geladen werden.</p>}{currentCommentState.status === 'loaded' && currentCommentState.comments?.length === 0 && <p className="comment-placeholder">Noch keine Kommentare.</p>}{currentCommentState.status === 'loaded' && currentCommentState.comments && currentCommentState.comments.length > 0 && <div className="comment-list">{currentCommentState.comments.map((comment) => <article className="comment-item" key={comment.id}><p>{comment.content}</p><small>Von {comment.author.username} · {new Date(comment.createdAt).toLocaleDateString('de-DE')}</small></article>)}</div>}</section>
      </div>
    </article>
  </section>
}

