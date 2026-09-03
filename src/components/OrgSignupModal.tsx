import React, { useState } from 'react';
import { Building2, ShieldCheck, MapPin, Mail, Lock, Phone, User, X, CheckCircle2, ArrowRight } from 'lucide-react';
import { geoTaskApi } from '../services/geoTaskApi';

interface OrgSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
}

export const OrgSignupModal: React.FC<OrgSignupModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    orgName: '',
    adminName: '',
    email: '',
    password: '',
    mobile: '9991112222',
    siteName: 'Headquarters Field Hub',
    latitude: 28.6139,
    longitude: 77.2090,
    radiusMeters: 100
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdResult, setCreatedResult] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await geoTaskApi.signupOrg(form);
      if (res.success) {
        setCreatedResult(res);
      } else {
        setError(res.error || 'Registration failed');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {!createdResult ? (
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Register Your Organization
                </h3>
                <p className="text-xs text-slate-400">
                  Self-Service Setup (POST /api/signup): Creates Org + Admin + Primary Geofence
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Company / Org Name *</label>
                  <input
                    type="text"
                    required
                    value={form.orgName}
                    onChange={(e) => setForm({ ...form, orgName: e.target.value })}
                    placeholder="e.g. Apex Deliveries"
                    className="w-full bg-slate-950 border border-slate-800 text-white px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Admin Full Name *</label>
                  <input
                    type="text"
                    required
                    value={form.adminName}
                    onChange={(e) => setForm({ ...form, adminName: e.target.value })}
                    placeholder="e.g. Marcus Vance"
                    className="w-full bg-slate-950 border border-slate-800 text-white px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Admin Work Email *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="marcus@apex.com"
                    className="w-full bg-slate-950 border border-slate-800 text-white px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Admin Password *</label>
                  <input
                    type="password"
                    required
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 text-white px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block mb-2">
                  First Geofenced Site Configuration
                </span>

                <div className="space-y-2.5">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">HQ Site Name</label>
                    <input
                      type="text"
                      value={form.siteName}
                      onChange={(e) => setForm({ ...form, siteName: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 text-white px-3 py-2 rounded-xl focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">Lat</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={form.latitude}
                        onChange={(e) => setForm({ ...form, latitude: parseFloat(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-800 text-white px-2 py-2 rounded-xl focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">Lng</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={form.longitude}
                        onChange={(e) => setForm({ ...form, longitude: parseFloat(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-800 text-white px-2 py-2 rounded-xl focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">Radius (m)</label>
                      <input
                        type="number"
                        value={form.radiusMeters}
                        onChange={(e) => setForm({ ...form, radiusMeters: parseInt(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-800 text-white px-2 py-2 rounded-xl focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
                >
                  {loading ? 'Creating Organization...' : 'Complete Registration'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 bg-emerald-950 border border-emerald-800/80 rounded-2xl flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-bold text-white">
              Organization Provisioned Successfully!
            </h3>
            <p className="text-xs text-slate-300 max-w-sm mx-auto">
              <strong>{createdResult.organization?.name}</strong> has been registered with primary site{' '}
              <strong>{createdResult.site?.name}</strong>.
            </p>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left text-xs space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Org ID:</span>
                <span className="text-indigo-400 font-bold">{createdResult.organization?._id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Admin Email:</span>
                <span className="text-white">{createdResult.admin?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Field Test User:</span>
                <span className="text-emerald-400">{createdResult.initialUser?.mobile} (OTP: 1111)</span>
              </div>
            </div>

            <button
              onClick={() => {
                onSuccess(createdResult);
                onClose();
              }}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow transition-colors cursor-pointer"
            >
              Open in Admin Console
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
