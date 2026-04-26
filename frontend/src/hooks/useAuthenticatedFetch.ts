import { useCallback } from "react";
import { useAuth } from "../context/AuthContext";

export function useAuthenticatedFetch() {
    const { logout } = useAuth();

    const authenticatedFetch = useCallback(
        async (input: RequestInfo | URL, init?: RequestInit) => {
            const response = await fetch(input, init);

            if (response.status === 401) {
                logout();
            }

            return response;
        },
        [logout],
    );

    return authenticatedFetch;
}
