const checkEnterprisePlan = (req, res, next) => {
  const user = req.user;
  if (!user || user.plan !== "enterprise") {
    return res
      .status(403)
      .json({ error: "Enterprise plan required for this action." });
  }
  next();
};

module.exports = checkEnterprisePlan;
