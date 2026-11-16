import { Link, Outlet, useNavigate, useParams } from '@tanstack/react-router'
import { useEffect, useState, type FormEvent } from 'react'
import { Show, SignIn, SignUp, UserButton, useAuth, useUser } from '@clerk/react'
import type { Meme, MemeComment } from './types/meme'
import type { MemeFolder, MemeFolderDetail } from './types/folder'
import { MemeState } from './components/ui/MemeState'
import { createMemeComment, createMemeFormData, fetchMemeById, fetchMemeComments, fetchMemes, setMemeLike, syncCurrentUser, uploadMeme, validateMemeImage } from './api/memes'
import { addMemeToFolder, createFolder, deleteFolder, fetchFolderById, fetchFolders, removeMemeFromFolder, renameFolder } from './api/folders'
import './App.css'

type MemeListProps = {
  top?: boolean
}

type MemeCardProps = {
  meme: Meme
  onToggleLike: (memeId: string, liked: boolean) => void
  isUpdating: boolean
}

type CategoryIconName = 'grid' | 'briefcase' | 'code' | 'coffee' | 'paw' | 'food' | 'book' | 'gamepad' | 'home' | 'calendar'

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
    <div className="meme-card-content"><span className="category">{meme.category}</span><span className="meme-author">Von {meme.author.username}</span><h3>{meme.title}</h3><button className={`like-button${meme.likedByMe ? ' liked' : ''}`} type="button" aria-pressed={meme.likedByMe} disabled={isUpdating} onClick={() => onToggleLike(meme.id, !meme.likedByMe)}><span aria-hidden="true">{meme.likedByMe ? '♥' : '♡'}</span>{meme.likeCount} Likes</button></div>
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
  const categories = [
    { name: 'Alle Memes', icon: 'grid' as const },
    { name: 'Arbeit', icon: 'briefcase' as const },
    { name: 'Programmieren', icon: 'code' as const },
    { name: 'Kaffee', icon: 'coffee' as const },
    { name: 'Tiere', icon: 'paw' as const },
    { name: 'Essen', icon: 'food' as const },
    { name: 'Lernen', icon: 'book' as const },
    { name: 'Gaming', icon: 'gamepad' as const },
    { name: 'Zuhause', icon: 'home' as const },
    { name: 'Wochenende', icon: 'calendar' as const },
  ]

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
    <nav id="main-navigation" className={`main-nav${menuOpen ? ' is-open' : ''}`} aria-label="Hauptnavigation"><Link to="/" activeProps={{ className: 'is-active' }} onClick={() => setMenuOpen(false)}>Startseite</Link><Link to="/new" activeProps={{ className: 'is-active' }} onClick={() => setMenuOpen(false)}>Neu</Link><Link to="/popular" activeProps={{ className: 'is-active' }} onClick={() => setMenuOpen(false)}>Beliebt</Link><Link to="/" onClick={() => setMenuOpen(false)}>Kategorien</Link><Link to="/" onClick={() => setMenuOpen(false)}>Community</Link></nav>
    <div className="site-body">
      <aside id="site-sidebar" className="site-sidebar">
        <div className="sidebar-section"><p className="sidebar-title">Kategorien</p>{categories.map((category) => <Link key={category.name} className={`category-link${category.name === 'Alle Memes' ? ' is-selected' : ''}`} to="/" search={category.name === 'Alle Memes' ? {} : { category: category.name }}><CategoryIcon name={category.icon} /><span>{category.name}</span></Link>)}</div>
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

