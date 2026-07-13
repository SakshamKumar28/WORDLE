import User from "../user/user.model.js";

class AuthRepository{
    async createUser(data){
        return await User.create(data);  
    }
    async findUserByEmail(email){
        return await User.findOne({ email });
    }
    async findUserById(id){
        return await User.findById(id);
    }
    async updateUserById(id, data){
        return await User.findByIdAndUpdate(id, data, { new: true });
    }
    async updateUserByEmail(email, data){
        return await User.updateOne({ email }, data);
    }
}

export default new AuthRepository();