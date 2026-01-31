import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, Loader2 } from 'lucide-react';

const AuthPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { login, register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                await login(email, password);
            } else {
                const data = await register(email, password);
                // If sign up successful but no session, it means email confirmation is required
                if (data?.user && !data.session) {
                    setError('Registrasi berhasil! Silakan cek email Anda untuk verifikasi akun.');
                    setLoading(false);
                    return;
                }
            }
            navigate('/');
        } catch (err) {
            setError(err.message || 'Terjadi kesalahan saat autentikasi.');
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
                        <img src="logo-hdi.png" alt="HDI Logo" className="w-full h-full object-contain" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Welcome to ChatHDI</h2>
                    <p className="text-gray-400">
                        {isLogin ? 'Masuk untuk melanjutkan' : 'Daftar akun baru'}
                    </p>
                </div>

                {/* Form */}
                <div className="p-8">
                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}



                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-[#171717] border border-[#404040] rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-emerald-500 text-white placeholder-gray-500"
                                    placeholder="name@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
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

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Loading...
                                </>
                            ) : (
                                isLogin ? 'Masuk' : 'Daftar'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-400">
                        {isLogin ? 'Belum punya akun? ' : 'Sudah punya akun? '}
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-emerald-400 hover:text-emerald-300 font-medium hover:underline focus:outline-none"
                        >
                            {isLogin ? 'Daftar sekarang' : 'Masuk di sini'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
