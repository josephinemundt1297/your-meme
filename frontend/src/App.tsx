import { Link, Outlet, useNavigate, useParams, useRouterState, useSearch } from '@tanstack/react-router'
import { useEffect, useState, type FormEvent } from 'react'
import { Show, SignIn, SignUp, UserButton, useAuth, useUser } from '@clerk/react'
import type { Meme, MemeComment } from './types/meme'
import type { MemeFolder, MemeFolderDetail } from './types/folder'
import { MemeState } from './components/ui/MemeState'
import { createMemeComment, createMemeFormData, deleteMeme, deleteMemeComment, fetchMemeById, fetchMemeComments, fetchMemes, setMemeLike, syncCurrentUser, updateMemeComment, updateMemeTitle, uploadMeme, validateMemeImage } from './api/memes'
import { addMemeToFolder, createFolder, deleteFolder, fetchFolderById, fetchFolders, removeMemeFromFolder, renameFolder } from './api/folders'
import './App.css'

type MemeListProps = {
  sortMode?: 'latest' | 'popular' | 'today' | 'comments'
  category?: string
}

type MemeCardProps = {
  meme: Meme
  onToggleLike: (memeId: string, liked: boolean) => void
  isUpdating: boolean
}

type CategoryIconName = 'grid' | 'briefcase' | 'code' | 'coffee' | 'paw' | 'food' | 'book' | 'gamepad' | 'home' | 'calendar'

const categoryOptions = ['Programmieren', 'Alltag', 'Arbeit', 'Sport', 'Spiele', 'Technik', 'Tiere', 'Filme', 'Draußen', 'Lernen', 'Getränke', 'Essen', 'Urlaub', 'Bücher', 'Besprechungen']
const categoryApiValues: Record<string, string> = {
  Programmieren: 'Programmieren', Alltag: 'Alltag', Arbeit: 'Arbeit', Sport: 'Sport', Spiele: 'Gaming', Technik: 'Tech', Tiere: 'Animal', Filme: 'Movies', Draußen: 'Outdoor', Lernen: 'Study', Getränke: 'Drinks', Essen: 'Food', Urlaub: 'Holiday', Bücher: 'Book', Besprechungen: 'Meeting',
}
const categoryLabels: Record<string, string> = {
  Programmieren: 'Programmieren', Alltag: 'Alltag', Arbeit: 'Arbeit', Sport: 'Sport', Gaming: 'Spiele', Tech: 'Technik', Animal: 'Tiere', Movies: 'Filme', Outdoor: 'Draußen', Study: 'Lernen', Drinks: 'Getränke', Food: 'Essen', Holiday: 'Urlaub', Book: 'Bücher', Meeting: 'Besprechungen',
}
const categoryIcons: Record<string, CategoryIconName> = {
  Programmieren: 'code', Alltag: 'calendar', Arbeit: 'briefcase', Sport: 'gamepad', Gaming: 'gamepad', Tech: 'code', Animal: 'paw', Movies: 'calendar', Outdoor: 'home', Study: 'book', Drinks: 'coffee', Food: 'food', Holiday: 'calendar', Book: 'book', Meeting: 'briefcase',
}

function getDisplayCategory(category?: string) {
  const normalizedCategory = category?.trim()
  return normalizedCategory && normalizedCategory.toLowerCase() !== 'ohne kategorie' ? categoryLabels[normalizedCategory] ?? normalizedCategory : 'Community-Meme'
}

function CategoryIcon({ name }: { name: CategoryIconName }) {
  const commonProps = { className: 'category-icon', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }

  switch (name) {
    case 'grid': return <svg {...commonProps}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
    case 'briefcase': return <svg {...commonProps}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" /></svg>
    case 'code': return <svg {...commonProps}><path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 4l-4 16" /></svg>
    case 'coffee': return <svg {...commonProps}><path d="M5 8h11v6a5 5 0 0 1-5 5H5zM16 10h2a3 3 0 0 1 0 6h-2M8 4v2M12 4v2M5 22h12" /></svg>
    case 'paw': return <svg {...commonProps}><circle cx="8" cy="7" r="2" /><circle cx="16" cy="7" r="2" /><circle cx="5" cy="12" r="2" /><circle cx="19" cy="12" r="2" /><path d="M12 11c-3.5 0-5 3-5 5.2C7 18.5 9 20 12 20s5-1.5 5-3.8C17 14 15.5 11 12 11Z" /></svg>
    case 'food': return <svg {...commonProps}><path d="M7 3v7M4 3v4a3 3 0 0 0 6 0V3M7 10v11M17 3v18M17 3c2 1.5 3 3.5 3 6v2h-3" /></svg>
    case 'book': return <svg {...commonProps}><path d="M4 5a3 3 0 0 1 3-2h13v17H7a3 3 0 0 0-3 2zM4 5v15M7 3v17" /></svg>
    case 'gamepad': return <svg {...commonProps}><path d="M7 8h10a5 5 0 0 1 4.8 6.4l-1 3.5a2.5 2.5 0 0 1-4.4.8L15 17H9l-1.4 1.7a2.5 2.5 0 0 1-4.4-.8l-1-3.5A5 5 0 0 1 7 8Z" /><path d="M7 11v4M5 13h4M16 12h.01M19 14h.01" /></svg>
    case 'home': return <svg {...commonProps}><path d="m3 11 9-8 9 8M5 10v10h14V10M9 20v-6h6v6" /></svg>
    case 'calendar': return <svg {...commonProps}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" /></svg>
  }
}

