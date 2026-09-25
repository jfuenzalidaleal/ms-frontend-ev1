import axios from "axios";
import { msalInstance } from "../msalInstance";
import { loginRequest } from "../authConfig";

const axiosClient = axios.create({
    // Se elimina baseURL fija para que ms-catalogo (8082) y ms-pedidos (8081)
    // usen sus propias URLs directamente desde sus respectivos archivos de servicio.
});

axiosClient.interceptors.request.use(
    async (config) => {
        let account = msalInstance.getActiveAccount();

        // Fallback: si no hay cuenta activa pero sí hay cuentas en caché, úsala
        if (!account) {
            const accounts = msalInstance.getAllAccounts();
            if (accounts.length > 0) {
                account = accounts[0];
                msalInstance.setActiveAccount(account);
            }
        }

        if (account) {
            try {
                const response = await msalInstance.acquireTokenSilent({
                    ...loginRequest,
                    account,
                });
                config.headers.Authorization = `Bearer ${response.accessToken}`;
            } catch (error) {
                console.error("No se pudo obtener el token para la petición:", error);
                await msalInstance.acquireTokenRedirect(loginRequest);
            }
        } else {
            console.warn("No hay cuenta activa: la petición se enviará sin token.");
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default axiosClient;