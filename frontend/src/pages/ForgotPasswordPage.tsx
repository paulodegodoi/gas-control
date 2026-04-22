import { User } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { SmallIcon } from "../components/Icon";

export default function ForgotPasswordPage() {
    const API_BASE = import.meta.env.VITE_API_URL;
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError("");
        setMessage("");
        setLoading(true);

        try {
            const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(
                    data.message || data || "Erro ao solicitar recuperação.",
                );
            } else {
                setMessage(
                    data.message || "E-mail enviado se o cadastro existir.",
                );
            }
        } catch (err) {
            setError("Falha de conexão com o servidor." + err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            {/* Background animated blobs reutilizando o CSS de login */}
            <div className="login-blob login-blob-1" />
            <div className="login-blob login-blob-2" />
            <div className="login-blob login-blob-3" />

            <div className="login-card">
                <div className="login-logo">
                    <div className="login-logo-icon">🏢</div>
                    <h1 className="login-title">GasControl</h1>
                    <p className="login-subtitle">Recuperação de Senha</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form" noValidate>
                    <div className="login-field">
                        <label htmlFor="recovery-email" className="login-label">
                            E-mail cadastrado
                        </label>
                        <div className="login-input-wrapper">
                            <span className="login-input-icon">
                                <SmallIcon icon={User} />
                            </span>
                            <input
                                id="recovery-email"
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

                    {message && (
                        <div
                            className="login-error"
                            style={{
                                backgroundColor: "#2e7d32",
                                color: "white",
                            }}
                            role="alert"
                        >
                            ✅ {message}
                        </div>
                    )}

                    {error && (
                        <div className="login-error" role="alert">
                            ⚠️ {error}
                        </div>
                    )}

                    <button
                        id="recovery-submit"
                        type="submit"
                        className={`login-btn${loading ? " login-btn-loading" : ""}`}
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="login-spinner" />
                        ) : (
                            "Enviar link de recuperação"
                        )}
                    </button>

                    <div style={{ marginTop: "1rem", textAlign: "center" }}>
                        <Link
                            to="/login"
                            style={{
                                color: "#fff",
                                fontSize: "0.9rem",
                                textDecoration: "underline",
                            }}
                        >
                            Voltar para o Login
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
