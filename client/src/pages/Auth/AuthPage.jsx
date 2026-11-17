import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import SpyrixLoader from '../../components/SpyrixLoader.jsx';
import { authPageConfig } from './page.config.js';
import './AuthReference.css';

function makeRandom(seed) {
  let value = seed | 0;
  return () => {
    value |= 0;
    value = value + 0x6D2B79F5 | 0;
    let next = Math.imul(value ^ value >>> 15, 1 | value);
    next = next + Math.imul(next ^ next >>> 7, 61 | next) ^ next;
    return ((next ^ next >>> 14) >>> 0) / 4294967296;
  };
}

function SkylineGroup({ seed, base, widthRange, heightRange, fill, rimOpacity, windows = false }) {
  const buildings = [];
  const windowBlocks = [];
  const random = makeRandom(seed);
  let x = -130;
  let index = 0;
  while (x < 1730) {
    const width = widthRange[0] + random() * (widthRange[1] - widthRange[0]);
    const height = heightRange[0] + random() * (heightRange[1] - heightRange[0]);
    const top = base - height;
    buildings.push(
      <g key={`building-${index}`}>
        <rect x={x} y={top} width={width} height={height + 40} fill={fill} />
        <rect x={x + width - 2.5} y={top} width="2.5" height={height + 40} fill="#ff1f3d" opacity={rimOpacity} />
        <rect x={x} y={top} width={width} height="2" fill="#ff1f3d" opacity={rimOpacity} />
      </g>
    );
    if (windows) {
      for (let i = 0; i < Math.floor((width - 12) / 14); i += 1) {
        for (let j = 0; j < Math.floor((height - 18) / 19); j += 1) {
          if (random() < 0.18) {
            const wx = (x + 8 + i * 14).toFixed(1);
            const wy = (top + 12 + j * 19).toFixed(1);
            windowBlocks.push(`M${wx} ${wy}h4v6h-4z`);
          }
        }
      }
    }
    x += width + random() * 6;
    index += 1;
  }
  return <g>{buildings}{windowBlocks.length > 0 && <path d={windowBlocks.join(' ')} fill="#fff" opacity=".65" />}</g>;
}

