import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, 
  Store, 
  Mail, 
  Lock, 
  Phone, 
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const [role, setRole] = useState('mahasiswa');

  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    telepon: '',
    password: '',
    konfirmasiPassword: '',
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalSukses, setModalSukses] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (formData.password.length < 8) {
      setErrorMessage('Kata sandi minimal 8 karakter!');
      return;
    }

    if (formData.password !== formData.konfirmasiPassword) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok!');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: formData.nama,
          email: formData.email.trim().toLowerCase(),
          phone: formData.telepon,
          password: formData.password,
          password_confirmation: formData.konfirmasiPassword,
          role: role
        })
      });

      const result = await res.json();

      if (!res.ok) {
        if (result.errors) {
          const firstErrKey = Object.keys(result.errors)[0];
          throw new Error(result.errors[firstErrKey][0]);
        }
        throw new Error(result.message || 'Gagal mendaftar.');
      }

      // Only keep the email for login convenience; never persist the password.
      localStorage.setItem('last_registered_user', JSON.stringify({
        email: formData.email.trim().toLowerCase()
      }));

      setModalSukses(true);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
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
        <p className="text-xs text-slate-300">
          Sudah punya akun? <Link to="/login" className="text-[#00B4D8] font-bold hover:underline">Masuk di sini</Link>
        </p>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full p-6 my-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-black text-[#03045E]">Buat Akun ParuhKita</h1>
          <p className="text-xs text-[#536B82] mt-1">Pilih jenis peran akunmu dan mulai eksplorasi.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-200/60 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => setRole('mahasiswa')}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition ${
              role === 'mahasiswa'
                ? 'bg-[#023E8A] text-white shadow-xs'
                : 'text-[#536B82] hover:text-[#03045E]'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Mahasiswa</span>
          </button>

          <button
            type="button"
            onClick={() => setRole('merchant')}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition ${
              role === 'merchant'
                ? 'bg-[#023E8A] text-white shadow-xs'
                : 'text-[#536B82] hover:text-[#03045E]'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Mitra Merchant</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#D8E5EE] p-6 sm:p-8 shadow-xs space-y-4">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2.5 leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#03045E] mb-1">
              {role === 'mahasiswa' ? 'Nama Lengkap *' : 'Nama Toko / Usaha *'}
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input 
                type="text"
                required
                name="nama"
                placeholder={role === 'mahasiswa' ? 'Contoh: Al Zena Ismail' : 'Contoh: Kopi Sela'}
                value={formData.nama}
                onChange={handleChange}
                className="w-full bg-[#F6F9FC] border border-[#D8E5EE] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#03045E] focus:outline-none focus:border-[#00B4D8]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#03045E] mb-1">Alamat Email *</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input 
                type="email"
                required
                name="email"
                placeholder="email@domain.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-[#F6F9FC] border border-[#D8E5EE] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#03045E] focus:outline-none focus:border-[#00B4D8]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#03045E] mb-1">Nomor WhatsApp *</label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input 
                type="tel"
                required
                name="telepon"
                placeholder="0812-3456-7890"
                value={formData.telepon}
                onChange={handleChange}
                className="w-full bg-[#F6F9FC] border border-[#D8E5EE] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#03045E] focus:outline-none focus:border-[#00B4D8]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#03045E] mb-1">Kata Sandi (Min 8 Karakter) *</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input 
                  type="password"
                  required
                  name="password"
                  placeholder="••••••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-[#F6F9FC] border border-[#D8E5EE] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#03045E] focus:outline-none focus:border-[#00B4D8]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#03045E] mb-1">Konfirmasi Sandi *</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input 
                  type="password"
                  required
                  name="konfirmasiPassword"
                  placeholder="••••••••••••"
                  value={formData.konfirmasiPassword}
                  onChange={handleChange}
                  className="w-full bg-[#F6F9FC] border border-[#D8E5EE] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#03045E] focus:outline-none focus:border-[#00B4D8]"
                />
              </div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#F59E0B] hover:bg-[#D97706] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            <span>{loading ? 'Memproses...' : 'Daftar Sekarang'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </main>

      <footer className="bg-[#03045E] text-white px-8 py-4 flex flex-col sm:flex-row justify-center items-center gap-x-2 gap-y-1 text-center text-xs shrink-0 mt-auto">
        <span>&copy; 2026 ParuhKita</span>
        <span>Langkah kecil, masa depan besar.</span>
      </footer>

      {modalSukses && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm border border-[#D8E5EE] overflow-hidden text-center p-6 space-y-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-[#03045E]">Akun Berhasil Dibuat!</h3>
              <p className="text-xs text-[#536B82] mt-1">
                Selamat datang di ParuhKita sebagai <strong>{role === 'merchant' ? 'Mitra Merchant' : 'Mahasiswa'}</strong>. Silakan masuk untuk melanjutkan.
              </p>
            </div>

            <button
              onClick={() => navigate('/login')}
              className="w-full py-2.5 bg-[#023E8A] hover:bg-[#03045E] text-white font-bold text-xs rounded-xl transition"
            >
              Masuk Sekarang
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
