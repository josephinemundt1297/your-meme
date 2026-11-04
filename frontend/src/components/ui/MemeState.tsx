type MemeStateProps = {
  type: 'loading' | 'empty' | 'error' | 'not-found'
  onRetry?: () => void
}

const stateContent = {
  loading: { title: 'Memes werden geladen …', text: 'Einen Moment bitte.' },
  empty: { title: 'Hier gibt es noch keine Memes.', text: 'Schau später noch einmal vorbei.' },
  error: { title: 'Memes konnten nicht geladen werden.', text: 'Bitte versuche es erneut.' },
  'not-found': { title: 'Dieses Meme wurde nicht gefunden.', text: 'Es wurde möglicherweise gelöscht oder ist nicht verfügbar.' },
}

export function MemeState({ type, onRetry }: MemeStateProps) {
  const content = stateContent[type]
  return <div className={`meme-state meme-state-${type}`} role={type === 'error' ? 'alert' : 'status'}>
    {type === 'loading' && <div className="loading-skeletons" aria-hidden="true"><span /><span /><span /></div>}
    <div className="state-icon" aria-hidden="true">{type === 'loading' ? '◌' : type === 'error' ? '!' : type === 'not-found' ? '?' : '◡'}</div>
    <h3>{content.title}</h3>
    <p>{content.text}</p>
    {type === 'error' && <button className="primary-link state-retry" type="button" onClick={onRetry}>Erneut versuchen</button>}
  </div>
}
