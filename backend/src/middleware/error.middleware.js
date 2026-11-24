export const errorHandler = (err, req, res, next) => {
  console.error(err);

  let statusCode = err.statusCode || 500;
  let code = err.code || "INTERNAL_SERVER_ERROR";
  let message = err.message || "Internal server error";

  if (err.name === "CastError") {
    statusCode = 404;
    code = "NOT_FOUND";
    message = "Requested record not found.";
  }

  if (statusCode >= 500) {
    statusCode = 500;
    code = "INTERNAL_SERVER_ERROR";
    message = "Internal server error";
  }

  return res.status(statusCode).json({
    error: {
      code,
      message,
    },
  });
};
