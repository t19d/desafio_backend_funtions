/* eslint-disable @typescript-eslint/no-explicit-any */
import * as functions from "firebase-functions";
import * as express from "express";
import * as admin from "firebase-admin";

/**
 * -----------------------------------------------------------------------------
 * --------------------------------- INTERFACE ---------------------------------
 * -----------------------------------------------------------------------------
 */
/**
 * Interface for Item object
 *
 * @interface Item
 * @member {string} name    What is the name of the item
 * @member {string} type    What type is the item
 * @member {number} price   How much does the item cost
 * @member {number} price   The available quantity of the item
 */
interface Item {
    name: string;
    type: string;
    price: number;
    amount: number;
}


/**
 * -----------------------------------------------------------------------------
 * --------------------------------- RESPONSES ---------------------------------
 * -----------------------------------------------------------------------------
 */
/** */
const RESPONSE_ERROR = "Ups... Something went wrong! 😟";
const RESPONSE_HINT = "Check the item object => {name: STRING, type: STRING, price: NUMBER, amount: NUMBER}";
const RESPONSE_NOT_FOUND = "Ups... This route doesn't exist 😯";
const RESPONSE_ITEM_NOT_FOUND = "This item doesn't exist in the database 😅";
const RESPONSE_CREATE_SUCCESS = "Successfully created 😄!";
const RESPONSE_UPDATE_SUCCESS = "Successfully updated 🙂!";
const RESPONSE_DELETE_SUCCESS = "Successfully deleted 😶‍🌫️!";


/**
 * -----------------------------------------------------------------------------
 * ------------------------- CONFIG AND INITIALIZATION -------------------------
 * -----------------------------------------------------------------------------
 */
