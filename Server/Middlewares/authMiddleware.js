const jwt = require('jsonwebtoken')

const verifyToken = (req, res, next) => {
    let token = req.cookies.token;

    // Fallback to Authorization header (Bearer token) for cross-domain local/production deployments
    if (!token && req.headers.authorization) {
        const parts = req.headers.authorization.split(' ');
        if (parts.length === 2 && parts[0] === 'Bearer') {
            token = parts[1];
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'No token, provided' })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = {id: decoded.id};
        next();
    } catch (error) {
        return res.status(401).json({message: 'Token is not valid'})
    }
}



module.exports = verifyToken