const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
    }
}

export { asyncHandler }

// So, when you use asyncHandler in your routes, it's like adding a layer that makes working with asynchronous code smoother and ensures that errors are handled consistently across your application.

//used when doing web request and all not recommended for local methods like (generateAccessAndRefreshToken)