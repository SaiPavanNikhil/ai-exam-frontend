const host = window.location.hostname;
console.log("🌐 Running on host:", host);

let apiBaseUrl = '';

if (host === '172.16.1.151') {
  apiBaseUrl = 'http://172.16.1.151:8080/super-admin-erp';
}
else if (host === '122.184.83.139') {
  apiBaseUrl = 'http://122.184.83.139:80/super-admin-erp';
}
else if (host === '101.0.36.60') {
  apiBaseUrl = 'http://101.0.36.60:8080';
}
else if (host === '172.16.1.48') {
  apiBaseUrl = 'http://172.16.1.48:8081/super-admin-erp';
}
// else {
//   // ✅ Railway backend for production
//   apiBaseUrl = 'https://ai-exam-backend-code-production.up.railway.app';
// }
else {
  // ✅ Railway backend for production
  apiBaseUrl = 'http://localhost:8000';
}

export const environment = {
  production: false,
  apiBaseUrl: apiBaseUrl
};
// const host = window.location.hostname;
// console.log("🌐 Running on host:", host);

// let apiBaseUrl = '';

// if (host === '172.16.1.151') {
//   apiBaseUrl = 'http://172.16.1.151:8080/super-admin-erp';
// }
// else if (host === '122.184.83.139') {
//   apiBaseUrl = 'http://122.184.83.139:80/super-admin-erp';
// }
// else if (host === '101.0.36.60') {
//   apiBaseUrl = 'http://101.0.36.60:8080';
// }
// else if (host === '172.16.1.48') {
//   apiBaseUrl = 'http://172.16.1.48:8081/super-admin-erp';
// }
// else {
//   // 🔥 LOCAL DEV (your Python backend)
//   apiBaseUrl = 'https://ai-exam-backend-code-production.up.railway.app';
// }

// export const environment = {
//   production: false,
//   apiBaseUrl: apiBaseUrl
// };