const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authHeader = req.get('Authorization');
    console.log(authHeader);
    if (!authHeader) {
        req.isAuth = false;
        return next();
    }
    const token = req.get('Authorization').split(' ')[1];
    try {
        decodedToken = jwt.verify(token, 'somesupersecretkey');
        console.log(decodedToken);
    } catch (err) {
        req.isAuth = false;
        return next();
    }
    if (!decodedToken) {
        req.isAuth = false;
        return next();
    }
    req.userId = decodedToken.userId;
    req.isAuth = true;
    next();
}