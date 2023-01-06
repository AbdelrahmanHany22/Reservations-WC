class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${this.statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        // to not pollute the stack trace with the constructor for this class
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;