function MemeCard({ meme, onToggleLike, isUpdating }: MemeCardProps) {
  return <article className="meme-card">
    <Link to="/memes/$memeId" params={{ memeId: meme.id }}><div className="meme-image" role="img" aria-label={`Meme-Bild für ${meme.title}`}>{meme.imageUrl ? <img src={meme.imageUrl} alt={meme.title} loading="lazy" decoding="async" width="600" height="400" /> : <span aria-hidden="true">{meme.emoji}</span>}</div></Link>
    <div className="meme-card-content"><span className="category">{getDisplayCategory(meme.category)}</span><span className="meme-author">Von {meme.author.username}</span><h3>{meme.title}</h3><div className="meme-card-actions"><button className={`like-button${meme.likedByMe ? ' liked' : ''}`} type="button" aria-pressed={meme.likedByMe} disabled={isUpdating} onClick={() => onToggleLike(meme.id, !meme.likedByMe)}><span aria-hidden="true">{meme.likedByMe ? '♥' : '♡'}</span>{meme.likeCount} Likes</button><Link className="card-comment-link" to="/memes/$memeId" params={{ memeId: meme.id }} hash="comments-section" aria-label={`Zu den ${meme.commentCount} Kommentaren von ${meme.title} springen`}>💬 {meme.commentCount}</Link></div></div>
  </article>
}

export function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [folders, setFolders] = useState<MemeFolder[] | null>(null)
  const [folderError, setFolderError] = useState('')
  const [isFolderFormOpen, setIsFolderFormOpen] = useState(false)
  const [folderName, setFolderName] = useState('')
  const [createFolderError, setCreateFolderError] = useState('')
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const { getToken, isSignedIn } = useAuth()
  const { user } = useUser()
  const categories = [{ value: 'Alle Memes', label: 'Alle Memes', icon: 'grid' as const }, ...categoryOptions.map((label) => ({ value: categoryApiValues[label], label, icon: categoryIcons[categoryApiValues[label]] }))]
  const currentSearch = useRouterState({ select: (state) => state.location.search as { category?: string } })
  const selectedCategory = currentSearch.category ?? 'Alle Memes'

  useEffect(() => {
    if (!isSignedIn) return

    let active = true
    void getToken().then((token) => {
      if (!token) throw new Error('Bitte melde dich an, um deine Ordner zu sehen.')
      if (active) {
        setFolders(null)
        setFolderError('')
      }
      return syncCurrentUser(token).then(() => fetchFolders(token))
    }).then((loadedFolders) => {
      if (active) {
        setFolders(loadedFolders)
        setFolderError('')
      }
    }).catch((error: unknown) => {
      if (active) {
        setFolders([])
        setFolderError(error instanceof Error ? error.message : 'Ordner konnten nicht geladen werden.')
      }
    })

    return () => { active = false }
  }, [getToken, isSignedIn, user?.id])

  useEffect(() => {
    const handleFolderChange = (event: Event) => {
      const detail = (event as CustomEvent<{ type: 'rename' | 'delete'; folderId: string; name?: string }>).detail
      if (!detail || !folders) return
      setFolders((current) => current ? detail.type === 'delete' ? current.filter((folder) => folder.id !== detail.folderId) : current.map((folder) => folder.id === detail.folderId && detail.name ? { ...folder, name: detail.name } : folder) : current)
    }
    window.addEventListener('folder-changed', handleFolderChange)
    return () => window.removeEventListener('folder-changed', handleFolderChange)
  }, [folders])

  const handleCreateFolder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const name = folderName.trim()
    if (!name) {
      setCreateFolderError('Bitte gib einen Ordnernamen ein.')
      return
    }
    if (name.length > 100) {
      setCreateFolderError('Der Ordnername darf höchstens 100 Zeichen enthalten.')
      return
    }

    setCreateFolderError('')
    setIsCreatingFolder(true)
    try {
      const token = await getToken()
      if (!token) throw new Error('Bitte melde dich an, um einen Ordner anzulegen.')
      await createFolder(name, token)
      const updatedFolders = await fetchFolders(token)
      setFolders(updatedFolders)
      setFolderName('')
      setIsFolderFormOpen(false)
    } catch (error: unknown) {
      setCreateFolderError(error instanceof Error ? error.message : 'Ordner konnte nicht angelegt werden.')
    } finally {
      setIsCreatingFolder(false)
    }
  }

  return <div className="app-shell">
    <header className="site-header">
      <button className="menu-button" type="button" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-controls="main-navigation"><span aria-hidden="true">☰</span><span className="sr-only">{menuOpen ? 'Menü schließen' : 'Menü öffnen'}</span></button>
      <div className="account-link"><Show when="signed-out"><div className="account-actions"><Link className="sign-in-link" to="/account">Anmelden</Link><Link className="register-link" to="/account">Registrieren</Link></div></Show><Show when="signed-in"><UserButton /></Show></div>
    </header>
    <nav id="main-navigation" className={`main-nav${menuOpen ? ' is-open' : ''}`} aria-label="Hauptnavigation"><Link to="/" activeProps={{ className: 'is-active' }} onClick={() => setMenuOpen(false)}>Startseite</Link><Link to="/new" activeProps={{ className: 'is-active' }} onClick={() => setMenuOpen(false)}>Neu</Link><Link to="/popular" activeProps={{ className: 'is-active' }} onClick={() => setMenuOpen(false)}>Beliebt</Link><Link to="/today" activeProps={{ className: 'is-active' }} onClick={() => setMenuOpen(false)}>Heute</Link><Link to="/commented" activeProps={{ className: 'is-active' }} onClick={() => setMenuOpen(false)}>Meist kommentiert</Link></nav>
    <div className="site-body">
      <aside id="site-sidebar" className="site-sidebar">
        <div className="sidebar-section"><p className="sidebar-title">Kategorien</p>{categories.map((category) => <Link key={category.value} className={`category-link${category.value === selectedCategory ? ' is-selected' : ''}`} to="/" search={category.value === 'Alle Memes' ? {} : { category: category.value }}><CategoryIcon name={category.icon} /><span>{category.label}</span></Link>)}</div>
        <div className="sidebar-divider" />
        <div className="sidebar-section"><div className="sidebar-heading"><p className="sidebar-title">Meine Ordner</p>{isSignedIn ? <button className="add-folder" type="button" aria-label="Ordner anlegen" aria-expanded={isFolderFormOpen} onClick={() => { setIsFolderFormOpen((open) => !open); setCreateFolderError('') }}>＋</button> : <Link className="add-folder" to="/account" aria-label="Anmelden und Ordner anlegen">＋</Link>}</div>
          {isSignedIn && isFolderFormOpen && <form className="folder-form" onSubmit={handleCreateFolder}><label htmlFor="folder-name">Neuer Ordner</label><input id="folder-name" type="text" value={folderName} onChange={(event) => { setFolderName(event.target.value); setCreateFolderError('') }} maxLength={100} placeholder="Ordnername" autoFocus required /><div className="folder-form-actions"><button type="submit" disabled={isCreatingFolder}>{isCreatingFolder ? 'Speichern …' : 'Speichern'}</button><button type="button" onClick={() => { setIsFolderFormOpen(false); setFolderName(''); setCreateFolderError('') }}>Abbrechen</button></div>{createFolderError && <p className="sidebar-note" role="alert">{createFolderError}</p>}</form>}
          {!isSignedIn && <p className="sidebar-note">Anmelden, um Ordner anzulegen.</p>}
          {isSignedIn && !folders && <p className="sidebar-note">Ordner werden geladen …</p>}
          {isSignedIn && folderError && <p className="sidebar-note" role="alert">{folderError}</p>}
          {isSignedIn && folders?.length === 0 && !folderError && <p className="sidebar-note">Noch keine Ordner.</p>}
          {isSignedIn && folders && folders.length > 0 && <div className="folder-links">{folders.map((folder) => <Link key={folder.id} to="/folders/$folderId" params={{ folderId: folder.id }}>{folder.name}</Link>)}</div>}
        </div>
      </aside>
      <main className="page-content"><Outlet /></main>
    </div>
    <footer className="site-footer">Your Meme · Mehr Lachen im Alltag</footer>
  </div>
}

