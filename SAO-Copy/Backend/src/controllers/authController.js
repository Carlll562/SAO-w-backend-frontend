const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');
const AuditModel = require('../models/auditModel');

const JWT_EXPIRY = '24h';

const signTokenForUser = (user) => {
    return jwt.sign(
        {
            id: user._id?.toString?.() || user.id || 0,
            username: user.email,
            name: user.name,
            role: user.permissions?.canCreateAccounts ? 'registrar' : 'faculty',
            email: user.email,
        },
        process.env.JWT_SECRET,
        { expiresIn: JWT_EXPIRY }
    );
};

// POST /api/v1/auth/login
const login = async (req, res, next) => {
    const { email, password } = req.body || {};

    if (!email || !password) {
        const err = new Error('Email and password are required');
        err.statusCode = 400;
        return next(err);
    }

    try {
        const user = await UserModel.verifyCredentials(email, password);
        if (!user) {
            await AuditModel.logAction('Error', {
                performer: email,
                action: 'LOGIN_FAILED',
                status: 'FAILURE',
                details: `Invalid credentials for "${email}"`,
            });
            const err = new Error('Invalid email or password');
            err.statusCode = 401;
            throw err;
        }

        const token = signTokenForUser(user);

        await AuditModel.logAction('SessionAuth', {
            performer: email,
            action: 'LOGIN',
            status: 'SUCCESS',
            details: `User ${email} logged in via Mongo-backed auth`,
        });

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.permissions?.canCreateAccounts ? 'Admin' : 'User',
                permissions: user.permissions,
            },
        });
    } catch (err) {
        next(err);
    }
};

// POST /api/v1/auth/register
const register = async (req, res, next) => {
    const { name, email, password, permissions } = req.body || {};

    if (!name || !email || !password) {
        const err = new Error('Name, email, and password are required');
        err.statusCode = 400;
        return next(err);
    }

    try {
        const role = permissions?.canCreateAccounts ? 'Admin' : 'User';
        const created = await UserModel.createUser({
            name,
            email,
            password,
            role,
            permissions,
        });

        await AuditModel.logAction('CRUD', {
            performer: req.user?.username || req.user?.email || 'System',
            action: 'CREATE_USER',
            status: 'SUCCESS',
            details: { name, email, role },
        });

        res.status(201).json({
            success: true,
            user: {
                id: created._id,
                name: created.name,
                email: created.email,
                role,
                permissions: created.permissions,
            },
        });
    } catch (err) {
        if (err.code === 'EMAIL_EXISTS') {
            err.statusCode = 409;
        }
        next(err);
    }
};

module.exports = { login, register };

