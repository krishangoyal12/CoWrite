const jwt = require('jsonwebtoken')

const verifyToken = (req, res, next) => {
    const token = req.cookies.token
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