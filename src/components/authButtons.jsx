import { useMsal } from "@azure/msal-react";
import {loginRequest} from "../authConfig.js";

export default function AuthButtons(){
    const { instance, accounts} = useMsal();
    const isAuthenticated = accounts.length > 0;

    const handleLogin = () => {
        instance.loginRedirect(loginRequest);
    };
    const handleLogout = () => {
        instance.logoutRedirect();
    };

    if (isAuthenticated) {
        const user = accounts[0];
        return(
            <div>
                <span>Hola, {user.name || user.username}</span>
                <button onClick={handleLogout}>Cerrar sesión</button>
            </div>
        );
    }
    return <button onClick={handleLogin}>Iniciar Sesión</button>
}