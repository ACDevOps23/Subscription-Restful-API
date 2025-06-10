
const errorMiddleware = (err, req, res, next) => { // fetching more details if a common mongoose error occurs
    try {
        let error = { ...err };

        error.message = err.message;
        console.error(error);

        // Mongoose bad ObjectID
        if (err.name === "CastError") {
            const message = "Resource not found";
            error = new Error(message);
            error.statusCode = 404;
        }

        // mongoose duplicate key
        if (err.code === 11000) {
            const message = "Duplicate field value entered";
            error = new Error(message);
            error.statusCode = 400;
        }

        // mongoose validation error 
        if (err.name === 'ValidationError') {
            const message = Object.values(err.errors).map(val => val.message);
            error = new Error(message.join(", "));
            error.statusCode = 400;
        }

        res.status(error.statusCode || 500).json({success: false, error: error.message});

    } catch(error) {
        next(error);
    }
}

export default errorMiddleware;