export const app = express();
// admin.initializeApp();
// eslint-disable-next-line @typescript-eslint/no-var-requires
const serviceAccount = require("../serviceAccountCredentials.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

/**
 * -----------------------------------------------------------------------------
 * ----------------------------------- UTILS -----------------------------------
 * -----------------------------------------------------------------------------
 */
/**
 * Check if the Body has the proper properties to be an object with the Item interface
 * @param {any} body    Request Body
 * @throw               Invalid Item format
 */
function isBodyItem(body: any) {
    try {
        if (typeof (body.name) !== "string" || typeof (body.type) !== "string" || typeof (body.price) !== "number" || typeof (body.amount) !== "number") throw new Error("Invalid Item format");
    } catch (e) {
        throw new Error("Invalid Item format");
    }
}

/**
 * -----------------------------------------------------------------------------
 * -------------------------------- APPLICATION --------------------------------
 * -----------------------------------------------------------------------------
 */
/**
 * Get all items from the database
 * @return {Array<Item>}    Database items
 */
app.get("/getItems", async (req, res) => {
    try {
        // Get all items from "items"
        const itemsRef = db.collection("items");
        const snapshot = await itemsRef.get();
        const docs = snapshot.docs;

        // Response mapping
        const response = docs.map((doc) => ({
            id: doc.id,
            name: doc.data().name,
            type: doc.data().type,
            price: doc.data().price,
            amount: doc.data().amount,
        }));

        // ✅ RETURN OK response
        return res.status(200).json(response);
    } catch (error) {
        // ❌ RETURN ERROR response
        return res.status(500).json({res: RESPONSE_ERROR, error});
    }
});


/**
 * Get the item from the database by ID
 * @param {string} item_id  ID of the item which will be searched in the database
 * @return {Item}           Database item
 */
app.get("/getItem/:item_id", async (req, res) => {
    try {
        // Get item from "items"
        const itemRef = db.collection("items").doc(req.params.item_id);
        const snapshot = await itemRef.get();
        const response = snapshot.data();

        // ⚠️ RETURN 404 if ID doesn't exist
        if (!response) return res.status(404).send({res: RESPONSE_ITEM_NOT_FOUND, id: req.params.item_id});

        // ✅ RETURN OK response
        return res.status(200).send(response);
    } catch (error) {
        // ❌ RETURN ERROR response
        return res.status(500).json({res: RESPONSE_ERROR, error});
    }
});


/**
 * Create a new item in the database
 * @return  Response message and the ID of the new element created
 */
app.post("/createItem", async (req, res) => {
    try {
        // Check the body
        isBodyItem(req.body);

        // New ID after adding a new item
        let newId;
        // New item
        const newItem: Item = {
            name: req.body.name.toString(),
            type: req.body.type.toString(),
            price: parseFloat(req.body.price),
            amount: parseInt(req.body.amount),
        };

        // Add newItem to the collection
        await db.collection("items").add({...newItem})
            .then(function(docRef) {
                newId = docRef.id;
            });

        // ✅ RETURN OK response
        return res.status(200).json({res: RESPONSE_CREATE_SUCCESS, id: newId});
    } catch (error) {
        // ❌ RETURN ERROR response
        return res.status(500).json({res: RESPONSE_ERROR, hint: RESPONSE_HINT, error});
    }
});


/**
 * Update an existing item in the database
 * @param {string} item_id  ID of the item which will be updated in the database
 * @return                  Response message, the ID of the element updated and the item updated
 */
app.put("/updateItem/:item_id", async (req, res) => {
    try {
        // Check the body
        isBodyItem(req.body);

        // Updated item
        const updatedItem: Item = {
            name: req.body.name.toString(),
            type: req.body.type.toString(),
            price: parseFloat(req.body.price),
            amount: parseInt(req.body.amount),
        };

        // Get item from "items"
        const itemRef = db.collection("items").doc(req.params.item_id);
        // Update item
        await itemRef.update({...updatedItem});

        // ✅ RETURN OK response
        return res.status(200).json({res: RESPONSE_UPDATE_SUCCESS, id: itemRef.id, item: updatedItem});
    } catch (error) {
        // ❌ RETURN ERROR response
        return res.status(500).json({res: RESPONSE_ERROR, hint: RESPONSE_HINT, error});
    }
});


/**
 * Delete an existing item in the database
 * @param {string} item_id  ID of the item which will be deleted in the database
 * @return                  Response message and the ID of the element deleted
 */
app.delete("/deleteItem/:item_id", async (req, res) => {
    try {
        // Get item from "items"
        const itemRef = db.collection("items").doc(req.params.item_id);

        // Delete item
        await itemRef.delete();

        // ✅ RETURN OK response
        return res.status(200).json({res: RESPONSE_DELETE_SUCCESS, id: req.params.item_id});
    } catch (error) {
        // ❌ RETURN ERROR response
        return res.status(500).json({res: RESPONSE_ERROR, error});
    }
});


/**
 * Delete all items in the database
 * @return  Ok message
 */
app.delete("/deleteAllItems", async (req, res) => {
    try {
        // Get all items from "items" and delete
        db.collection("items").listDocuments().then((doc) => {
            doc.map((item) => {
                // Delete item
                item.delete();
            });
        });

        // ✅ RETURN OK response
        return res.status(200).json({res: RESPONSE_DELETE_SUCCESS});
    } catch (error) {
        // ❌ RETURN ERROR response
        return res.status(500).json({res: RESPONSE_ERROR, error});
    }
});

/**
 * GET - The 404 Route
 */
app.get("*", function(req, res) {
    return res.status(404).send({res: RESPONSE_NOT_FOUND});
});

/**
 * POST - The 404 Route
 */
app.post("*", function(req, res) {
    return res.status(404).send({res: RESPONSE_NOT_FOUND});
});

/**
 * PUT - The 404 Route
 */
app.put("*", function(req, res) {
    return res.status(404).send({res: RESPONSE_NOT_FOUND});
});

/**
 * DELETE - The 404 Route
 */
app.delete("*", function(req, res) {
    return res.status(404).send({res: RESPONSE_NOT_FOUND});
});


exports.app = functions.https.onRequest(app);
