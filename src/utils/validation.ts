import Joi from 'joi';

export function validateEmailInput(email: string) {
  return Joi.object({
    email: Joi.string()
      .email({
        minDomainSegments: 2
      })
      .lowercase()
      .required()
  }).validate({ email }).error;
}

export function validatePasswordInput(password: string) {
  // min length of password is at least 5
  return Joi.object({
    password: Joi.string().min(5).required()
  }).validate({ password }).error;
}

export function validateFirstNameInput(firstName: string) {
  // min length of first name is at least 3
  return Joi.object({
    firstName: Joi.string().min(3).required()
  }).validate({
    firstName
  }).error;
}

export function validateLastNameInput(lastName: string) {
  // min length of last name is at least 3
  return Joi.object({
    lastName: Joi.string().min(3).required()
  }).validate({
    lastName
  }).error;
}
