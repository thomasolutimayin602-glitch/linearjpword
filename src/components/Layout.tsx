import { NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { path: '/', label: '学習', icon: '📖' },
  { path: '/wrong', label: '錯詞', icon: '❌' },
  { path: '/stats', label: '統計', icon: '📊' },
  { path: '/settings', label: '設定', icon: '⚙️' },
]

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📚</span>
          <h1 className="text-lg font-bold text-gray-800">語詞</h1>
        </div>
        <span className="text-xs text-gray-400">日语背单词</span>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
        <div className="max-w-lg mx-auto flex">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center py-2 text-xs transition-colors ${
                  isActive
                    ? 'text-red-500 font-bold'
                    : 'text-gray-400 hover:text-gray-600'
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
