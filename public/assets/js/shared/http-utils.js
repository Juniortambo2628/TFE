import axios from 'axios';

const apiClient = axios.create({
    baseURL: '/api', // Adjust base URL as needed
    headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
    }
});

// Add a request interceptor
apiClient.interceptors.request.use(function (config) {
    // Do something before request is sent, e.g., add auth token
    return config;
}, function (error) {
    // Do something with request error
    return Promise.reject(error);
});

// Add a response interceptor
apiClient.interceptors.response.use(function (response) {
    // Any status code that lie within the range of 2xx cause this function to trigger
    return response.data;
}, function (error) {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    console.error('API Error:', error);
    return Promise.reject(error);
});

export default apiClient;
