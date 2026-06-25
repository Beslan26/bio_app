import { Outlet } from 'react-router-dom';

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-medical-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-xl font-semibold text-medical-700">
            Медицинский помощник
          </h1>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-medical-100 py-4 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} Медицинский помощник
      </footer>
    </div>
  );
}
