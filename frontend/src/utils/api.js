import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    withCredentials: true,
});

async function get(url, config = {}){
    try{
        const fullUrl = `${api.defaults.baseURL}${url}`;
        const response = await api.get(fullUrl, config);
        return response.data;
    }catch(err){
        throw err.response?.data || err;
    }
}

async function post(url, data, config={}){
    try{
        const fullUrl = `${api.defaults.baseURL}${url}`;
        const response = await api.post(fullUrl, data,config);
        return response.data;
    }catch(err){
        throw err.response?.data || err;
    }
}

async function put(url, data, config={}){
    try{
        const fullUrl = `${api.defaults.baseURL}${url}`;
        const response = await api.put(fullUrl, data,config);
        return response.data;
    }catch(err){
        throw err.response?.data || err;
    }
}

async function registerUser(url, {firstName, lastName, email, password}, config={}){
    try{
        const fullUrl = `${api.defaults.baseURL}${url}`;
        const response = await api.post(fullUrl, {firstName, lastName, email, password}, config);
        return response.data;
    }catch(err){
        throw err.response?.data || err;
    }
}

export default {get, post, put, registerUser};