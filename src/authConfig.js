export const msalConfig = {
    auth: {
        clientId: "d3bb7766-4fbc-4ccf-a52d-bd7ef2e1c562",
        authority: "https://login.microsoftonline.com/339ca6ce-5975-43dc-ad6d-f31685ecd8c7",
        redirectUri: "http://localhost:5173",
    },
    cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: false,
    },
};

export const loginRequest = {
    scopes: ["api://03cdb866-be7f-4e27-84d6-f2091839984b/access_as_user"],
};