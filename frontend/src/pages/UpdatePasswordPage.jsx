import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Loader2 } from 'lucide-react';

const UpdatePasswordPage = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const { updatePassword } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (password !== confirmPassword) {
            setError('Password tidak cocok.');
            return;
        }

        if (password.length < 6) {
            setError('Password minimal 6 karakter.');
            return;
        }

        setLoading(true);

        try {
            await updatePassword(password);
            setSuccess('Password berhasil diperbarui. Mengalihkan ke halaman login...');
            setTimeout(() => {
                navigate('/auth');
            }, 2000);
        } catch (err) {
            setError(err.message || 'Gagal memperbarui password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#212121] text-white p-4">
            <div className="w-full max-w-md bg-[#2f2f2f] rounded-2xl shadow-xl overflow-hidden border border-[#404040]">
                {/* Header */}
                <div className="p-8 pb-0 text-center">
                    <div className="w-20 h-20 mx-auto mb-4">
                        <img src="logo-hdi.png" alt="HDI Logo" className="w-16 h-16 object-contain" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Update Password</h2>
                    <p className="text-gray-400">Masukkan password baru Anda</p>
                </div>

                {/* Form */}
                <div className="p-8">
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Password Baru</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-[#171717] border border-[#404040] rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-emerald-500 text-white placeholder-gray-500"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Konfirmasi Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full bg-[#171717] border border-[#404040] rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-emerald-500 text-white placeholder-gray-500"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                'Update Password'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default UpdatePasswordPage;
