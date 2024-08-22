import { Request, Response } from "express";
import { HttpCode } from "../core/constants";
import sendMail from "../functions/sendmail";
import prisma from "../core/config/prisma";
import errors from "../functions/sendErrors";
import { comparePassword, hashText } from "../functions/bcrypt-functions";
import userToken from "../functions/jwt-functions";
import { customRequest } from '../middlewares/authMiddleware';
import { envs } from "../core/config/env";


const usersControllers = {
    // function for inscription of user
    inscription: async (req: Request, res: Response) =>{
        try {
            // fetch data from body
            const {name, email, password, status} = req.body;            
            if(!name || !email || !password || !status) return res.status(HttpCode.BAD_REQUEST).json({msg: "All fields are mandatory !"})

            // Check if user ever exist
            const userAlreadyExist = await prisma.user.findUnique({where: {email}})
            if(userAlreadyExist) return res.status(HttpCode.BAD_REQUEST).json({msg: "Email is ever used !"});
            
            const hashPassword = await hashText(password);
            if(!hashPassword) return res.status(HttpCode.BAD_REQUEST).json({msg: "error trying to crypt password !"})

            const newUser = await prisma.user.create({
                data: {
                    name,
                    email,
                    password: hashPassword,
                    status
                }
            });
            if(!newUser) return res.status(HttpCode.NOT_FOUND).json({msg: "Error when creating new user !"});

            sendMail(
                newUser.email, 
                'Welcome to the Best Restaurant',
                {
                    name: newUser.name, 
                    content: "Merci de vous etre Inscrit !"
                }
            )

            // Return success message
            res
                .status(HttpCode.CREATED)
                .json({msg: "registration completed !"})
        } catch (error) {
            return errors.serverError(res, error);
        }
    },

    // function for connexion of user
    connexion: async (req: Request, res: Response) =>{
        try {
            // fetch data from body
            const {email, password} = req.body;            
            if(!email || !password) return res.status(HttpCode.BAD_REQUEST).json({msg: "All fields are mandatory !"})
            
            // check if user exist
            const user = await prisma.user.findUnique({where: {email}});
            if(!user) return res.status(HttpCode.NOT_FOUND).json({msg: "user not exist !"})

            // Check if it's correct password
            const isPassword = await comparePassword(password, user.password);
            if(!isPassword) return res.status(HttpCode.UNAUTHORIZED).json({msg: "incorrect password !"});

            // Save access token and refresh token
            user.password = "";
            
            const accessToken = userToken.accessToken(user);
            const refreshToken = userToken.refreshToken(user);

            res.setHeader('authorization', `Bearer ${accessToken}`);
            res.cookie(
                `${user.email}_key`,
                refreshToken,
                {
                    httpOnly: envs.JWT_COOKIE_HTTPS_TATUS,
                    secure: envs.JWT_COOKIE_SECURITY,
                    maxAge: envs.JWT_COOKIE_DURATION
                }
            );
            
            // Return success message
            res
                .status(HttpCode.OK)
                .json({msg: "user connected !"})
        } catch (error) {
            return errors.serverError(res, error);
        }
    },

    // function for deconnexion of user
    deconnexion: async (req: customRequest, res: Response) =>{
        try {
            // fetch employeID from authentification
            const userID = req.user?.user_id;
            if(!userID) return res.status(HttpCode.UNAUTHORIZED).json({msg: "authentification error !"})

            // Check if user user exist
            const user = await prisma.user.findUnique({where: {user_id: userID}})
            if(!user) return res.status(HttpCode.BAD_REQUEST).json({msg: "user not found !"});

 
            // invalid access and refresh token
            res.setHeader('authorization', `Bearer `);
            res.clearCookie(
                `${user.email}_key`,
                {
                    secure: envs.JWT_COOKIE_HTTPS_TATUS,
                    httpOnly: envs.JWT_COOKIE_HTTPS_TATUS,
                }
            )

            sendMail(
                user.email, 
                'The Best Restaurant',
                {
                    name: user.name, 
                    content: "Vous venez de vous deconnectez de the Best Restaurant; <br> Merci de vous reconnecter bientot !"
                }
            )

            // Return success message
            res
                .status(HttpCode.OK)
                .json({msg: "user disconnected !"})
        } catch (error) {
            return errors.serverError(res, error);
        }
    },
    
    // function to consult users
    consultuser: async (req: customRequest, res: Response) =>{
        try {
            // fetch userID from authentification
            const userID = req.user?.user_id;            
            if(!userID) return res.status(HttpCode.UNAUTHORIZED).json({msg: "authentification error !"})

            // Check if user user exist
            const user = await prisma.user.findUnique({where: {user_id: userID}})
            if(!user) return res.status(HttpCode.BAD_REQUEST).json({msg: "user not found !"});

            const infoUser = {
                name: user.name,
                email: user.email,
            }
            
            // Return success message
            res
                .status(HttpCode.OK)
                .json({msg: infoUser})
        } catch (error) {
            return errors.serverError(res, error);
        }
    },

    // function to update user
    updateUserData: async (req: customRequest, res: Response) =>{
        try {
            // fetch employeID from authentification
            const userID = req.user?.user_id;            
            if(!userID) return res.status(HttpCode.UNAUTHORIZED).json({msg: "authentification error !"})

            // Check if user user exist
            const user = await prisma.user.findUnique({where: {user_id: userID}})
            if(!user) return res.status(HttpCode.BAD_REQUEST).json({msg: "user not found !"});

           // fetch data from body
            const {name, email, password, status} = req.body;            
//! comment faire en sorte que les informations soient verifié indépendamment des autres;

            const hashPassword = await hashText(password);

            const updateuser = await prisma.user.update({
                where: {user_id: userID},
                data: { name, email, password: hashPassword, status },
                select: { name: true, email: true}
            });
            if(!updateuser) return res.status(HttpCode.NOT_FOUND).json({msg: "error when update user !"});

            // Return success message
            res
                .status(HttpCode.CREATED)
                .json({msg: `${user.name} has been modified successfuly. It's become:`, updateuser})
        } catch (error) {
            return errors.serverError(res, error);
        }
    },

    // function to delete user
    deleteUser: async (req: customRequest, res: Response) =>{
        try {
            // fetch employeID from authentification
            const userID = req.user?.user_id;            
            if(!userID) return res.status(HttpCode.UNAUTHORIZED).json({msg: "authentification error !"})

            // Check if user user exist
            const user = await prisma.user.findUnique({where: {user_id: userID}})
            if(!user) return res.status(HttpCode.BAD_REQUEST).json({msg: "user not found !"});
 
            const deleteUser = await prisma.user.delete(
                {where: 
                    {user_id: userID}
                }
            );
            if(!deleteUser) return res.status(HttpCode.NOT_FOUND).json({msg: "error when delete user !"})
            

            // Return success message
            res
                .status(HttpCode.OK)
                .json({msg: `${deleteUser.name} has been delete successfuly!`})
        } catch (error) {
            return errors.serverError(res, error);
        }
    },

    // Function to refresh token
    refreshAccessToken: async(req: Request, res: Response) => {
        // fetch employeID from authentification
        const {userID} = req.params;            
        if(!userID) return res.status(HttpCode.BAD_REQUEST).json({msg: "user ID not found !"})

        // Check if user user exist
        const user = await prisma.user.findUnique({where: {user_id: userID}})
        if(!user) return res.status(HttpCode.BAD_REQUEST).json({msg: "user not found !"});


        // Fetch refresh token of user from cookie
        const refreshToken = req.cookies[`${user.email}_key`]; 
        if(!refreshToken) return res.status(HttpCode.UNAUTHORIZED).json({msg: 'failed to fetch refreshtoken !'});
        
        // Decode refresh token
        const userData = userToken.verifyRefreshToken(refreshToken);
        if(!userData) return res.status(HttpCode.UNAUTHORIZED).json({msg: "invalid refresh token!" });
        userData.password = "";

        // Creating a new access an a nex refresh token
        const newAccessToken = userToken.accessToken(userData) 
        const newRefreshToken = userToken.refreshToken(userData)

        res.setHeader('authorization', `Bearer ${newAccessToken}`);
        res.cookie(
            `${user.email}_key`,
            newRefreshToken,
            {
                httpOnly: envs.JWT_COOKIE_HTTPS_TATUS,
                secure: envs.JWT_COOKIE_SECURITY,
                maxAge: envs.JWT_COOKIE_DURATION
            }
        );
    }
}
export default usersControllers;
