console.log("Host:", window.location.hostname);

console.log("origin:", window.location.origin);

export const environment = {
  production: true,
  apiBaseUrl: `${window.location.origin}/ai-exam-backend-code-production.up.railway.app`
};