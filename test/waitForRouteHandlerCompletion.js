const waitForRouteHandlerCompletion = async (handler, req, res) => {
  let nextError;

  const next = jest.fn((err) => {
    if (err) {
      nextError = err;
    }
  });

  await handler(req, res, next);

  if (nextError) {
    throw nextError;
  }

  return next;
};

module.exports = waitForRouteHandlerCompletion;
