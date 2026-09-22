import { NavLink } from 'react-router-dom'
import { IconHome, IconBook, IconChart, IconGear } from './icons'

const tabs = [
  { to: '/', label: 'Learn', icon: IconHome },
  { to: '/wrong', label: 'Wrong Book', icon: IconBook },
  { to: '/stats', label: 'Stats', icon: IconChart },
  { to: '/settings', label: 'Settings', icon: IconGear },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-lg mx-auto flex">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.to === '/'}
            className={({ isActive }) =>
              `relative flex-1 flex flex-col items-center pt-2.5 pb-2 transition-colors ${
                isActive ? 'text-[#FF5252]' : 'text-gray-400 hover:text-gray-600'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <t.icon width={23} height={23} />
                <span className={`mt-1 text-[11px] leading-none ${isActive ? 'font-semibold' : ''}`}>{t.label}</span>
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-b-full bg-[#FF5252]" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
