import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, AlertCircle } from 'lucide-react';

import { signIn } from '../services/authService';
import { supabase } from '../config/supabaseClient';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            if (data.session) {
                navigate('/dashboard', { replace: true });
            }
        });
    }, [navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;

        setLoading(true);
        setError(null);

        try {
            await signIn(email, password);
            navigate('/dashboard', { replace: true });
        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <form onSubmit={handleLogin} className="bg-[#111] p-8 rounded-xl w-[380px]">
                <div className="flex justify-center mb-6">
                    <LogIn className="text-[#1DCD9C]" size={32} />
                </div>

                <h2 className="text-white text-xl font-bold text-center mb-6">
                    Employee Portal
                </h2>

                {error && (
                    <div className="text-red-400 flex gap-2 text-sm mb-4">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full mb-3 p-3 rounded bg-[#222] text-white"
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full mb-4 p-3 rounded bg-[#222] text-white"
                />

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#1DCD9C] text-black py-3 rounded font-bold"
                >
                    {loading ? 'Signing in…' : 'Sign In'}
                </button>
            </form>
        </div>
    );
};

export default Login;
