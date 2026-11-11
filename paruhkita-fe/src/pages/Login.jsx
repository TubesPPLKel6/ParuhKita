import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ArrowRight, UserCheck, Store, AlertCircle } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-fill dari registrasi terakhir
  useEffect(() => {
    const lastUserRaw = localStorage.getItem('last_registered_user');
    if (lastUserRaw) {
      try {
        const lastUser = JSON.parse(lastUserRaw);
        if (typeof lastUser.email === 'string') setEmail(lastUser.email);
      } catch (e) {
        console.error(e);
      } finally {
        localStorage.removeItem('last_registered_user');
      }
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setErrorMessage('Alamat email dan kata sandi wajib diisi!');
      return;
    }

    setLoading(true);

    try {
      const result = await login(cleanEmail, password);
      const userData = result.data.user;

      if (userData.role === 'admin') {
        navigate('/admin/merchant-verifications');
      } else if (userData.role === 'merchant') {
        navigate('/merchant/dashboard');
      } else {
        navigate('/kesiapan-karier');
      }
    } catch (err) {
      const validationErrors = err.response?.data?.errors;
      const firstValidationError = validationErrors
        ? Object.values(validationErrors)[0]?.[0]
        : null;
      setErrorMessage(
        firstValidationError
          || err.response?.data?.message
          || (err.request
            ? 'Tidak dapat terhubung ke server. Pastikan backend ParuhKita sedang berjalan.'
            : err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const setAkunTesting = (emailTest, passTest) => {
    setEmail(emailTest);
    setPassword(passTest);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F9FC]">
      <header className="bg-[#03045E] text-white px-6 py-4 flex justify-between items-center shadow-sm">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#00B4D8] flex items-center justify-center text-white shadow-xs">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" opacity="0.25"/>
              <circle cx="16.5" cy="14.5" r="3.2" fill="#FBB02D"/>
            </svg>
          </div>
          <span className="font-extrabold text-lg tracking-tight">ParuhKita</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-300 hidden sm:inline">Belum memiliki akun?</span>
          <Link to="/register" className="px-4 py-2 bg-[#00B4D8] hover:bg-[#0096B4] text-white font-bold text-xs rounded-xl transition shadow-xs">
            Daftar Akun Baru
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center items-center p-6 my-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-black text-[#03045E]">Masuk ke ParuhKita</h1>
            <p className="text-xs text-[#536B82]">Portal Kerja Paruh Waktu Mahasiswa Indonesia</p>
          </div>

          <div className="bg-white rounded-2xl border border-[#D8E5EE] p-6 sm:p-8 shadow-xs space-y-4">
            {errorMessage && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#03045E] mb-1.5">Alamat Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input 
                    type="email"
                    required
                    placeholder="email@domain.com"
                    value={typeof email === 'string' ? email : (email.email || '')}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    className="w-full bg-[#F6F9FC] border border-[#D8E5EE] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#03045E] focus:outline-none focus:border-[#00B4D8]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#03045E] mb-1.5">Kata Sandi</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input 
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    className="w-full bg-[#F6F9FC] border border-[#D8E5EE] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#03045E] focus:outline-none focus:border-[#00B4D8]"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#023E8A] hover:bg-[#03045E] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                <span>{loading ? 'Memproses...' : 'Masuk'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="space-y-2 pt-2 border-t border-[#D8E5EE]">
              <p className="text-[10px] font-bold text-[#536B82] uppercase tracking-wider">AKUN TESTING DEFAULT:</p>
              <div onClick={() => setAkunTesting('mahasiswa@paruhkita.test', 'password123')} className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl cursor-pointer hover:bg-emerald-100">
                <p className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" /> Mahasiswa: mahasiswa@paruhkita.test
                </p>
              </div>
              <div onClick={() => setAkunTesting('merchant@paruhkita.test', 'password123')} className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl cursor-pointer hover:bg-amber-100">
                <p className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-amber-600" /> Merchant: merchant@paruhkita.test
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-[#03045E] text-white px-8 py-4 text-center text-xs">
        &copy; 2026 ParuhKita. Langkah kecil, masa depan besar.
      </footer>
    </div>
  );
}