export function MemeList({ sortMode = 'latest', category }: MemeListProps) {
  const [search, setSearch] = useState('')
  const [memes, setMemes] = useState<Meme[] | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [likeError, setLikeError] = useState('')
  const [updatingLikeId, setUpdatingLikeId] = useState('')
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const { user } = useUser()
  const loadMemeList = () => {
    setLoadError(false)
    setMemes(null)
    void getToken()
      .then((token) => fetchMemes(token ?? undefined, undefined, category))
      .then(setMemes)
      .catch(() => setLoadError(true))
  }
  useEffect(() => {
    if (!isLoaded) return

    let active = true
    const controller = new AbortController()
    void getToken()
      .then((token) => {
        if (active) {
          setLoadError(false)
          setLikeError('')
          setMemes(null)
        }
        return fetchMemes(token ?? undefined, controller.signal, category)
      })
      .then((data) => { if (active) setMemes(data) })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        if (active) setLoadError(true)
      })
    return () => { active = false; controller.abort() }
  }, [category, getToken, isLoaded, isSignedIn, user?.id])
  const handleToggleLike = async (memeId: string, liked: boolean) => {
    if (!isSignedIn) {
      setLikeError('Bitte melde dich an, um Memes zu liken.')
      return
    }
    setUpdatingLikeId(memeId)
    try {
      const token = await getToken()
      if (!token) throw new Error('Bitte melde dich an, um Memes zu liken.')
      const result = await setMemeLike(memeId, liked, token)
      setMemes((current) => current?.map((meme) => meme.id === memeId ? { ...meme, likedByMe: result.liked, likeCount: result.likeCount } : meme) ?? current)
      setLikeError('')
    } catch (error: unknown) {
      setLikeError(error instanceof Error ? error.message : 'Der Like konnte nicht gespeichert werden.')
    } finally {
      setUpdatingLikeId('')
    }
  }
  const today = new Date().toDateString()
  const visibleMemes = memes ? [...memes].filter((meme) => sortMode !== 'today' || new Date(meme.createdAt).toDateString() === today).sort((a, b) => sortMode === 'popular' ? b.likeCount - a.likeCount : sortMode === 'comments' ? b.commentCount - a.commentCount : b.createdAt.localeCompare(a.createdAt)).filter((meme) => `${meme.title} ${meme.category} ${getDisplayCategory(meme.category)}`.toLowerCase().includes(search.toLowerCase())) : []
  const pageTitle = sortMode === 'popular' ? 'Beliebte Memes' : sortMode === 'today' ? 'Memes von heute' : sortMode === 'comments' ? 'Meist kommentierte Memes' : 'Finde dein nächstes Lieblingsmeme'
  const sectionTitle = sortMode === 'popular' ? 'Beliebt' : sortMode === 'today' ? 'Heute' : sortMode === 'comments' ? 'Meist kommentiert' : 'Neue Memes'
  return <>
    <section className="hero-section"><p className="eyebrow">Deine tägliche Meme-Auszeit</p><h1>{pageTitle}</h1><p className="intro">Entdecke lustige Memes und teile sie mit der Community.</p><div className="hero-actions"><label className="search-box"><span className="search-icon" aria-hidden="true">⌕</span><span className="sr-only">Memes durchsuchen</span><input type="search" placeholder="Memes durchsuchen ..." value={search} onChange={(event) => setSearch(event.target.value)} /></label><Link className="upload-link" to="/upload">Meme hochladen</Link></div></section>
    <section className="meme-section" aria-labelledby="meme-heading"><div className="section-heading"><div><p className="eyebrow">Für dich ausgewählt</p><h2 id="meme-heading">{sectionTitle}</h2></div><span className="meme-count">{visibleMemes.length} Memes</span></div>
      {likeError && <p className="like-error" role="alert">{likeError}</p>}{loadError ? <MemeState type="error" onRetry={loadMemeList} /> : !memes ? <MemeState type="loading" /> : visibleMemes.length > 0 ? <div className="meme-grid">{visibleMemes.map((meme) => <MemeCard key={meme.id} meme={meme} onToggleLike={handleToggleLike} isUpdating={updatingLikeId === meme.id} />)}</div> : <MemeState type="empty" />}
    </section>
  </>
}

