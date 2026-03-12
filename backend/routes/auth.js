const express = require('express');
const router = express.Router();
const {body} = require('express-validator');
const User = require('../models/user');
const authRoutes  = require('../controllers/auth');
const isAuth = require('../middleware/is-auth');

router.put('/signup', [
    body('email').isEmail().withMessage('Please enter a valid email.')
    .custom((value, {req}) => {
        return User.findOne({email: value}).then(userDoc => {
            if (userDoc) {
                return Promise.reject('E-Mail address already exists!');
            }
        });
    }).normalizeEmail(),
    body('password').trim().isLength({ min: 5 }).withMessage('Password must be at least 5 characters long.'),
        body('name').trim().not().isEmpty().withMessage('Name is required.')
], authRoutes.signup);

router.post('/login', authRoutes.login);

router.get('/status', isAuth, authRoutes.getUserStatus);

router.patch('/status', [
    body('status').trim().not().isEmpty()
], isAuth, authRoutes.updateUserStatus);
module.exports = router;