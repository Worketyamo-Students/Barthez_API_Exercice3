import { NextFunction, Request, Response } from "express";
import { body, param, validationResult } from "express-validator";
import { HttpCode } from "../core/constants";

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z]).{5,}$/;

export const validator = {
    validateUser: [
        // Validation of User name
        body('name')
            .exists().withMessage('name is required !')
            .trim().notEmpty().withMessage('name cannot be empty !')
            .isString().withMessage('name should have a string !')
            .isLength({min:3}).withMessage('name is to short !')
            .isLength({max: 30}).withMessage('name is too long !')
        ,
        // Validatoion of User email
        body('email')
            .exists().withMessage('email is required !')
            .trim().notEmpty().withMessage('email can\'t be empty !')
            .isEmail().withMessage('invalid email !')
        ,
        // validation of User password
        body('password')
            .exists().withMessage('required password !')
            .trim().notEmpty().withMessage('password can\'t be empty!')
            .matches(passwordRegex).withMessage('password should content at less 5 string, 1 uppercase, and 1 lowercase !')
        ,
    ],
 
    validateUserAtLogin: [
        // Validatoion of User email
        body('email')
            .exists().withMessage('email is required !')
            .trim().notEmpty().withMessage('email can\'t be empty !')
            .isEmail().withMessage('invalid email !')
        ,
    ],
    
    validateTable: [
        body('number')
            .exists().withMessage('number of table is required !')
            .isInt().withMessage('number of table should be a number !')
        ,
        body('capacity')
            .exists().withMessage('capacity of table is required !')
            .isInt().withMessage('capacity of table should be a number !')
        ,
    ],

    validateIDOfParams: [
        param('tableID')
            .exists().withMessage('tableID is required in params !')
            .isMongoId().withMessage("table ID passed in params should be a valid format !")
        ,
    ],

    validateUserID: [
        param('User_id')
            .exists().withMessage('email is required !')
            .isMongoId().withMessage("User ID passed in params should be a valid format !")
        ,
    ],

    validateReservation: [
        // validation of UserID
        body('UserID')
            .exists().withMessage('required User id !')
            .trim().notEmpty().withMessage('User id can\'t be empty !')
            .isMongoId().withMessage('invalid User id format !')
        ,
    ],
}
    
export const validate = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(HttpCode.UNPROCESSABLE_ENTITY).json({ errors: errors.array() })
    }
    next();
}
  