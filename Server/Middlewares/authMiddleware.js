const jwt = require('jsonwebtoken')

const verifyToken = (req, res, next) => {
    let token = req.cookies.token;
    console.log('[verifyToken] Incoming cookies:', req.cookies);
    console.log('[verifyToken] Incoming Authorization header:', req.headers.authorization);

    // Fallback to Authorization header (Bearer token) for cross-domain local/production deployments
    if (!token && req.headers.authorization) {
        const parts = req.headers.authorization.split(' ');
        if (parts.length === 2 && parts[0] === 'Bearer') {
            token = parts[1];
            console.log('[verifyToken] Found Bearer token in headers');
        }
    }

    if (!token) {
        console.log('[verifyToken] Verification failed: No token provided');
        return res.status(401).json({ message: 'No token, provided' })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.user = {id: decoded.id};
        console.log('[verifyToken] Token verified successfully for user:', decoded.id);
        next();
    } catch (error) {
        console.error('[verifyToken] JWT verification error:', error.message);
        return res.status(401).json({message: 'Token is not valid'})
    }
}



module.exports = verifyToken