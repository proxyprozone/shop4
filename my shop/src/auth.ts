export let adminToken: string | null = null;
export const setAdminToken = (token: string | null) => {
  adminToken = token;
};
