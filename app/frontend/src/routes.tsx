import { createHashRouter, Navigate } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { UploadScreen } from './screens/UploadScreen'
import { DashboardScreen } from './screens/DashboardScreen'
import { PlaybackScreen } from './screens/PlaybackScreen'

// Hash router: no server rewrites needed for the static demo. Sidebar state is
// derived from whether a video is loaded, independent of the active route.
export const router = createHashRouter([
  {
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/upload" replace /> },
      { path: 'upload', element: <UploadScreen /> },
      { path: 'v/:hash/dashboard', element: <DashboardScreen /> },
      { path: 'v/:hash/playback', element: <PlaybackScreen /> },
    ],
  },
])