export function HomePage() {
  const search = useSearch({ from: '/' })
  return <MemeList sortMode="latest" category={search.category} />
}

export function PlaceholderPage({ title, text }: { title: string; text: string }) { return <section className="placeholder-page"><p className="eyebrow">Your Meme</p><h1>{title}</h1><p>{text}</p><Link className="primary-link" to="/">Zur Übersicht</Link></section> }

function FolderMemeCard({ meme, onRemove, isRemoving }: { meme: Meme; onRemove: (memeId: string) => void; isRemoving: boolean }) {
  return <article className="meme-card"><Link to="/memes/$memeId" params={{ memeId: meme.id }}><div className="meme-image" role="img" aria-label={`Meme-Bild für ${meme.title}`}>{meme.imageUrl ? <img src={meme.imageUrl} alt={meme.title} loading="lazy" decoding="async" width="600" height="400" /> : <span aria-hidden="true">{meme.emoji}</span>}</div><div className="meme-card-content"><span className="category">{getDisplayCategory(meme.category)}</span><span className="meme-author">Von {meme.author.username}</span><h3>{meme.title}</h3></div></Link><button className="remove-folder-meme" type="button" onClick={() => onRemove(meme.id)} disabled={isRemoving}>{isRemoving ? 'Wird entfernt …' : 'Aus Ordner entfernen'}</button></article>
}

