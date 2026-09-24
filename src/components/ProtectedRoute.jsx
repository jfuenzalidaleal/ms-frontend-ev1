import {useIsAuthenticated, useMsal} from "@azure/msal-react";
import {Navigate} from "react-router-dom";
import {loginRequest} from "../authConfig.js";

export default function ProtectedRoute({ children}) {
    const isAuthenticated = useIsAuthenticated();
    const {instance, inProgress} = useMsal();

    if (!isAuthenticated && inProgress === "none") {
        instance.loginRedirect(loginRequest);
        return null;
    }
    if (!isAuthenticated) {
        return <p>Redirigiendo al login...</p>
    }
    return children;
}