function Skyline() {
  return (
    <>
      <svg id="scene" className="auth-scene" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <defs>
          <linearGradient id="auth-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0a0003" /><stop offset=".4" stopColor="#1a0408" /><stop offset=".7" stopColor="#4a0a14" /><stop offset="1" stopColor="#d8253d" />
          </linearGradient>
          <linearGradient id="auth-sun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffd9de" /><stop offset=".55" stopColor="#ff5c72" /><stop offset="1" stopColor="#ff1f3d" /></linearGradient>
          <mask id="auth-cut"><rect x="500" y="280" width="600" height="440" fill="#fff" /><g fill="#000">{Array.from({ length: 7 }, (_, i) => <rect key={i} x="500" y={495 + i * 30} width="600" height={3 + i * 2.6} />)}</g></mask>
          <filter id="auth-glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <rect width="1600" height="900" fill="url(#auth-sky)" />
        <circle cx="800" cy="500" r="200" fill="url(#auth-sun)" mask="url(#auth-cut)" />
        <g id="far" className="auth-far"><SkylineGroup seed={11} base={800} widthRange={[70,130]} heightRange={[220,470]} fill="#2a0a10" rimOpacity=".4" windows /></g>
        <g id="near" className="auth-near"><SkylineGroup seed={42} base={815} widthRange={[110,210]} heightRange={[240,520]} fill="#0a0204" rimOpacity=".6" /></g>
        <rect x="-100" y="800" width="1800" height="130" fill="#0a0003" />
        <rect x="-100" y="798" width="1800" height="3" fill="#ff1f3d" filter="url(#auth-glow)" />
      </svg>
      <div className="auth-vignette" />
    </>
  );
}

export default function AuthPage({ initialMode = 'login' }) {
  const initialRegister = initialMode === 'register';
  const [mode, setMode] = useState(initialMode);
  const [flipped, setFlipped] = useState(initialRegister);
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  const googleButtonRef = useRef(null);
  const googleHandlerRef = useRef(null);
  const loginFormRef = useRef(null);
  const registerFormRef = useRef(null);
  const { login, register, googleLogin, activateSession } = useAuth();
  const navigate = useNavigate();

  const holdAuthLoader = async startedAt => {
    const remaining = Math.max(0, 3000 - (Date.now() - startedAt));
    if (remaining) await new Promise(resolve => window.setTimeout(resolve, remaining));
  };

  useEffect(() => {
    const timer = window.setTimeout(() => setBusy(false), 3000);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    setMode(initialMode);
    setFlipped(initialMode === 'register');
    setError('');
  }, [initialMode]);

  useEffect(() => {
    document.title = `${mode === 'register' ? 'Create Account' : 'Sign In'} | ${authPageConfig.documentTitle}`;
  }, [mode]);

  useEffect(() => {
    if (loginFormRef.current) loginFormRef.current.inert = flipped;
    if (registerFormRef.current) registerFormRef.current.inert = !flipped;
  }, [flipped]);

  googleHandlerRef.current = async credential => {
    if (!credential) { setError('Google did not return a sign-in credential. Please try again.'); return; }
    const startedAt = Date.now();
    setError(''); setBusy(true);
    try {
      const result = await googleLogin(credential, { deferSession: true });
      await holdAuthLoader(startedAt);
      activateSession(result);
      navigate('/app/dashboard', { replace: true });
    } catch (err) {
      await holdAuthLoader(startedAt);
      setError(err.message || 'Google sign-in failed.');
    } finally { setBusy(false); }
  };

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || !googleButtonRef.current) return;
    let active = true;
    const renderGoogleButton = () => {
      if (!active || !window.google?.accounts?.id || !googleButtonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: response => googleHandlerRef.current?.(response.credential),
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      googleButtonRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        type: 'standard', theme: 'outline', size: 'large', text: 'continue_with', shape: 'rectangular', logo_alignment: 'left',
        width: Math.min(300, googleButtonRef.current.clientWidth || 300),
      });
    };
    if (window.google?.accounts?.id) { renderGoogleButton(); return () => { active = false; }; }
    let script = document.querySelector('script[data-spyrix-google-identity]');
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true; script.defer = true; script.dataset.spyrixGoogleIdentity = 'true';
      document.head.appendChild(script);
    }
    const onGoogleScriptError = () => {
      if (active) setError('Google sign-in could not load. Check your connection and try again.');
    };
    script.addEventListener('load', renderGoogleButton);
    script.addEventListener('error', onGoogleScriptError);
    return () => {
      active = false;
      script?.removeEventListener('load', renderGoogleButton);
      script?.removeEventListener('error', onGoogleScriptError);
    };
  }, []);

  const switchFace = checked => {
    setFlipped(checked);
    setMode(checked ? 'register' : 'login');
    setError('');
  };

  const submitLogin = async event => {
    event.preventDefault();
    if (!email.trim()) { setError('Enter your email address.'); return; }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setError('Enter a valid email address.'); return; }
    if (!password) { setError('Enter your password.'); return; }
    const startedAt = Date.now();
    setError(''); setBusy(true);
    try {
      const result = await login(email.trim(), password, { deferSession: true });
      await holdAuthLoader(startedAt);
      activateSession(result);
      navigate('/app/dashboard', { replace: true });
    } catch (err) {
      await holdAuthLoader(startedAt);
      setError(err.message || 'Sign in failed. Please try again.');
    } finally { setBusy(false); }
  };

  const submitRegister = async event => {
    event.preventDefault();
    if (name.trim().length < 2) { setError('Enter your full name.'); return; }
    if (businessName.trim().length < 2) { setError('Enter your brand or business name.'); return; }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setError('Enter a valid email address.'); return; }
    if (password.length < 8) { setError('Password must contain at least 8 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    const startedAt = Date.now();
    setError(''); setBusy(true);
    try {
      const result = await register({ name: name.trim(), businessName: businessName.trim(), email: email.trim(), password }, { deferSession: true });
      await holdAuthLoader(startedAt);
      activateSession(result);
      navigate('/app/dashboard', { replace: true });
    } catch (err) {
      await holdAuthLoader(startedAt);
      setError(err.message || 'Account creation failed. Please try again.');
    } finally { setBusy(false); }
  };



  return (
    <>
      <main className="auth-reference theme" aria-label="SPYRIX sign in and registration">
        <Skyline />
        <div className="page">
          <a href="/" className="auth-logo-link" aria-label="Back to SPYRIX Invoice home" onClick={event => { event.preventDefault(); navigate('/'); }}>
            <img className="logo" alt="SPYRIX" src="/assets/branding/spyrix-login-wordmark.png" />
          </a>
          <div className="stage">
            <input id="flip" type="checkbox" aria-label="Switch between login and registration" checked={flipped} onChange={event => switchFace(event.target.checked)} />
            <div className="card">
              <form className="face front" id="loginForm" ref={loginFormRef} onSubmit={submitLogin} aria-label="Log in">
                <h2>Log in</h2>
                <div className="field"><input className="input" name="email" type="email" value={email} onChange={event => { setEmail(event.target.value); setError(''); }} placeholder="Email address" autoComplete="username" aria-label="Email address" required /></div>
                <div className="field pw"><input className="input" name="password" value={password} onChange={event => { setPassword(event.target.value); setError(''); }} placeholder="Password" type={showLoginPassword ? 'text' : 'password'} autoComplete="current-password" aria-label="Password" required /><button className="eye" type="button" aria-label={showLoginPassword ? 'Hide password' : 'Show password'} onClick={() => setShowLoginPassword(value => !value)}>{showLoginPassword ? 'Hide' : 'Show'}</button></div>
                <div className="row">
                  <label><input type="checkbox" checked={remember} onChange={event => setRemember(event.target.checked)} /> Keep me signed in</label>
                  <button className="link" type="button" onClick={() => setError('Password reset is not configured yet for this workspace.')}>Forgot password?</button>
                </div>
                <button className="btn" type="submit" disabled={busy}>{busy ? 'Please wait…' : 'Log in'}</button>
                <div className={`msg${error && mode === 'login' ? ' error' : ''}`} role="status" aria-live="polite">{mode === 'login' ? error : ''}</div>
                <span className="switch">New to SPYRIX? <label htmlFor="flip">Create an account</label></span>
              </form>

              <form className="face back" id="signupForm" ref={registerFormRef} onSubmit={submitRegister} aria-label="Create account">
                <h2>Create account</h2>
                <div className="field"><input className="input" name="name" placeholder="Full name" type="text" value={name} onChange={event => { setName(event.target.value); setError(''); }} autoComplete="name" aria-label="Full name" required /></div>
                <div className="field"><input className="input" name="businessName" placeholder="Brand / business name" type="text" value={businessName} onChange={event => { setBusinessName(event.target.value); setError(''); }} autoComplete="organization" aria-label="Brand or business name" required /></div>
                <div className="field"><input className="input" name="email" placeholder="Email address" type="email" value={email} onChange={event => { setEmail(event.target.value); setError(''); }} autoComplete="email" aria-label="Email address" required /></div>
                <div className="field pw"><input className="input" name="password" placeholder="Password (min 8)" type={showRegisterPassword ? 'text' : 'password'} value={password} onChange={event => { setPassword(event.target.value); setError(''); }} autoComplete="new-password" minLength={8} aria-label="Password" required /><button className="eye" type="button" aria-label={showRegisterPassword ? 'Hide password' : 'Show password'} onClick={() => setShowRegisterPassword(value => !value)}>{showRegisterPassword ? 'Hide' : 'Show'}</button></div>
                <div className="field pw"><input className="input" name="confirmPassword" placeholder="Confirm password" type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={event => { setConfirmPassword(event.target.value); setError(''); }} autoComplete="new-password" aria-label="Confirm password" required /><button className="eye" type="button" aria-label={showConfirmPassword ? 'Hide password' : 'Show password'} onClick={() => setShowConfirmPassword(value => !value)}>{showConfirmPassword ? 'Hide' : 'Show'}</button></div>
                <button className="btn" type="submit" disabled={busy}>{busy ? 'Please wait…' : 'Create account'}</button>
                <div className={`msg${error && mode === 'register' ? ' error' : ''}`} role="status" aria-live="polite">{mode === 'register' ? error : ''}</div>
                <span className="switch">Already have an account? <label htmlFor="flip">Log in</label></span>
              </form>
            </div>
          </div>
          <div className="auth-extras">
            <div className="auth-provider-row">
              {import.meta.env.VITE_GOOGLE_CLIENT_ID
                ? <div className="auth-google-host" ref={googleButtonRef} aria-label="Continue with Google" />
                : <button type="button" className="auth-extra-button" onClick={() => setError('Google sign-in needs VITE_GOOGLE_CLIENT_ID in client/.env and GOOGLE_CLIENT_ID in server/.env.')}>Continue with Google</button>}
            </div>
            <p className="auth-extra-note">Secure business workspace · GST billing · Customer and payment tracking</p>
          </div>
        </div>
      </main>
      {busy && <SpyrixLoader className="auth-transaction-loader" />}
    </>
  );
}
