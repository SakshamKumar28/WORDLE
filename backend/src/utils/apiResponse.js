export const apiResponse = (statusCode, data, message = "Success") => {
    return {
        success: statusCode < 400, 
        status: statusCode,
        message: message,
        data: data
    };
};