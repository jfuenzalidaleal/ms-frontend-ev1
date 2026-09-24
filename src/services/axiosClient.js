import axios from "axios";
import { msalInstance } from "../msalInstance";
import { loginRequest } from "../authConfig";

const axiosClient = axios.create({
    baseURL: "http://localhost:8080/api",
});

axiosClient.interceptors.request.use(async (config) => {
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
});

export default axiosClient;