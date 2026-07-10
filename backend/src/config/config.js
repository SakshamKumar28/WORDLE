import { config } from "dotenv";

config({debug : true, encoding : 'UTF-8', override: true});

const port = process.env.PORT;
const mongodbURL = process.env.MONGODB_URL;
const refreshToken = process.env.REFRESH_TOKEN;
const accessToken = process.env.ACCESS_TOKEN;
if(!port || !mongodbURL || !refreshToken || !accessToken){
    throw Error("Enviornment Variables are missing");
}

export {port, mongodbURL, accessToken, refreshToken};