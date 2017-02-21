export class ExtendableError extends Error {

    constructor(error, context) {
        const message = getMessage(error) || '';
        super(message);
        context = context || this;
        this.name = this.constructor.name;
        this.message = message;
        Error.captureStackTrace(context, context.constructor.name);
    }

}

const getMessage = (error) => {

    if (error && typeof error === 'object' && error.message) {
        return error.message;
    }

    if (typeof error === 'string') {
        return error;
    }

};

const getStatus = (error) => {

    if (error && typeof error === 'object' && error.status) {
        return error.status;
    }

    if (typeof error === 'number' && error >= 400 && error <= 599) {
        return error;
    }

};

export class Unauthorized extends ExtendableError {
    constructor(error) {
        super(error);
        this.status = getStatus(error) || 401;
        this.message = getMessage(error) || 'FORBIDDEN';
    }
}

export class BadRequest extends ExtendableError {
    constructor(error) {
        super(error);
        this.status = (error || {}).status || 400;
    }
}

export class Forbidden extends ExtendableError {
    constructor(error) {
        super(error);
        this.status = getStatus(error) || 403;
        this.message = getMessage(error);
    }
}

export class NotFound extends ExtendableError {
    constructor(error) {
        super(error);
        this.status = (error || {}).status || 404;
        this.message = getMessage(error) || 'Not found';
    }
}

export class InternalServerError extends ExtendableError {
    constructor(error) {
        super(error);
        this.status = (error || {}).status || 500;
        this.message = getMessage(error);
    }
}

export default {
    ExtendableError,
};
