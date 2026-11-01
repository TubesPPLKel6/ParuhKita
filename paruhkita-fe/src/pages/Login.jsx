import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('mahasiswa@paruhkita.test');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/kesiapan-karier');
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || 
        'Email atau password salah. Pastikan backend Laravel sedang berjalan.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F9FC] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md">
        
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#00B4D8] text-white shadow-md mb-3">
            <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" opacity="0.25"/>
              <path d="M12 3a9 9 0 0 0-9 9c0 3.1 1.57 5.83 3.97 7.46l2.1-3.64A5 5 0 0 1 7 12a5 5 0 0 1 5-5c1.68 0 3.17.83 4.07 2.1l2.84-2.13A8.96 8.96 0 0 0 12 3z"/>
              <circle cx="16.5" cy="14.5" r="3.2" fill="#FBB02D"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#03045E]">Masuk ke ParuhKita</h1>
          <p className="text-sm text-[#536B82] mt-1">Portal Kerja Paruh Waktu Mahasiswa Indonesia</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl border border-[#D8E5EE] shadow-sm p-6 sm:p-8">
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#102C4D] mb-1.5">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-[#536B82]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full bg-[#F6F9FC] border border-[#D8E5EE] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#102C4D] focus:outline-none focus:border-[#00B4D8] focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#102C4D] mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-[#536B82]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#F6F9FC] border border-[#D8E5EE] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#102C4D] focus:outline-none focus:border-[#00B4D8] focus:bg-white transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-3 px-4 bg-[#023E8A] hover:bg-[#03045E] text-white font-semibold text-sm rounded-xl transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Masuk</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick preset for testing */}
          <div className="mt-6 pt-5 border-t border-[#D8E5EE]">
            <p className="text-[11px] font-bold text-[#536B82] uppercase tracking-wider mb-2">
              Akun Testing Mahasiswa:
            </p>
            <button
              type="button"
              onClick={() => {
                setEmail('mahasiswa@paruhkita.test');
                setPassword('password123');
              }}
              className="w-full text-left p-2.5 bg-[#CAF0F8]/40 hover:bg-[#CAF0F8] border border-[#00B4D8]/30 rounded-xl transition text-xs text-[#023E8A]"
            >
              <span className="font-bold">Mahasiswa:</span> mahasiswa@paruhkita.test <br />
              <span className="text-[11px] text-[#536B82]">Password: password123 (Klik untuk isi cepat)</span>
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-[#536B82] mt-6">
          Langkah kecil, masa depan besar. &copy; 2026 ParuhKita
        </p>
      </div>
    </div>
  );
}
