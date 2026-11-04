import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { Layout, MemeDetailPage, MemeList, PlaceholderPage, UploadPage } from '../App'

const rootRoute = createRootRoute({ component: Layout })
type CategorySearch = { category?: string }
const homeRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', validateSearch: (search: Record<string, unknown>): CategorySearch => ({ category: typeof search.category === 'string' ? search.category : undefined }), component: () => <MemeList /> })
const popularRoute = createRoute({ getParentRoute: () => rootRoute, path: '/popular', component: () => <MemeList top /> })
const newRoute = createRoute({ getParentRoute: () => rootRoute, path: '/new', component: () => <MemeList /> })
const topRoute = createRoute({ getParentRoute: () => rootRoute, path: '/top', component: () => <MemeList top /> })
const uploadRoute = createRoute({ getParentRoute: () => rootRoute, path: '/upload', component: UploadPage })
const accountRoute = createRoute({ getParentRoute: () => rootRoute, path: '/account', component: () => <PlaceholderPage title="Anmelden / Profil" text="Hier erscheinen Anmeldung und Kontoeinstellungen." /> })
const memeRoute = createRoute({ getParentRoute: () => rootRoute, path: '/memes/$memeId', component: MemeDetailPage })
const folderRoute = createRoute({ getParentRoute: () => rootRoute, path: '/folders/$folderId', component: () => <PlaceholderPage title="Mein Ordner" text="Dieser persönliche Ordner wird nach der Anmeldung verfügbar." /> })
const routeTree = rootRoute.addChildren([homeRoute, popularRoute, newRoute, topRoute, uploadRoute, accountRoute, memeRoute, folderRoute])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}
