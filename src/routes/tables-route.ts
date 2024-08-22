import { Router } from "express";
import tableControllers from "../controllers/tables-controller";
import { validate, validator } from "../functions/validator";
import { auth } from "../middlewares/authMiddleware";
import roleAdmin from "../middlewares/roleUser";

const table = Router();

// Get all Free Tables 
table.get(
    '/',
    auth.authToken,
    tableControllers.getAllAvailableTable
)

// Get all Tables 
table.get(
    '/all',
    auth.authToken,
    roleAdmin,
    tableControllers.getAllTables
)

// Add new table 
table.post(
    '/',
    auth.authToken,
    roleAdmin,
    validator.validateTable,
    validate,
    tableControllers.addNewTable
)

// Update table
table.put(
    '/:tableID',
    auth.authToken,
    roleAdmin,
    validator.validateIDOfParams,
    validator.validateTable,
    validate,
    tableControllers.updateTable
)

// Delete table
table.delete(
    '/:tableID',
    auth.authToken,
    roleAdmin,
    validator.validateIDOfParams,
    tableControllers.deleteTable
)


export default table;