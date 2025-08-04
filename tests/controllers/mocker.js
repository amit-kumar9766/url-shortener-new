function mockResponse() {
  const res = {};
  res.json = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
}

function mockRequest({ body = {}, params = {}, query = {}, headers = {} } = {}) {
  return { body, params, query, headers };
}

module.exports = {
  mockRequest,
  mockResponse,
};