export function FolderPage() {
  const { folderId } = useParams({ from: '/folders/$folderId' })
  const navigate = useNavigate()
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const { user } = useUser()
  const [state, setState] = useState<{ id: string; status: 'loading' | 'loaded' | 'not-found' | 'error'; folder?: MemeFolderDetail }>({ id: '', status: 'loading' })
  const [availableMemes, setAvailableMemes] = useState<Meme[]>([])
  const [selectedMemeId, setSelectedMemeId] = useState('')
  const [addMemeError, setAddMemeError] = useState('')
  const [isAddingMeme, setIsAddingMeme] = useState(false)
  const [removeMemeError, setRemoveMemeError] = useState('')
  const [removingMemeId, setRemovingMemeId] = useState('')
  const [isRenameFormOpen, setIsRenameFormOpen] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const [renameError, setRenameError] = useState('')
  const [isRenaming, setIsRenaming] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) return

    const controller = new AbortController()
    void getToken()
      .then((token) => {
        if (!token) throw new Error('Bitte melde dich an, um den Ordner zu sehen.')
        setState({ id: folderId, status: 'loading' })
        return Promise.all([fetchFolderById(folderId, token, controller.signal), fetchMemes(token, controller.signal)])
      })
      .then(([folder, memes]) => {
        setState(folder ? { id: folderId, status: 'loaded', folder } : { id: folderId, status: 'not-found' })
        setAvailableMemes(memes)
        setSelectedMemeId('')
        setAddMemeError('')
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setState({ id: folderId, status: 'error' })
      })

    return () => controller.abort()
  }, [folderId, getToken, isLoaded, isSignedIn, user?.id])

  const handleAddMeme = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedMemeId) {
      setAddMemeError('Bitte wähle ein Meme aus.')
      return
    }

    setAddMemeError('')
    setIsAddingMeme(true)
    try {
      const token = await getToken()
      if (!token) throw new Error('Bitte melde dich an, um ein Meme zu speichern.')
      await addMemeToFolder(folderId, selectedMemeId, token)
      const updatedFolder = await fetchFolderById(folderId, token)
      if (!updatedFolder) throw new Error('Der Ordner wurde nicht gefunden.')
      setState({ id: folderId, status: 'loaded', folder: updatedFolder })
      setSelectedMemeId('')
    } catch (error: unknown) {
      setAddMemeError(error instanceof Error ? error.message : 'Das Meme konnte nicht gespeichert werden.')
    } finally {
      setIsAddingMeme(false)
    }
  }

  const handleRemoveMeme = async (memeId: string) => {
    setRemoveMemeError('')
    setRemovingMemeId(memeId)
    try {
      const token = await getToken()
      if (!token) throw new Error('Bitte melde dich an, um ein Meme zu entfernen.')
      await removeMemeFromFolder(folderId, memeId, token)
      setState((current) => current.folder ? { ...current, folder: { ...current.folder, memes: current.folder.memes.filter((meme) => meme.id !== memeId) } } : current)
    } catch (error: unknown) {
      setRemoveMemeError(error instanceof Error ? error.message : 'Das Meme konnte nicht aus dem Ordner entfernt werden.')
    } finally {
      setRemovingMemeId('')
    }
  }

  const handleRenameFolder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const name = renameValue.trim()
    if (!name || name.length > 100) {
      setRenameError('Der Ordnername muss zwischen 1 und 100 Zeichen enthalten.')
      return
    }
    setRenameError('')
    setIsRenaming(true)
    try {
      const token = await getToken()
      if (!token) throw new Error('Bitte melde dich an, um den Ordner umzubenennen.')
      const updatedFolder = await renameFolder(folderId, name, token)
      setState((current) => current.folder ? { ...current, folder: { ...current.folder, name: updatedFolder.name } } : current)
      window.dispatchEvent(new CustomEvent('folder-changed', { detail: { type: 'rename', folderId, name: updatedFolder.name } }))
      setIsRenameFormOpen(false)
    } catch (error: unknown) {
      setRenameError(error instanceof Error ? error.message : 'Der Ordner konnte nicht umbenannt werden.')
    } finally {
      setIsRenaming(false)
    }
  }

  const handleDeleteFolder = async () => {
    if (!window.confirm(`Möchtest du den Ordner „${folder?.name ?? ''}“ wirklich löschen? Die gespeicherten Memes bleiben erhalten.`)) return
    setDeleteError('')
    setIsDeleting(true)
    try {
      const token = await getToken()
      if (!token) throw new Error('Bitte melde dich an, um den Ordner zu löschen.')
      await deleteFolder(folderId, token)
      window.dispatchEvent(new CustomEvent('folder-changed', { detail: { type: 'delete', folderId } }))
      await navigate({ to: '/' })
    } catch (error: unknown) {
      setDeleteError(error instanceof Error ? error.message : 'Der Ordner konnte nicht gelöscht werden.')
    } finally {
      setIsDeleting(false)
    }
  }

  const currentState = !isLoaded ? { id: folderId, status: 'loading' as const } : !isSignedIn ? { id: folderId, status: 'error' as const } : state.id === folderId ? state : { id: folderId, status: 'loading' as const }
  if (currentState.status === 'loading') return <section className="folder-page"><Link className="back-link" to="/">← Zurück zu den Memes</Link><MemeState type="loading" /></section>
  if (currentState.status === 'error') return <section className="folder-page"><Link className="back-link" to="/">← Zurück zu den Memes</Link><MemeState type="error" onRetry={() => window.location.reload()} /></section>
  if (currentState.status === 'not-found' || !currentState.folder) return <section className="folder-page"><Link className="back-link" to="/">← Zurück zu den Memes</Link><div className="meme-state"><div className="state-icon" aria-hidden="true">?</div><h3>Dieser Ordner wurde nicht gefunden.</h3><p>Er ist möglicherweise nicht vorhanden oder gehört einem anderen Nutzer.</p><Link className="primary-link" to="/">Zur Übersicht</Link></div></section>

  const folder = currentState.folder
  const savedMemeIds = new Set(folder.memes.map((meme) => meme.id))
  const selectableMemes = availableMemes.filter((meme) => !savedMemeIds.has(meme.id))
  return <section className="folder-page"><Link className="back-link" to="/">← Zurück zu den Memes</Link><div className="section-heading"><div><p className="eyebrow">Meine Sammlung</p><h1>{folder.name}</h1>{isRenameFormOpen && <form className="folder-rename-form" onSubmit={handleRenameFolder}><label htmlFor="folder-rename">Neuer Ordnername</label><div><input id="folder-rename" type="text" value={renameValue} onChange={(event) => { setRenameValue(event.target.value); setRenameError('') }} maxLength={100} autoFocus required /><button type="submit" disabled={isRenaming}>{isRenaming ? 'Speichern …' : 'Speichern'}</button><button type="button" onClick={() => { setIsRenameFormOpen(false); setRenameError('') }}>Abbrechen</button></div>{renameError && <p className="folder-form-error" role="alert">{renameError}</p>}</form>}</div><div className="folder-actions"><span className="meme-count">{folder.memes.length} Memes</span><button type="button" onClick={() => { setRenameValue(folder.name); setRenameError(''); setIsRenameFormOpen(true) }} disabled={isDeleting}>Umbenennen</button><button className="delete-folder-button" type="button" onClick={() => void handleDeleteFolder()} disabled={isDeleting}>{isDeleting ? 'Wird gelöscht …' : 'Ordner löschen'}</button></div></div>
    <form className="folder-add-meme" onSubmit={handleAddMeme}><label htmlFor="folder-meme">Meme zu diesem Ordner hinzufügen</label><div className="folder-add-meme-row"><select id="folder-meme" value={selectedMemeId} onChange={(event) => { setSelectedMemeId(event.target.value); setAddMemeError('') }} disabled={isAddingMeme || selectableMemes.length === 0}><option value="">Meme auswählen …</option>{selectableMemes.map((meme) => <option key={meme.id} value={meme.id}>{meme.title}</option>)}</select><button className="primary-link" type="submit" disabled={isAddingMeme || selectableMemes.length === 0}>{isAddingMeme ? 'Wird gespeichert …' : 'Hinzufügen'}</button></div>{selectableMemes.length === 0 && <p className="folder-form-note">Alle verfügbaren Memes sind bereits in diesem Ordner.</p>}{addMemeError && <p className="folder-form-error" role="alert">{addMemeError}</p>}</form>
    {removeMemeError && <p className="folder-form-error" role="alert">{removeMemeError}</p>}{deleteError && <p className="folder-form-error" role="alert">{deleteError}</p>}{folder.memes.length === 0 ? <MemeState type="empty" /> : <div className="meme-grid">{folder.memes.map((meme) => <FolderMemeCard key={meme.id} meme={meme} onRemove={handleRemoveMeme} isRemoving={removingMemeId === meme.id} />)}</div>}</section>
}