export function MemeList({ top = false }: MemeListProps) {
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
      .then((token) => fetchMemes(token ?? undefined))
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
        return fetchMemes(token ?? undefined, controller.signal)
      })
      .then((data) => { if (active) setMemes(data) })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        if (active) setLoadError(true)
      })
    return () => { active = false; controller.abort() }
  }, [getToken, isLoaded, isSignedIn, user?.id])
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
  const visibleMemes = memes ? [...memes].sort((a, b) => top ? b.likeCount - a.likeCount : b.createdAt.localeCompare(a.createdAt)).filter((meme) => `${meme.title} ${meme.category}`.toLowerCase().includes(search.toLowerCase())) : []
  return <>
    <section className="hero-section"><p className="eyebrow">Deine tägliche Meme-Auszeit</p><h1>{top ? 'Die meist gelikten Memes' : 'Finde dein nächstes Lieblingsmeme'}</h1><p className="intro">Entdecke lustige Memes und teile sie mit der Community.</p><div className="hero-actions"><label className="search-box"><span className="search-icon" aria-hidden="true">⌕</span><span className="sr-only">Memes durchsuchen</span><input type="search" placeholder="Memes durchsuchen ..." value={search} onChange={(event) => setSearch(event.target.value)} /></label><Link className="upload-link" to="/upload">Meme hochladen</Link></div></section>
    <section className="meme-section" aria-labelledby="meme-heading"><div className="section-heading"><div><p className="eyebrow">{top ? 'Community-Favoriten' : 'Für dich ausgewählt'}</p><h2 id="meme-heading">{top ? 'Meist geliked' : 'Neue Memes'}</h2></div><span className="meme-count">{visibleMemes.length} Memes</span></div><nav className="feed-filters" aria-label="Meme-Filter"><Link className="filter-new" to="/">Neueste</Link><Link className="filter-popular" to="/popular">Beliebt</Link><Link className="filter-today" to="/new">Heute</Link></nav>
      {likeError && <p className="like-error" role="alert">{likeError}</p>}{loadError ? <MemeState type="error" onRetry={loadMemeList} /> : !memes ? <MemeState type="loading" /> : visibleMemes.length > 0 ? <div className="meme-grid">{visibleMemes.map((meme) => <MemeCard key={meme.id} meme={meme} onToggleLike={handleToggleLike} isUpdating={updatingLikeId === meme.id} />)}</div> : <MemeState type="empty" />}
    </section>
  </>
}

export function PlaceholderPage({ title, text }: { title: string; text: string }) { return <section className="placeholder-page"><p className="eyebrow">Your Meme</p><h1>{title}</h1><p>{text}</p><Link className="primary-link" to="/">Zur Übersicht</Link></section> }

function FolderMemeCard({ meme, onRemove, isRemoving }: { meme: Meme; onRemove: (memeId: string) => void; isRemoving: boolean }) {
  return <article className="meme-card"><Link to="/memes/$memeId" params={{ memeId: meme.id }}><div className="meme-image" role="img" aria-label={`Meme-Bild für ${meme.title}`}>{meme.imageUrl ? <img src={meme.imageUrl} alt={meme.title} loading="lazy" decoding="async" width="600" height="400" /> : <span aria-hidden="true">{meme.emoji}</span>}</div><div className="meme-card-content"><span className="category">{meme.category}</span><span className="meme-author">Von {meme.author.username}</span><h3>{meme.title}</h3></div></Link><button className="remove-folder-meme" type="button" onClick={() => onRemove(meme.id)} disabled={isRemoving}>{isRemoving ? 'Wird entfernt …' : 'Aus Ordner entfernen'}</button></article>
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
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const { user } = useUser()
  const [detailState, setDetailState] = useState<{ id: string; status: 'loading' | 'loaded' | 'not-found' | 'error'; meme?: Meme }>({ id: '', status: 'loading' })
  const [commentState, setCommentState] = useState<{ id: string; status: 'loading' | 'loaded' | 'error'; comments?: MemeComment[] }>({ id: '', status: 'loading' })
  const [commentText, setCommentText] = useState('')
  const [commentError, setCommentError] = useState('')
  const [isSendingComment, setIsSendingComment] = useState(false)
  const [detailLike, setDetailLike] = useState({ id: '', liked: false, likeCount: 0 })
  const [likeError, setLikeError] = useState('')
  const [isUpdatingLike, setIsUpdatingLike] = useState(false)

  useEffect(() => {
    if (!isLoaded) return

    const controller = new AbortController()

    void getToken()
      .then((token) => {
        setDetailState({ id: memeId, status: 'loading' })
        setDetailLike({ id: '', liked: false, likeCount: 0 })
        return fetchMemeById(memeId, token ?? undefined, controller.signal)
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

