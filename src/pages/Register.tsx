
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Brain,
  Lock,
  Mail,
  User,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [touched, setTouched] = useState({
    username: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  const navigate = useNavigate();
  const { register, login, token } = useAuthStore();

  useEffect(() => {
    if (token) {
      navigate('/', { replace: true });
    }
  }, [token, navigate]);

  const usernameError =
    touched.username && !username.trim()
      ? 'Username is required'
      : '';

  const emailError =
    touched.email && !email.trim()
      ? 'Email is required'
      : touched.email &&
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ? 'Enter a valid email address'
        : '';

  const passwordError =
    touched.password && !password.trim()
      ? 'Password is required'
      : touched.password && password.length < 6
        ? 'Password must be at least 6 characters'
        : '';

  const confirmPasswordError =
    touched.confirmPassword && !confirmPassword
      ? 'Please confirm your password'
      : touched.confirmPassword && password !== confirmPassword
        ? 'Passwords do not match'
        : '';

  const inputClass = (hasError: boolean) =>
    `w-full rounded-xl border bg-[#191919] py-3 pl-11 pr-11
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

    setTouched({
      username: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    if (
      !username.trim() ||
      !email.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await register(username.trim(), email.trim(), password);

      toast.success('Account created successfully! Logging you in…');

      await login(username.trim(), password);
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message ||
        (err as Error).message ||
        'Registration failed. Please try again.';

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
            aria-label="DocMind home"
            className="group mb-5 flex items-center gap-3"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/25 bg-gradient-to-br from-red-500 to-red-800 shadow-lg shadow-red-950/40 transition-transform duration-300 group-hover:scale-105">
              <Brain className="h-6 w-6 text-white" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold tracking-tight">
                  Syanpse
                </span>

                <span className="rounded-md border border-red-500/25 bg-red-500/10 px-2 py-0.5 text-[10px] font-bold tracking-widest text-red-400">
                  AI
                </span>
              </div>

              <p className="mt-0.5 text-xs tracking-wide text-neutral-500">
                Your intelligent workspace
              </p>
            </div>
          </Link>

          <div className="mb-3 flex items-center gap-2 rounded-full border border-[#303030] bg-[#191919]/80 px-3 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-red-400" />
            <span className="text-[11px] font-medium tracking-wide text-neutral-400">
              YOUR KNOWLEDGE, REIMAGINED
            </span>
          </div>

          <h1 className="text-center text-3xl font-bold tracking-tight sm:text-[34px]">
            Create your account
          </h1>

          <p className="mt-2 text-center text-sm text-neutral-500">
            Start building your personal knowledge space.
          </p>
        </div>

        {/* Register card */}
        <div className="rounded-2xl border border-[#303030] bg-[#171717]/95 p-6 shadow-2xl shadow-black/30 sm:p-8">

          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* Username */}
            <div>
              <label
                htmlFor="reg-username"
                className="mb-2 block text-xs font-semibold tracking-wide text-neutral-300"
              >
                Username
              </label>

              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-neutral-500" />

                <input
                  id="reg-username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onBlur={() =>
                    setTouched((prev) => ({ ...prev, username: true }))
                  }
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
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

            {/* Email */}
            <div>
              <label
                htmlFor="reg-email"
                className="mb-2 block text-xs font-semibold tracking-wide text-neutral-300"
              >
                Email address
              </label>

              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-neutral-500" />

                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onBlur={() =>
                    setTouched((prev) => ({ ...prev, email: true }))
                  }
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? 'email-error' : undefined}
                  className={inputClass(!!emailError)}
                />
              </div>

              {emailError && (
                <p id="email-error" className="mt-1.5 text-xs text-red-400">
                  {emailError}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="reg-password"
                className="mb-2 block text-xs font-semibold tracking-wide text-neutral-300"
              >
                Password
              </label>

              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-neutral-500" />

                <input
                  id="reg-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onBlur={() =>
                    setTouched((prev) => ({ ...prev, password: true }))
                  }
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
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

            {/* Confirm password */}
            <div>
              <label
                htmlFor="reg-confirm"
                className="mb-2 block text-xs font-semibold tracking-wide text-neutral-300"
              >
                Confirm password
              </label>

              <div className="relative">
                <CheckCircle2 className="pointer-events-none absolute left-3.5 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-neutral-500" />

                <input
                  id="reg-confirm"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onBlur={() =>
                    setTouched((prev) => ({
                      ...prev,
                      confirmPassword: true,
                    }))
                  }
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  aria-invalid={!!confirmPasswordError}
                  aria-describedby={
                    confirmPasswordError ? 'confirm-error' : undefined
                  }
                  className={inputClass(!!confirmPasswordError)}
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={
                    showConfirmPassword
                      ? 'Hide password confirmation'
                      : 'Show password confirmation'
                  }
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md text-neutral-500 transition-colors hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-[17px] w-[17px]" />
                  ) : (
                    <Eye className="h-[17px] w-[17px]" />
                  )}
                </button>
              </div>

              {confirmPasswordError && (
                <p id="confirm-error" className="mt-1.5 text-xs text-red-400">
                  {confirmPasswordError}
                </p>
              )}
            </div>

            {/* Submit */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-gradient-to-r from-red-600 to-red-700 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-red-950/30 transition-all duration-200 hover:from-red-500 hover:to-red-600 hover:shadow-red-950/50 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#171717] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create account
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#303030]" />
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-600">
              Already a member?
            </span>
            <div className="h-px flex-1 bg-[#303030]" />
          </div>

          <Link
            to="/login"
            className="flex w-full items-center justify-center rounded-xl border border-[#383838] bg-[#202020] px-4 py-3 text-sm font-medium text-neutral-300 transition-colors hover:border-red-500/40 hover:bg-[#252020] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            Sign in to Synapse
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-neutral-600">
          <ShieldCheck className="h-4 w-4 text-neutral-500" />
          <span>Your workspace starts here.</span>
        </div>

        <p className="mt-3 text-center text-[10px] tracking-wide text-neutral-700">
          DOCMIND AI · KNOWLEDGE, ORGANIZED
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
