import { useLocation } from 'react-router-dom'

const titles = {
  '/about': 'About',
  '/help': 'Help',
  '/feedback': 'Feedback',
  '/profile': 'Profile',
  '/settings': 'Settings',
  '/history': 'Download All Analysis History',
}

export default function PlaceholderPage() {
  const { pathname } = useLocation()
  const title = titles[pathname] || 'Page'

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-800 mb-4">{title}</h1>
      <p className="text-slate-600">
        This section is available from the sidebar. Content for {title} can be added here.
      </p>
    </div>
  )
}
