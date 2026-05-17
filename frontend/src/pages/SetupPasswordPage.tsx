import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SetupPasswordPage() {
	const API_BASE = import.meta.env.VITE_API_URL;
	const navigate = useNavigate();
	const { token, refreshContext, user } = useAuth();
	
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

		setLoading(true);

		try {
			const res = await fetch(`${API_BASE}/api/auth/change-password`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({ newPassword }),
			});

			const data = await res.json();
			if (!res.ok) {
				setError(data.message || data || 'Erro ao definir a senha.');
			} else {
				setMessage('Senha definida com sucesso! Carregando painel...');
				setTimeout(async () => {
					await refreshContext();
					// Em AuthContext, se refresh der certo, ele vai atualizar user.mustChangePassword para false.
					// Aí o PrivateRoute lida com a ida para a tela certa (Select Condominium ou Panel).
					let shouldGoHome = true;
					if (user?.role !== 'Morador' && !localStorage.getItem('gascontrol_active_condo')) {
						navigate('/select-condominium', { replace: true });
						shouldGoHome = false;
					}
					if (shouldGoHome) {
						navigate('/', { replace: true });
					}
				}, 1500);
			}
		} catch (err) {
			setError('Falha de conexão com o servidor. ' + err);
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
					<div className="login-logo-icon">🔒</div>
					<h1 className="login-title">Bem-vindo(a)!</h1>
					<p className="login-subtitle">Por segurança, redefina sua senha inicial.</p>
				</div>

				<form onSubmit={handleSubmit} className="login-form" noValidate>
					<div className="login-field">
						<label htmlFor="setup-new-password" className="login-label">
							Nova Senha
						</label>
						<div className="login-input-wrapper">
							<span className="login-input-icon">🔑</span>
							<input
								id="setup-new-password"
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
						<label htmlFor="setup-confirm-password" className="login-label">
							Confirmar Senha
						</label>
						<div className="login-input-wrapper">
							<span className="login-input-icon">🔑</span>
							<input
								id="setup-confirm-password"
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
						<div className="login-error login-success" role="alert">
							✅ {message}
						</div>
					)}
					
					{error && (
						<div className="login-error" role="alert">
							⚠️ {error}
						</div>
					)}

					<button
						id="setup-submit"
						type="submit"
						className={`login-btn${loading ? ' login-btn-loading' : ''}`}
						disabled={loading}
					>
						{loading ? <span className="login-spinner" /> : 'Salvar Senha e Entrar'}
					</button>
				</form>
			</div>
		</div>
	);
}
