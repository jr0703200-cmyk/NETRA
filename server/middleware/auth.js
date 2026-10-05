const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'NETRA_OPERATIONAL_COMMAND_CRYPT_KEY_2026';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // If no token in headers, check query param (e.g. for streams/snapshots)
    const queryToken = req.query.token;
    if (queryToken) {
      return jwt.verify(queryToken, JWT_SECRET, (err, user) => {
        if (err) return res.status(401).json({ success: false, error: 'Invalid or expired token' });
        req.user = user;
        next();
      });
    }

    // Default development fallback session for convenience during demonstrations
    req.user = {
      id: 'USR-OPR-002',
      username: 'operator',
      role: 'operator',
      name: 'Surveillance Operator Desk 1'
    };
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, error: 'Token verification failed' });
    }
    req.user = user;
    next();
  });
}

function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access Denied: Requires role in [${allowedRoles.join(', ')}]`
      });
    }

    next();
  };
}

module.exports = {
  JWT_SECRET,
  authenticateToken,
  requireRole
};
