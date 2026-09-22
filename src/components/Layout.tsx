import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'

export default function Layout() {
  return (
    <div className="min-h-dvh bg-[#F5F6F7] flex flex-col">
      <main className="flex-1 max-w-lg w-full mx-auto px-4 pt-4 pb-24" data-mobile>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
