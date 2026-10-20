
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Brain,
  Lock,
  User,
  ArrowRight,
  Loader2,
  Sparkles,
  Eye,
  EyeOff,
  ShieldCheck,
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({
    username: false,
    password: false,
  });

  const navigate = useNavigate();
  const { login, token } = useAuthStore();

  useEffect(() => {
    if (token) {
      navigate('/', { replace: true });
    }
  }, [token, navigate]);

  const usernameError =
    touched.username && !username.trim()
      ? 'Username is required'
      : '';

  const passwordError =
    touched.password && !password.trim()
      ? 'Password is required'
      : '';

  const inputClass = (hasError: boolean) =>
    `block w-full rounded-xl border bg-[#191919] py-3 pl-11 pr-11
    text-sm text-white placeholder:text-neutral-600
    outline-none transition-all duration-200
    focus:bg-[#1d1d1d] focus:ring-2
    ${
      hasError
        ? 'border-red-500/70 focus:border-red-500 focus:ring-red-500/10'
        : 'border-[#333333] focus:border-red-500/70 focus:ring-red-500/10'
    }`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({ username: true, password: true });

    if (!username.trim() || !password.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      await login(username.trim(), password);
      toast.success('Welcome back!');
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message ||
        (err as Error).message ||
        'Invalid username or password';

      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#101010] px-4 py-10 text-white selection:bg-red-500/30 sm:px-6">

      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[450px] w-[450px] -translate-x-1/2 rounded-full bg-red-700/[0.09] blur-[140px]" />

        <div className="absolute -bottom-48 -right-32 h-[400px] w-[400px] rounded-full bg-red-900/[0.08] blur-[130px]" />

        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-[440px]"
      >
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center">
          <Link
            to="/"
            aria-label="Synapse home"
            className="group mb-5 flex items-center gap-3"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/25 bg-gradient-to-br from-red-500 to-red-800 shadow-lg shadow-red-950/40 transition-transform duration-300 group-hover:scale-105">
              <Brain className="h-6 w-6 text-white" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold tracking-tight">
                  Synapse
                </span>

                <span className="rounded-md border border-red-500/25 bg-red-500/10 px-2 py-0.5 text-[10px] font-bold tracking-widest text-red-400">
                  AI
                </span>
              </div>

              <p className="mt-0.5 text-xs tracking-wide text-neutral-500">
                Your intelligent knowledge space
              </p>
            </div>
          </Link>

          <div className="mb-3 flex items-center gap-2 rounded-full border border-[#303030] bg-[#191919]/80 px-3 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-red-400" />
            <span className="text-[11px] font-medium tracking-wide text-neutral-400">
              THINK CONNECTED
            </span>
          </div>

          <h1 className="text-center text-3xl font-bold tracking-tight sm:text-[34px]">
            Welcome back
          </h1>

          <p className="mt-2 text-center text-sm text-neutral-500">
            Sign in to continue your journey with Synapse.
          </p>
        </div>

        {/* Login card */}
        <div className="rounded-2xl border border-[#303030] bg-[#171717]/95 p-6 shadow-2xl shadow-black/30 sm:p-8">
          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* Username */}
            <div>
              <label
                htmlFor="login-username"
                className="mb-2 block text-xs font-semibold tracking-wide text-neutral-300"
              >
                Username
              </label>

              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-neutral-500" />

                <input
                  id="login-username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onBlur={() =>
                    setTouched((prev) => ({ ...prev, username: true }))
                  }
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  aria-invalid={!!usernameError}
                  aria-describedby={
                    usernameError ? 'username-error' : undefined
                  }
                  className={inputClass(!!usernameError)}
                />
              </div>

              {usernameError && (
                <p id="username-error" className="mt-1.5 text-xs text-red-400">
                  {usernameError}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="login-password"
                className="mb-2 block text-xs font-semibold tracking-wide text-neutral-300"
              >
                Password
              </label>

              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-neutral-500" />

                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onBlur={() =>
                    setTouched((prev) => ({ ...prev, password: true }))
                  }
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  aria-invalid={!!passwordError}
                  aria-describedby={
                    passwordError ? 'password-error' : undefined
                  }
                  className={inputClass(!!passwordError)}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md text-neutral-500 transition-colors hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  {showPassword ? (
                    <EyeOff className="h-[17px] w-[17px]" />
                  ) : (
                    <Eye className="h-[17px] w-[17px]" />
                  )}
                </button>
              </div>

              {passwordError && (
                <p id="password-error" className="mt-1.5 text-xs text-red-400">
                  {passwordError}
                </p>
              )}
            </div>

            {/* Sign in */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-gradient-to-r from-red-600 to-red-700 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-red-950/30 transition-all duration-200 hover:from-red-500 hover:to-red-600 hover:shadow-red-950/50 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#171717] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in to Synapse
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#303030]" />
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-600">
              New to Synapse?
            </span>
            <div className="h-px flex-1 bg-[#303030]" />
          </div>

          <Link
            to="/register"
            className="flex w-full items-center justify-center rounded-xl border border-[#383838] bg-[#202020] px-4 py-3 text-sm font-medium text-neutral-300 transition-colors hover:border-red-500/40 hover:bg-[#252020] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            Create your account
          </Link>

          {/* Feature note */}
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-[#2d2d2d] bg-[#131313] p-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-500/15 bg-red-500/10">
              <Brain className="h-4 w-4 text-red-400" />
            </div>

            <div>
              <p className="text-xs font-semibold text-neutral-300">
                Knowledge meets intelligence
              </p>
              <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                Explore document Q&A, semantic search, and context-aware AI
                responses powered by retrieval-augmented generation.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-neutral-600">
          <ShieldCheck className="h-4 w-4 text-neutral-500" />
          <span>Your knowledge space awaits.</span>
        </div>

        <p className="mt-3 text-center text-[10px] tracking-wide text-neutral-700">
          SYNAPSE AI · THINK CONNECTED
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
