//This file contains business logic related to users, it sits between controllers and models
const userModel = require('../models/user.model');

const createUser = async (userData) => {
    const existingUser = await userModel.findByEmail(userData.email);
    if (existingUser) {
        const error = new Error('User already exists');
        error.statusCode = 409;
        throw error;
    }
    return await userModel.create(userData);
};

const getUserById = async (id) => {
    const user = await userModel.findById(id);
    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }
    return user;
};

const getUserByUsername = async (username) => {
    const user = await userModel.findByUsername(username);
    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }
    return user;
};

module.exports = { createUser, getUserById, getUserByUsername };