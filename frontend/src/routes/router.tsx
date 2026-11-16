import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { AccountPage, FolderPage, HomePage, Layout, MemeDetailPage, MemeList, UploadPage } from '../App'

const rootRoute = createRootRoute({ component: Layout })
type CategorySearch = { category?: string }
const homeRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', validateSearch: (search: Record<string, unknown>): CategorySearch => ({ category: typeof search.category === 'string' ? search.category : undefined }), component: HomePage })
const popularRoute = createRoute({ getParentRoute: () => rootRoute, path: '/popular', component: () => <MemeList sortMode="popular" /> })
const newRoute = createRoute({ getParentRoute: () => rootRoute, path: '/new', component: () => <MemeList sortMode="latest" /> })
const todayRoute = createRoute({ getParentRoute: () => rootRoute, path: '/today', component: () => <MemeList sortMode="today" /> })
const commentedRoute = createRoute({ getParentRoute: () => rootRoute, path: '/commented', component: () => <MemeList sortMode="comments" /> })
const uploadRoute = createRoute({ getParentRoute: () => rootRoute, path: '/upload', component: UploadPage })
const accountRoute = createRoute({ getParentRoute: () => rootRoute, path: '/account', component: AccountPage })
const memeRoute = createRoute({ getParentRoute: () => rootRoute, path: '/memes/$memeId', component: MemeDetailPage })
const folderRoute = createRoute({ getParentRoute: () => rootRoute, path: '/folders/$folderId', component: FolderPage })
const routeTree = rootRoute.addChildren([homeRoute, popularRoute, newRoute, todayRoute, commentedRoute, uploadRoute, accountRoute, memeRoute, folderRoute])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}
