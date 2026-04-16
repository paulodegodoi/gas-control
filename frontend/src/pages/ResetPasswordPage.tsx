import { useState, type FormEvent } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function ResetPasswordPage() {
	const API_BASE = import.meta.env.VITE_API_URL;
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const email = searchParams.get('email') || '';
	const token = searchParams.get('token') || '';

	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [message, setMessage] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		setError('');
		setMessage('');

		if (newPassword !== confirmPassword) {
			setError('As senhas não coincidem.');
			return;
		}

		if (!token || !email) {
			setError('Link de recuperação inválido ou incompleto.');
			return;
		}

		setLoading(true);

		try {
			const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ email, token, newPassword }),
			});

			const data = await res.json();
			if (!res.ok) {
				setError(data.message || data || 'Erro ao redefinir a senha.');
			} else {
				setMessage('Senha alterada com sucesso! Redirecionando...');
				setTimeout(() => {
					navigate('/login', { replace: true });
				}, 2000);
			}
		} catch (err) {
			setError('Falha de conexão com o servidor.' + err);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="login-page">
			{/* Background animated blobs */}
			<div className="login-blob login-blob-1" />
			<div className="login-blob login-blob-2" />
			<div className="login-blob login-blob-3" />

			<div className="login-card">
				<div className="login-logo">
					<div className="login-logo-icon">🏢</div>
					<h1 className="login-title">GasControl</h1>
					<p className="login-subtitle">Criar Nova Senha</p>
				</div>

				<form onSubmit={handleSubmit} className="login-form" noValidate>
					<div className="login-field">
						<label htmlFor="reset-new-password" className="login-label">
							Nova Senha
						</label>
						<div className="login-input-wrapper">
							<span className="login-input-icon">🔒</span>
							<input
								id="reset-new-password"
								type={showPassword ? 'text' : 'password'}
								value={newPassword}
								onChange={(e) => setNewPassword(e.target.value)}
								placeholder="••••••••••"
								className="login-input login-input-password"
								required
							/>
							<button
								type="button"
								className="login-toggle-password"
								onClick={() => setShowPassword((v) => !v)}
							>
								{showPassword ? '🙈' : '👁️'}
							</button>
						</div>
					</div>

					<div className="login-field">
						<label htmlFor="reset-confirm-password" className="login-label">
							Confirmar Nova Senha
						</label>
						<div className="login-input-wrapper">
							<span className="login-input-icon">🔒</span>
							<input
								id="reset-confirm-password"
								type={showPassword ? 'text' : 'password'}
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								placeholder="••••••••••"
								className="login-input login-input-password"
								required
							/>
						</div>
					</div>

					{message && (
						<div className="login-error" style={{ backgroundColor: '#2e7d32', color: 'white' }} role="alert">
							✅ {message}
						</div>
					)}
					
					{error && (
						<div className="login-error" role="alert">
							⚠️ {error}
						</div>
					)}

					<button
						id="reset-submit"
						type="submit"
						className={`login-btn${loading ? ' login-btn-loading' : ''}`}
						disabled={loading}
					>
						{loading ? <span className="login-spinner" /> : 'Redefinir Senha'}
					</button>
				</form>
			</div>
		</div>
	);
}
