export function requireRole(...roles) {
    return (req, res, next) => {
        if (!roles.includes(req.role)) {
            return res.status(403).json({ error: 'You do not have access to this.' });
        }
        next();
    };
}
