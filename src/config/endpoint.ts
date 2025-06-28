export const readingEndpoints = {
    all: '/reading',
    one: (id: string) => `/reading/${id}`
}


export const authEndpoints = {
    login: "/api/admin/login",
    refresh: "/api/admin/refresh",
    logout: "/api/admin/logout",
};
