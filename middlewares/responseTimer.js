// middlewares/responseTime.js
const responseTimeMiddleware = (req, res, next) => {
  const startTime = Date.now();

  const originalEnd = res.end;

  res.end = function (...args) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    res.set("X-Response-Time", `${responseTime}ms`);

    originalEnd.apply(this, args);
  };

  next();
};

module.exports = responseTimeMiddleware;
