import React from 'react';

export default function Footer() {
  return (
    <footer className="mt-auto bg-[#03045E] text-white/80 border-t border-white/10 text-xs py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Left: Logo ParuhKita (Graduation Cap in Cyan Circle) */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#00B4D8] flex items-center justify-center text-white shadow-xs">
            <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
              <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/>
              <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" opacity="0.8"/>
            </svg>
          </div>
          <span className="font-bold text-base text-white tracking-tight">ParuhKita</span>
          <span className="text-white/30 hidden sm:inline">&middot;</span>
          <span className="text-slate-300 text-xs">
            Langkah kecil, masa depan besar. &copy; {new Date().getFullYear()} ParuhKita
          </span>
        </div>

        {/* Right: Policy Links */}
        <div className="flex items-center gap-3 text-slate-300 text-xs">
          <a href="#" className="hover:text-white transition">Pusat bantuan</a>
          <span>&middot;</span>
          <a href="#" className="hover:text-white transition">Privasi</a>
          <span>&middot;</span>
          <a href="#" className="hover:text-white transition">Ketentuan</a>
        </div>

      </div>
    </footer>
  );
}
