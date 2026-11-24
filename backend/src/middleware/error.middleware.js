
export const errorHandler = (err, req, res, next) => {
    console.error(err);
    if (err.name === "CastError") {
    err.statusCode = 400;
    err.code = "INVALID_ID";
    err.message = "Invalid resource ID";
}

    const statusCode = err.statusCode || 500;
    const code = err.code || "INTERNAL_SERVER_ERROR";

    return res.status(statusCode).json({
        error: {
            code,
            message: statusCode === 500
                ? "Internal server error"
                : err.message,
        },
    });
};