export function AccountPage() {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  return <section className="account-page"><Show when="signed-in"><div className="account-signed-in"><p className="eyebrow">Dein Konto</p><h1>Willkommen zurück!</h1><p>Du bist bereits angemeldet.</p><UserButton showName /></div></Show><Show when="signed-out"><div className="auth-switcher" role="group" aria-label="Anmeldung auswählen"><button className={mode === 'sign-in' ? 'active' : ''} type="button" onClick={() => setMode('sign-in')}>Anmelden</button><button className={mode === 'sign-up' ? 'active' : ''} type="button" onClick={() => setMode('sign-up')}>Registrieren</button></div>{mode === 'sign-in' ? <SignIn routing="hash" /> : <SignUp routing="hash" />}</Show></section>
}
export function UploadPage() {
  const navigate = useNavigate()
  const { getToken } = useAuth()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
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
    if (!category) {
      setUploadError('Bitte wähle eine Kategorie aus.')
      return
    }

    setIsUploading(true)
    try {
      const token = await getToken()
      if (!token) throw new Error('Bitte melde dich an, um ein Meme hochzuladen.')
      await syncCurrentUser(token)
      const { id } = await uploadMeme(createMemeFormData(title, selectedFile, category), token)
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
      <label className="upload-field"><span>Kategorie</span><select value={category} onChange={(event) => setCategory(event.target.value)} required><option value="">Kategorie auswählen …</option>{categoryOptions.map((option) => <option key={option} value={categoryApiValues[option]}>{option}</option>)}</select></label>
      <p className="upload-hint">Erlaubt ist eine PNG-Datei mit maximal 5 MiB.</p>
      {uploadError && <p className="upload-error" role="alert">{uploadError}</p>}
      <button className="primary-link upload-submit" type="submit" disabled={isUploading}>{isUploading ? 'Wird hochgeladen …' : 'Meme hochladen'}</button>
    </form>
  </section>
}
export function MemeDetailPage() {
  const { memeId } = useParams({ from: '/memes/$memeId' })
  const navigate = useNavigate()
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const { user } = useUser()
  const [detailState, setDetailState] = useState<{ id: string; status: 'loading' | 'loaded' | 'not-found' | 'error'; meme?: Meme }>({ id: '', status: 'loading' })
  const [commentState, setCommentState] = useState<{ id: string; status: 'loading' | 'loaded' | 'error'; comments?: MemeComment[] }>({ id: '', status: 'loading' })
  const [commentText, setCommentText] = useState('')
  const [commentError, setCommentError] = useState('')
  const [isSendingComment, setIsSendingComment] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingCommentText, setEditingCommentText] = useState('')
  const [commentActionError, setCommentActionError] = useState('')
  const [isSavingComment, setIsSavingComment] = useState(false)
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)
  const [detailLike, setDetailLike] = useState({ id: '', liked: false, likeCount: 0 })
  const [likeError, setLikeError] = useState('')
  const [isUpdatingLike, setIsUpdatingLike] = useState(false)
  const [localUserId, setLocalUserId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [isDeletingMeme, setIsDeletingMeme] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editTitleError, setEditTitleError] = useState('')
  const [isSavingTitle, setIsSavingTitle] = useState(false)
  const [detailFolders, setDetailFolders] = useState<MemeFolder[] | null>(null)
  const [detailFoldersUserId, setDetailFoldersUserId] = useState<string | null>(null)
  const [selectedFolderId, setSelectedFolderId] = useState('')
  const [folderSaveError, setFolderSaveError] = useState('')
  const [folderSaveMessage, setFolderSaveMessage] = useState('')
  const [isSavingToFolder, setIsSavingToFolder] = useState(false)

  useEffect(() => {
    if (!isLoaded) return

    const controller = new AbortController()

    void getToken()
      .then((token) => {
        setDetailState({ id: memeId, status: 'loading' })
        setDetailLike({ id: '', liked: false, likeCount: 0 })
        setDeleteError('')
        if (!token) {
          setLocalUserId(null)
          return fetchMemeById(memeId, undefined, controller.signal)
        }
        return syncCurrentUser(token).then(({ id }) => {
          setLocalUserId(id)
          return fetchMemeById(memeId, token, controller.signal)
        })
      })
      .then((data) => {
        setDetailState(data ? { id: memeId, status: 'loaded', meme: data } : { id: memeId, status: 'not-found' })
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setDetailState({ id: memeId, status: 'error' })
      })

    return () => controller.abort()
  }, [getToken, isLoaded, isSignedIn, memeId, user?.id])

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

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return
    }

    const controller = new AbortController()
    void getToken()
      .then((token) => {
        if (!token) throw new Error('Bitte melde dich an, um deine Ordner zu sehen.')
        return fetchFolders(token, controller.signal)
      })
      .then((folders) => {
        setDetailFolders(folders)
        setDetailFoldersUserId(user?.id ?? null)
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setFolderSaveError(error instanceof Error ? error.message : 'Ordner konnten nicht geladen werden.')
      })

    return () => controller.abort()
  }, [getToken, isLoaded, isSignedIn, user?.id])

  const currentState = detailState.id === memeId ? detailState : { id: memeId, status: 'loading' as const }
  const currentCommentState = commentState.id === memeId ? commentState : { id: memeId, status: 'loading' as const }
  if (currentState.status === 'error') return <section className="placeholder-page"><MemeState type="error" onRetry={() => window.location.reload()} /><Link className="primary-link" to="/">Zur Übersicht</Link></section>
  if (currentState.status === 'not-found') return <section className="placeholder-page"><MemeState type="not-found" /><Link className="primary-link" to="/">Zur Übersicht</Link></section>
  if (currentState.status === 'loading' || !currentState.meme) return <section className="placeholder-page"><MemeState type="loading" /></section>

  const meme = currentState.meme
  const foldersForCurrentUser = detailFoldersUserId === user?.id ? detailFolders : null

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

  const handleDeleteMeme = async () => {
    if (!window.confirm('Möchtest du dein Meme wirklich löschen? Dieser Schritt kann nicht rückgängig gemacht werden.')) return

    setDeleteError('')
    setIsDeletingMeme(true)
    try {
      const token = await getToken()
      if (!token) throw new Error('Bitte melde dich an, um dein Meme zu löschen.')
      await deleteMeme(memeId, token)
      await navigate({ to: '/' })
    } catch (error: unknown) {
      setDeleteError(error instanceof Error ? error.message : 'Das Meme konnte nicht gelöscht werden.')
    } finally {
      setIsDeletingMeme(false)
    }
  }

  const handleEditTitle = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextTitle = editTitle.trim()
    if (!nextTitle) {
      setEditTitleError('Bitte gib einen Titel ein.')
      return
    }
    setEditTitleError('')
    setIsSavingTitle(true)
    try {
      const token = await getToken()
      if (!token) throw new Error('Bitte melde dich an, um dein Meme zu bearbeiten.')
      await updateMemeTitle(memeId, nextTitle, token)
      setDetailState((current) => current.meme ? { ...current, meme: { ...current.meme, title: nextTitle } } : current)
      setIsEditingTitle(false)
    } catch (error: unknown) {
      setEditTitleError(error instanceof Error ? error.message : 'Der Meme-Titel konnte nicht geändert werden.')
    } finally {
      setIsSavingTitle(false)
    }
  }

  const handleSaveToFolder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedFolderId) {
      setFolderSaveError('Bitte wähle einen Ordner aus.')
      setFolderSaveMessage('')
      return
    }

    setFolderSaveError('')
    setFolderSaveMessage('')
    setIsSavingToFolder(true)
    try {
      const token = await getToken()
      if (!token) throw new Error('Bitte melde dich an, um Memes zu speichern.')
      await addMemeToFolder(selectedFolderId, memeId, token)
      setSelectedFolderId('')
      setFolderSaveMessage('Das Meme wurde in deinem Ordner gespeichert.')
    } catch (error: unknown) {
      setFolderSaveError(error instanceof Error ? error.message : 'Das Meme konnte nicht gespeichert werden.')
    } finally {
      setIsSavingToFolder(false)
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

  const handleCommentEdit = async (event: FormEvent<HTMLFormElement>, commentId: string) => {
    event.preventDefault()
    const content = editingCommentText.trim()
    if (!content) {
      setCommentActionError('Bitte schreibe einen Kommentar.')
      return
    }
    if (content.length > 1000) {
      setCommentActionError('Dein Kommentar darf höchstens 1.000 Zeichen enthalten.')
      return
    }

    setCommentActionError('')
    setIsSavingComment(true)
    try {
      const token = await getToken()
      if (!token) throw new Error('Bitte melde dich an, um deinen Kommentar zu bearbeiten.')
      const updatedComment = await updateMemeComment(commentId, content, token)
      setCommentState((current) => ({ ...current, comments: current.comments?.map((comment) => comment.id === commentId ? updatedComment : comment) }))
      setEditingCommentId(null)
    } catch (error: unknown) {
      setCommentActionError(error instanceof Error ? error.message : 'Der Kommentar konnte nicht geändert werden.')
    } finally {
      setIsSavingComment(false)
    }
  }

  const handleCommentDelete = async (commentId: string) => {
    if (!window.confirm('Möchtest du diesen Kommentar wirklich löschen?')) return

    setCommentActionError('')
    setDeletingCommentId(commentId)
    try {
      const token = await getToken()
      if (!token) throw new Error('Bitte melde dich an, um deinen Kommentar zu löschen.')
      await deleteMemeComment(commentId, token)
      setCommentState((current) => ({ ...current, comments: current.comments?.filter((comment) => comment.id !== commentId) }))
    } catch (error: unknown) {
      setCommentActionError(error instanceof Error ? error.message : 'Der Kommentar konnte nicht gelöscht werden.')
    } finally {
      setDeletingCommentId(null)
    }
  }

  const commentCount = currentCommentState.status === 'loaded' ? currentCommentState.comments?.length ?? meme.commentCount : meme.commentCount

  return <section className="detail-page">
    <Link className="back-link" to="/">← Zurück zu den Memes</Link>
    <article className="detail-card">
      <div className="detail-image" role="img" aria-label={`Meme-Bild für ${meme.title}`}>{meme.imageUrl ? <img src={meme.imageUrl} alt={meme.title} decoding="async" width="900" height="600" /> : <span aria-hidden="true">{meme.emoji}</span>}</div>
      <div className="detail-content">
        <span className="category detail-category">{getDisplayCategory(meme.category)}</span>
        <h1>{meme.title}</h1>
        <p className="detail-author">Von <strong>{meme.author.username}</strong> · {new Date(meme.createdAt).toLocaleDateString('de-DE')}</p>
        <div className="detail-actions"><button className={`like-button${displayedLike.liked ? ' liked' : ''}`} type="button" aria-pressed={displayedLike.liked} onClick={handleLike} disabled={isUpdatingLike}><span aria-hidden="true">{displayedLike.liked ? '♥' : '♡'}</span>{displayedLike.likeCount} Likes</button><a className="comment-count comment-link" href="#comments-section" aria-label={`Zu den ${commentCount} Kommentaren springen`}>💬 {commentCount} Kommentare</a></div>{likeError && <p className="like-error" role="alert">{likeError}</p>}{deleteError && <p className="like-error" role="alert">{deleteError}</p>}
        {isSignedIn && <section className="save-folder-section" aria-labelledby="save-folder-heading"><h2 id="save-folder-heading">Für später speichern</h2>{foldersForCurrentUser === null && !folderSaveError && <p className="folder-form-note">Ordner werden geladen …</p>}{folderSaveError && <p className="folder-form-error" role="alert">{folderSaveError}</p>}{foldersForCurrentUser?.length === 0 && <p className="folder-form-note">Du hast noch keinen Ordner angelegt. Lege zuerst links unter „Meine Ordner“ einen Ordner an.</p>}{foldersForCurrentUser && foldersForCurrentUser.length > 0 && <form className="save-folder-form" onSubmit={handleSaveToFolder}><label htmlFor="detail-folder">Ordner auswählen</label><div><select id="detail-folder" value={selectedFolderId} onChange={(event) => { setSelectedFolderId(event.target.value); setFolderSaveError(''); setFolderSaveMessage('') }} disabled={isSavingToFolder}><option value="">Ordner auswählen …</option>{foldersForCurrentUser.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select><button className="primary-link" type="submit" disabled={isSavingToFolder}>{isSavingToFolder ? 'Wird gespeichert …' : 'Speichern'}</button></div>{folderSaveMessage && <p className="folder-form-success" role="status">{folderSaveMessage}</p>}</form>}</section>}
        <section id="comments-section" className="comments-section" aria-labelledby="comments-heading" tabIndex={-1}><h2 id="comments-heading">Kommentare</h2>{isSignedIn ? <form className="comment-form" onSubmit={handleCommentSubmit}><label htmlFor="comment-content">Dein Kommentar</label><textarea id="comment-content" value={commentText} onChange={(event) => { setCommentText(event.target.value); setCommentError('') }} maxLength={1000} rows={4} placeholder="Schreibe einen Kommentar …" required /><button className="primary-link" type="submit" disabled={isSendingComment}>{isSendingComment ? 'Wird gesendet …' : 'Kommentar senden'}</button>{commentError && <p className="comment-error" role="alert">{commentError}</p>}</form> : <p className="comment-placeholder">Bitte <Link to="/account">melde dich an</Link>, um zu kommentieren.</p>}{commentActionError && <p className="comment-error" role="alert">{commentActionError}</p>}{currentCommentState.status === 'loading' && <p className="comment-placeholder">Kommentare werden geladen …</p>}{currentCommentState.status === 'error' && <p className="comment-placeholder">Kommentare konnten nicht geladen werden.</p>}{currentCommentState.status === 'loaded' && currentCommentState.comments?.length === 0 && <p className="comment-placeholder">Noch keine Kommentare.</p>}{currentCommentState.status === 'loaded' && currentCommentState.comments && currentCommentState.comments.length > 0 && <div className="comment-list">{currentCommentState.comments.map((comment) => <article className="comment-item" key={comment.id}>{editingCommentId === comment.id ? <form className="comment-edit-form" onSubmit={(event) => void handleCommentEdit(event, comment.id)}><label htmlFor={`edit-comment-${comment.id}`}>Kommentar bearbeiten</label><textarea id={`edit-comment-${comment.id}`} value={editingCommentText} onChange={(event) => { setEditingCommentText(event.target.value); setCommentActionError('') }} maxLength={1000} rows={3} required /><div className="comment-actions"><button className="primary-link" type="submit" disabled={isSavingComment}>{isSavingComment ? 'Wird gespeichert …' : 'Speichern'}</button><button className="secondary-link" type="button" onClick={() => setEditingCommentId(null)}>Abbrechen</button></div></form> : <><p>{comment.content}</p><small>Von {comment.author.username} · {new Date(comment.createdAt).toLocaleDateString('de-DE')}</small>{isSignedIn && localUserId === comment.userId && <div className="comment-actions"><button className="secondary-link" type="button" onClick={() => { setEditingCommentId(comment.id); setEditingCommentText(comment.content); setCommentActionError('') }}>Bearbeiten</button><button className="comment-delete-button" type="button" onClick={() => void handleCommentDelete(comment.id)} disabled={deletingCommentId === comment.id}>{deletingCommentId === comment.id ? 'Wird gelöscht …' : 'Löschen'}</button></div>}</>}</article>)}</div>}</section>{isSignedIn && localUserId === meme.author.id && <section className="detail-management" aria-labelledby="detail-management-heading"><div className="detail-management-content"><h2 id="detail-management-heading">Eigenes Meme verwalten</h2><p>Du kannst dein Meme dauerhaft löschen oder den Titel ändern.</p>{isEditingTitle && <form className="edit-title-form" onSubmit={handleEditTitle}><label htmlFor="edit-meme-title">Meme-Titel</label><input id="edit-meme-title" value={editTitle} onChange={(event) => { setEditTitle(event.target.value); setEditTitleError('') }} maxLength={100} required /><div className="edit-title-actions"><button className="primary-link" type="submit" disabled={isSavingTitle}>{isSavingTitle ? 'Wird gespeichert …' : 'Titel speichern'}</button><button className="secondary-link" type="button" onClick={() => { setIsEditingTitle(false); setEditTitleError('') }}>Abbrechen</button></div>{editTitleError && <p className="edit-title-error" role="alert">{editTitleError}</p>}</form>}</div><div className="detail-management-actions"><button className="secondary-link" type="button" onClick={() => { setEditTitle(meme.title); setEditTitleError(''); setIsEditingTitle((current) => !current) }}>{isEditingTitle ? 'Bearbeiten schließen' : 'Titel bearbeiten'}</button><button className="delete-meme-button" type="button" onClick={() => void handleDeleteMeme()} disabled={isDeletingMeme}>{isDeletingMeme ? 'Wird gelöscht …' : 'Löschen'}</button></div></section>}
      </div>
    </article>
  </section>
}

