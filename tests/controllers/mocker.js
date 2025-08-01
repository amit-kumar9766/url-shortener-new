function mockResponse() {
  const res = {};
  res.json = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
}

function mockRequest({ body = {}, params = {}, query = {} } = {}) {
  return { body, params, query };
}

module.exports = {
  mockRequest,
  mockResponse,
};
