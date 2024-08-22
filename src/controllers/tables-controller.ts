import { Request, Response } from "express";
import errors from "../functions/sendErrors";
import { HttpCode } from "../core/constants";
import prisma from "../core/config/prisma";



const tableControllers = {
    getAllTables: async(req: Request, res: Response) => {
        try {
            // Select all tables
            const tables = await prisma.table.findMany({
                select: {number: true, capacity: true, state: true}
            });
            if(tables.length === 0) return res.status(HttpCode.OK).json({msg: "no tables registered at the moment !"});

            // Return success message
            res
                .status(HttpCode.OK)
                .json({msg: `List of available tables: `, tables})
        } catch (error) {
            errors.serverError(res, error);
        }
    },

    getAllAvailableTable: async(req: Request, res: Response) => {
        try {
            // Select all availables tables
            const availableTables = await prisma.table.findMany({
                where: {state: "free"},
                select: {number: true, capacity: true}
            })
            if(availableTables.length === 0) return res.status(HttpCode.OK).json({msg: "no tables is free at the moment !"});

            // Return success message
            res
                .status(HttpCode.OK)
                .json({msg: `List of available tables: `, availableTables})
        } catch (error) {
            errors.serverError(res, error);
        }
    },

    addNewTable: async(req: Request, res: Response) => {
        try {
            // Fetch number and capacity from body
            const {number, capacity} = req.body;
            
            // Check if table number ever exist in db
            const existTable = await prisma.table.findFirst({where: {number}});
            if(existTable) return res.status(HttpCode.CONFLICT).json({msg: "this number is ever allow to other table !"});
            
            // create new table in db
            const newtable = await prisma.table.create({data: {number, capacity}})
            if(!newtable) return res.status(HttpCode.BAD_REQUEST).json({msg: "failed to create new table !"});

            // Return success message
            res
                .status(HttpCode.CREATED)
                .json({msg: `Table N:${newtable.number} has been created !`})
        } catch (error) {
            errors.serverError(res, error);
        }
    },

    updateTable: async(req: Request, res: Response) => {
        try {
            // fetch table Id and field to update from params and body
            const {tableID} = req.params;
            const {number, capacity} = req.body;

            // Check if table exist
            if(!tableID) return res.status(HttpCode.BAD_REQUEST).json({msg: "ID of table not found !"});
            const oldTable = await prisma.table.findUnique({where: {table_id: tableID}});
            if(!oldTable) return res.status(HttpCode.BAD_REQUEST).json({msg: "table not found !"});
            
            // // make validation of given data
            // if(!number && !capacity) return res.status(HttpCode.BAD_REQUEST).json({msg: "You should enter data to update !"});
            // if(number && isNaN(number)) return res.status(HttpCode.BAD_REQUEST).json({msg: "number should be a number type !"});
            // if(capacity && isNaN(capacity)) return res.status(HttpCode.BAD_REQUEST).json({msg: "capicity should be a number type !"});

            // Create new table
            const newTable = await prisma.table.update({
                where: {table_id: tableID},
                data: {number, capacity}
            });
            if(!newTable) return res.status(HttpCode.NOT_FOUND).json({msg: `failed to update table: ${tableID}`})

            // Return success message
            res
                .status(HttpCode.OK)
                .json({msg: `table update !`});
        } catch (error) {
            errors.serverError(res, error);
        }
    },

    deleteTable: async(req: Request, res: Response) => {
        try {
            // fetch table Id from params
            const {tableID} = req.params;
            if(!tableID) return res.status(HttpCode.BAD_REQUEST).json({msg: "ID of table not found !"});

            // delete table
            const table = await prisma.table.delete({where: {table_id: tableID}});

            // Return success message
            res
                .status(HttpCode.OK)
                .json({msg: `table N:${table.number} has been deleted successfully !`})
        } catch (error) {
            errors.serverError(res, error);
        }
    },
}

export default tableControllers;