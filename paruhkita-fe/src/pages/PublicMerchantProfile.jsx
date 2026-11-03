import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Building, MapPin, Phone, Mail } from 'lucide-react';
import api from '../api/axios';

const FACILITY_CATEGORIES = {
  dining: 'Makan/minum',
  transportation: 'Transportasi',
  worship: 'Tempat ibadah',
  other: 'Lainnya'
};

function assetUrl(path) {
  if (!path) return null;
  const apiBase = api.defaults.baseURL || '';
  return `${apiBase.replace(/\/api\/?$/, '')}/storage/${path}`;
}

export default function PublicMerchantProfile() {
  const { id } = useParams();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.get(`/v1/companies/${id}`)
      .then(({ data }) => {
        if (active) setCompany(data.data);
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.response?.status === 404
            ? 'Profil perusahaan tidak ditemukan.'
            : requestError.response?.data?.message || 'Gagal memuat profil perusahaan.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  return (
    <main className="flex-1 bg-[#F6F9FC] px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <Link to="/lowongan" className="text-sm font-semibold text-[#023E8A] hover:underline">
          &larr; Kembali ke lowongan
        </Link>

        {loading && <p className="mt-8 text-sm text-[#536B82]">Memuat profil perusahaan...</p>}
        {!loading && error && (
          <div role="alert" className="mt-8 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        {!loading && company && (
          <article className="mt-6 overflow-hidden rounded-2xl border border-[#D8E5EE] bg-white shadow-sm">
            {company.banner_path && (
              <img src={assetUrl(company.banner_path)} alt="" className="h-48 w-full object-cover" />
            )}
            <div className="p-6 sm:p-8">
              <header className="flex flex-wrap items-center gap-4">
                {company.logo_path ? (
                  <img src={assetUrl(company.logo_path)} alt="" className="h-16 w-16 rounded-2xl object-cover" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#CAF0F8] text-[#023E8A]">
                    <Building className="h-8 w-8" />
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-extrabold text-[#03045E]">{company.merchant_name}</h1>
                  <p className="mt-1 text-sm text-[#536B82]">{company.category}</p>
                </div>
              </header>

              <section className="mt-8">
                <h2 className="text-base font-bold text-[#03045E]">Tentang perusahaan</h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#536B82]">{company.description}</p>
              </section>

              <section className="mt-7 border-t border-[#D8E5EE] pt-6">
                <h2 className="text-base font-bold text-[#03045E]">Lokasi dan kontak</h2>
                <div className="mt-3 space-y-3 text-sm text-[#536B82]">
                  <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#023E8A]" />{company.address}</p>
                  <a className="flex items-center gap-2 hover:text-[#023E8A]" href={`tel:${company.phone}`}><Phone className="h-4 w-4 text-[#023E8A]" />{company.phone}</a>
                  <a className="flex items-center gap-2 hover:text-[#023E8A]" href={`mailto:${company.email}`}><Mail className="h-4 w-4 text-[#023E8A]" />{company.email}</a>
                </div>
              </section>

              <section className="mt-7 border-t border-[#D8E5EE] pt-6">
                <h2 className="text-base font-bold text-[#03045E]">Fasilitas tempat kerja</h2>
                {company.facilities.length > 0 ? (
                  <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                    {company.facilities.map((facility) => (
                      <li key={facility.id} className="rounded-xl border border-[#D8E5EE] bg-[#F6F9FC] p-4">
                        <p className="text-sm font-semibold text-[#03045E]">{facility.name}</p>
                        <p className="mt-1 text-xs font-medium text-[#023E8A]">{FACILITY_CATEGORIES[facility.category] || FACILITY_CATEGORIES.other}</p>
                        {facility.description && <p className="mt-2 text-xs leading-5 text-[#536B82]">{facility.description}</p>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-[#536B82]">Belum ada informasi fasilitas.</p>
                )}
              </section>
            </div>
          </article>
        )}
      </div>
    </main>
  );
}
