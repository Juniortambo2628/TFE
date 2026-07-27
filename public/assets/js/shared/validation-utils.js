import validator from 'validator';

export const validateEmail = (email) => {
    return validator.isEmail(email);
};

export const validatePassword = (password) => {
    return validator.isStrongPassword(password, {
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
    });
};

export const isEmpty = (str) => {
    return validator.isEmpty(str);
};

export const sanitizeInput = (str) => {
    return validator.escape(str);
};
