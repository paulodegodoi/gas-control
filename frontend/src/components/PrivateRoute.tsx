import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { ReactNode } from 'react';

interface PrivateRouteProps {
	children: ReactNode;
}

export default function PrivateRoute({ children }: PrivateRouteProps) {
	const { isAuthenticated, user } = useAuth();
	const location = useLocation();

	if (!isAuthenticated) {
		// Preserva a URL original para redirecionar após login
		return <Navigate to="/login" state={{ from: location }} replace />;
	}

	if (user?.mustChangePassword && location.pathname !== '/setup-password') {
		return <Navigate to="/setup-password" replace />;
	}

	if (!user?.mustChangePassword && location.pathname === '/setup-password') {
		return <Navigate to="/" replace />;
	}

	return <>{children}</>;
}
