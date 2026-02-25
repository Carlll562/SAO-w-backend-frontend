const { getMongoDb } = require('../config/db');
const bcrypt = require('bcryptjs');

const COLLECTION = 'users';

const UserModel = {
    // Find a user by email
    findByEmail: async (email) => {
        const db = getMongoDb();
        return db.collection(COLLECTION).findOne({ email });
    },

    // Create a new user with hashed password
    createUser: async ({ name, email, password, role, permissions }) => {
        const db = getMongoDb();

        const passwordHash = await bcrypt.hash(password, 10);

        const userDoc = {
            name,
            email,
            passwordHash,
            role,
            permissions,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const existing = await db.collection(COLLECTION).findOne({ email });
        if (existing) {
            const err = new Error('Email already exists');
            err.code = 'EMAIL_EXISTS';
            throw err;
        }

        const result = await db.collection(COLLECTION).insertOne(userDoc);
        return { ...userDoc, _id: result.insertedId };
    },

    // Verify password for email
    verifyCredentials: async (email, password) => {
        const db = getMongoDb();
        const user = await db.collection(COLLECTION).findOne({ email });
        if (!user) return null;

        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match) return null;

        return user;
    },
};

module.exports = UserModel;

