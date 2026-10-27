import { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../authConfig";

function decodeJwt(token) {
    try {
        const payload = token.split(".")[1];
        const decoded = decodeURIComponent(
            atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
                .split("")
                .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
                .join("")
        );
        return JSON.parse(decoded);
    } catch (e) {
        return null;
    }
}

export function useUserRole() {
    const { instance, accounts } = useMsal();
    const [rol, setRol] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (accounts.length === 0) {
            setRol(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        instance
            .acquireTokenSilent({
                ...loginRequest,
                account: accounts[0],
            })
            .then((response) => {
                const claims = decodeJwt(response.accessToken);
                const roles = claims?.roles || [];

                if (roles.includes("ROLE_ADMIN")) setRol("ADMIN");
                else if (roles.includes("ROLE_OPERADOR")) setRol("OPERADOR");
                else setRol("CLIENTE"); // ROLE_CLIENTE o usuario recién registrado sin rol asignado
            })
            .catch((error) => {
                console.error("Error obteniendo access token:", error);
                setRol(null);
            })
            .finally(() => setLoading(false));
    }, [accounts, instance]);

    return { rol, loading };
}