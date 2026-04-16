export type Condominium = {
	id: string;
	name: string;
};

export type Apartment = {
	id: string;
	number: string;
	name: string;
	isActive: boolean;
	condominiumId?: string | null;
};

export type Reading = {
	id: string;
	apartmentId: string;
	month: string;
	previousReading: number;
	currentReading: number;
};

// -------------------------------------------------------
// Auth Types
// -------------------------------------------------------
export type UserRole = 'Admin' | 'Sindico' | 'Morador';

export type AuthUser = {
	id: string;
	name: string;
	email: string;
	role: UserRole;
	condominiumIds: string[];
	apartmentId?: string | null;
	mustChangePassword?: boolean;
};

export type AuthContextType = {
	token: string | null;
	user: AuthUser | null;
	isAuthenticated: boolean;
    activeCondominiumId: string | null;
    setActiveCondominiumId: (id: string | null) => void;
	login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    refreshContext: () => Promise<{ success: boolean; error?: string }>;
	logout: () => void;
};
