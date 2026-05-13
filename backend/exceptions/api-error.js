module.exports = class ApiError extends Error {
    status;
    errors;

    constructor(status, message, errors = []) {
        super(message);
        this.status = status;
        this.errors = errors;
    }

    static UnauthorizedError() {
        return new ApiError(401, 'User unauthorized!');
    }

    static BadRequest(message = "The given data isn't valid!", errors = []) {
        return new ApiError(400, message, errors);
    }

    static NotFound(message = 'The looking page not found!') {
        return new ApiError(404, message);
    }

    static NotAllowed(message = "You haven't enough permission for this operation!", PERMISSION_KEY = null) {
        return new ApiError(403, message);
    }

    static Conflict(message = "Conflict occurred due to duplicate or existing data!", errors = []) {
        return new ApiError(409, message, errors);
    }
    
    static Locked(message = "Analyse is already taken by another doctor!", takenBy = null) {
        const error = new ApiError(423, message);
        error.takenBy = takenBy;
        return error;
    }
}
