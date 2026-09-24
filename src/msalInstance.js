import { PublicClientApplication, EventType } from "@azure/msal-browser";
import { msalConfig } from "./authConfig";

export const msalInstance = new PublicClientApplication(msalConfig);

msalInstance.addEventCallback((event) => {
    if (event.eventType === EventType.LOGIN_SUCCESS && event.payload.account) {
        msalInstance.setActiveAccount(event.payload.account);
    }
});

export async function initializeMsal() {
    await msalInstance.initialize();

    // Si ya hay una cuenta en caché (de una sesión anterior) y no hay cuenta activa, la activamos
    if (!msalInstance.getActiveAccount()) {
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length > 0) {
            msalInstance.setActiveAccount(accounts[0]);
        }
    }
}