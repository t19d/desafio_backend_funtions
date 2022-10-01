import * as supertest from "supertest";
import {app} from "./index";

const api = supertest(app);

const initialItems = [{
    "name": "Bolsa de basura perfumada c. cierre 30 l. EROSKI, paquete 20 uds",
    "type": "Limpieza",
    "price": 1.80,
    "amount": 18000,
}, {
    "name": "Limpiador ph neutro DON LIMPIO, garrafa 1,3 litros",
    "type": "Limpieza",
    "price": 2.95,
    "amount": 1000,
}, {
    "name": "Quitagrasas maxi KH-7, pistola 900 ml",
    "type": "Limpieza",
    "price": 3.89,
    "amount": 7897,
}, {
    "name": "Croquetas de cocido-jamón serrano LA COCINERA, bolsa 500 g",
    "type": "Congelados",
    "price": 4.55,
    "amount": 791,
}, {
    "name": "Hamburguesa",
    "type": "Alimentación",
    "price": 2.55,
    "amount": 5621,
}];

const initialItemsIds: string[] = [];

describe("DELETE all items", () => {
    test("Se borran todos los elementos", async () => {
        await api.delete("/deleteAllItems").expect(200);
    });
});

describe("POST items", () => {
    test("Añadir 4 item", async () => {
        for (let i = 0; i < initialItems.length; i++) {
            await api.post("/createItem")
                .send(initialItems[i])
                .set("Content-Type", "application/json")
                .set("Accept", "application/json")
                .expect(200)
                .then((res) => {
                    initialItemsIds.push(res.body.id);
                });
        }
    });
});

describe("GET all items", () => {
    test("Hay 4 items", async () => {
        const response = await api.get("/getItems");
        expect(response.body).toHaveLength(initialItems.length);
    });
});

describe("GET item", () => {
    test("Hay un item con 'Quitagrasas maxi KH-7, pistola 900 ml' de nombre", async () => {
        const response = await api.get(`/getItem/${initialItemsIds[2]}`);
        expect(response.body.name).toBe(initialItems[2].name);
    });
    test("Buscar item que no existe", async () => {
        await api.get(`/getItem/${initialItemsIds[4]}${initialItemsIds[2]}${initialItemsIds[0]}`).expect(400);
    });
});

describe("PUT item", () => {
    test("Actualizar el nombre de 'Hamburguesa' a 'Hamburguesa con queso'", async () => {
        const response = await api.put(`/updateItem/${initialItemsIds[4]}`)
            .send({name: "Hamburguesa con queso", type: initialItems[4].type, price: initialItems[4].price, amount: initialItems[4].amount})
            .set("Content-Type", "application/json")
            .set("Accept", "application/json");
        expect(response.body.item.name).toBe("Hamburguesa con queso");
    });

    test("Actualizar item que no existe", async () => {
        await api.put(`/updateItem/${initialItemsIds[4]}${initialItemsIds[2]}${initialItemsIds[0]}`)
            .send({name: "NAME", type: "TYPE", price: 0, amount: 0})
            .set("Content-Type", "application/json")
            .set("Accept", "application/json")
            .expect(400);
    });
});

describe("DELETE item", () => {
    test("Eliminar item", async () => {
        await api.delete(`/deleteItem/${initialItemsIds[4]}`).expect(200);
    });
    test("Eliminar item que no existe", async () => {
        await api.delete(`/deleteItem/${initialItemsIds[4]}${initialItemsIds[2]}${initialItemsIds[0]}`).expect(400);
    });
});
