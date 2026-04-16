import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
	const { login, isAuthenticated } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();
	const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/';

	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);

	// Se já autenticado, redireciona
	useEffect(() => {
		if (isAuthenticated) navigate(from, { replace: true });
	}, [isAuthenticated, navigate, from]);

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setError('');
		setLoading(true);

		const result = await login(email, password);

		setLoading(false);
		if (!result.success) {
			setError(result.error ?? 'Erro desconhecido.');
		}
	};

	return (
		<div className="login-page">
			{/* Background animated blobs */}
			<div className="login-blob login-blob-1" />
			<div className="login-blob login-blob-2" />
			<div className="login-blob login-blob-3" />

			<div className="login-card">
				{/* Logo / Header */}
				<div className="login-logo">
					<div className="login-logo-icon">🏢</div>
					<h1 className="login-title">GasControl</h1>
					<p className="login-subtitle">Sistema de Gestão de Condomínios</p>
				</div>

				{/* Form */}
				<form onSubmit={handleSubmit} className="login-form" noValidate>
					<div className="login-field">
						<label htmlFor="login-email" className="login-label">
							E-mail
						</label>
						<div className="login-input-wrapper">
							<span className="login-input-icon">✉️</span>
							<input
								id="login-email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="seu@email.com"
								className="login-input"
								autoComplete="email"
								required
							/>
						</div>
					</div>

					<div className="login-field">
						<label htmlFor="login-password" className="login-label">
							Senha
						</label>
						<div className="login-input-wrapper">
							<span className="login-input-icon">🔒</span>
							<input
								id="login-password"
								type={showPassword ? 'text' : 'password'}
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="••••••••••"
								className="login-input login-input-password"
								autoComplete="current-password"
								required
							/>
							<button
								type="button"
								className="login-toggle-password"
								onClick={() => setShowPassword((v) => !v)}
								aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
							>
								{showPassword ? '🙈' : '👁️'}
							</button>
						</div>
					</div>

					<div style={{ textAlign: 'right', marginBottom: '1rem' }}>
						<Link to="/forgot-password" style={{ color: '#fff', fontSize: '0.85rem', textDecoration: 'underline' }}>
							Esqueci minha senha
						</Link>
					</div>

					{error && (
						<div className="login-error" role="alert">
							⚠️ {error}
						</div>
					)}

					<button
						id="login-submit"
						type="submit"
						className={`login-btn${loading ? ' login-btn-loading' : ''}`}
						disabled={loading}
					>
						{loading ? (
							<span className="login-spinner" />
						) : (
							'Entrar'
						)}
					</button>
				</form>

				<p className="login-footer">
					GasControl &copy; {new Date().getFullYear()} — Acesso restrito
				</p>
			</div>
		</div>
	);
}
