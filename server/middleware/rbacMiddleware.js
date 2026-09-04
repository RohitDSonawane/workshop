const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: Requires one of the following roles: [${allowedRoles.join(', ')}]`
      });
    }
    next();
  };
};

module.exports = { requireRole };
