import db from ".";

import { validate as uuidval } from "uuid";

import fs from "fs";
import path from "path";

const test_table = "TESTING_TABLE_90345784633463";

describe("DB Tests", () => {

    it("Responds with error on disconnected db", async () => {

        try {
            await db.sql( `select a, b from ${db.table_prefix()}${test_table}`);
            fail("Should have thrown");
        } catch (error) {
            expect(error.message).toMatch("Database default is not connected");
        }
    });

    it("Returns an error on incorrect SQL syntax", async () => {

        try {
            await db.connect("test");
            await db.sql("Bad SQL");
            fail("Should have thrown");
        } catch (error) {
            expect(error.message).toEqual(expect.any(String));
            expect(error.message).toMatch("syntax error at or near \"Bad\" SQL: Bad SQL BIND: []");
            expect(error.code).toEqual(expect.any(String));
            expect(error.code).toMatch("42601");
            expect(error.severity).toEqual(expect.any(String));
            expect(error.severity).toMatch("ERROR");
        }
    });

    it("Creates test table and returns standard object", async () => {

        const response = await db.sql({
            sql: `create table if not exists ${db.table_prefix()}${test_table}  (
                id integer GENERATED BY DEFAULT AS IDENTITY (START WITH 200 INCREMENT BY 1),
                a integer GENERATED BY DEFAULT AS IDENTITY (START WITH 100 INCREMENT BY 1),
                b varchar(100),
                c timestamp
            )`
        });

        
        expect(response).toHaveLength(0);
        
    });

    it("Inserts into test table", async () => {
        const response1 = await db.sql(
            `insert into ${db.table_prefix()}${test_table} (a, b) values (:a, :b)`,
            [999, "Test Data"]
        );

        expect(response1).toEqual(expect.any(Array));
        expect(response1).toHaveLength(0);

        const response2 = await db.sql(
            `insert into ${db.table_prefix()}${test_table} (a, b) values (:a, :b)`,
            [1000, "Test Data 2"]
        );

        expect(response2).toEqual(expect.any(Array));
        expect(response2).toHaveLength(0);
    });

    it("Selects from test table", async () => {
        const response = await db.sql(
            `select a, b from ${db.table_prefix()}${test_table}`
        );

        
        expect(response.length).toEqual(2);
        
        expect(response[0].a).toEqual(999);
        expect(response[0].b).toMatch("Test Data");
        
        expect(response[1].a).toEqual(1000);
        expect(response[1].b).toMatch("Test Data 2");
    });

    it("Selects from test table using where", async () => {
        const response = await db.sql(
            `select a, b from ${db.table_prefix()}${test_table} where a = :a`,
            999
        );

        
        expect(response.length).toEqual(1);
        
        expect(response[0].a).toEqual(999);
        expect(response[0].b).toMatch("Test Data");
    });

    it("Selects from test table using where and params has array", async () => {
        const response = await db.sql([
            `select a, b from ${db.table_prefix()}${test_table} where a = :a`,
            999
        ]);

        
        expect(response.length).toEqual(1);
        
        expect(response[0].a).toEqual(999);
        expect(response[0].b).toMatch("Test Data");
    });

    it("Selects from test table using sql from file", async () => {

        const file = path.resolve(__dirname, "../../dba/sql/tests/test.sql");

        fs.writeFileSync(file, `select a, b from ${db.table_prefix()}${test_table} where a = :a`); 

        const sql = await db.file("tests/test.sql");

        const response = await db.sql({
            sql,
            bind: 999
        });

        
        expect(response.length).toEqual(1);
        
        expect(response[0].a).toEqual(999);
        expect(response[0].b).toMatch("Test Data");
    });

    it("Returns an error for invalid parameters", async () => {

        try {
            await db.sql(null);

            fail("Should have thrown");
        } catch (error) {
            expect(error.message).toEqual(expect.any(String));
            expect(error.message).toMatch("Invalid parameters for DB query");
        }
    });

    it("Returns an error for invalid database name", async () => {

        try {
            await db.sql({sql: "select * from table", db_name: "this_database_does_not_exist"});

            fail("Should have thrown");
        } catch (error) {
            expect(error.message).toEqual(expect.any(String));
            expect(error.message).toMatch("Database this_database_does_not_exist is not connected");
        }
    });


    it("Deletes from test table using where", async () => {
        const response = await db.dml({
            sql: `delete from ${db.table_prefix()}${test_table} where a = :a`,
            bind: 1000
        });

        expect(response).toHaveProperty("rows", 1);

    });

    it("Selects from test table non existent row", async () => {
        const response = await db.sql(
            `select a, b from ${db.table_prefix()}${test_table} where a = :a`,
            1000
        );

        
        expect(response.length).toEqual(0);
    });

    it("Selects (R) from test table non existent row", async () => {
        const response = await db.sqlr(
            `select a, b from ${db.table_prefix()}${test_table} where a = :a`,
            1000
        );

        expect(response).toBeNull;
    });

    it("Selects (V) from test table non existent row", async () => {
        const response = await db.sqlv(
            `select a, b from ${db.table_prefix()}${test_table} where a = :a`,
            1000
        );

        expect(response).toBeNull;
    });

    it("Selects (R) from test table existent row", async () => {
        const response = await db.sqlr(
            `select a, b from ${db.table_prefix()}${test_table} where a = :a`,
            999
        );

        expect(response).not.toBeNull;
        expect(response!.a).toEqual(999);
        expect(response!.b).toMatch("Test Data");
    });

    it("Selects (V) from test table existent row (number)", async () => {
        const response = await db.sqlv(
            `select a from ${db.table_prefix()}${test_table} where a = :a`,
            999
        );

        expect(response).not.toBeNull;
        
        expect(response).toEqual(999);
    });

    it("Selects (V) from test table existent row (string)", async () => {
        const response = await db.sqlv(
            `select b from ${db.table_prefix()}${test_table} where a = :a`,
            999
        );

        expect(response).not.toBeNull;
        expect(response).toEqual(expect.any(String));
        expect(response).toMatch("Test Data");
    });

    it("Selects (V) from test table existent row (null)", async () => {
        const response = await db.sqlv(
            `select null from ${db.table_prefix()}${test_table} where a = :a`,
            999
        );

        expect(response).toBeNull;
    });

    it("Deletes from test table without where", async () => {
        const response = await db.dml({ sql:`delete from ${db.table_prefix()}${test_table}`, info: true });

        expect(response).toHaveProperty("rows", 1);

    });

    it("Inserts into test table using SQL functions", async () => {
        const response1 = await db.insert({
            table: test_table,
            values: {
                a: 1001,
                b: "Test Data F1"
            }
        });

        expect(response1).toHaveProperty("rows", 1);

        const response2 = await db.insert({
            table: test_table,
            values: {
                a: 1002,
                b: "Test Data F2"
            }
        });

        expect(response2).toHaveProperty("rows", 1);

    });

    it("Selects from test table using SQL functions ordered first column asc", async () => {
        const response = await db.select({
            table: test_table,
            columns: ["a", "b"],
            order_by: {
                "a": "asc"
            }
        });

        expect(response.length).toEqual(2);
        
        expect(response[0].a).toEqual(1001);
        expect(response[0].b).toMatch("Test Data F1");
        
        expect(response[1].a).toEqual(1002);
        expect(response[1].b).toMatch("Test Data F2");
    });

    it("Selects from test table using SQL functions ordered first column desc", async () => {
        const response = await db.select({
            table: test_table,
            columns: ["a", "b"],
            order_by: {
                "a": "desc"
            }
        });

        expect(response.length).toEqual(2);
        
        expect(response[0].a).toEqual(1002);
        expect(response[0].b).toMatch("Test Data F2");
        
        expect(response[1].a).toEqual(1001);
        expect(response[1].b).toMatch("Test Data F1");
    });

    it("Selects from test table using SQL functions ordered second column asc", async () => {
        const response = await db.select({
            table: test_table,
            columns: ["a", "b"],
            order_by: {
                "b": "asc",
                "a": "works_anyway_defaults_to_asc"
            }
        });

        expect(response.length).toEqual(2);
        
        expect(response[0].a).toEqual(1001);
        expect(response[0].b).toMatch("Test Data F1");
        
        expect(response[1].a).toEqual(1002);
        expect(response[1].b).toMatch("Test Data F2");
    });

    it("Selects from test table using SQL functions ordered both columns using array", async () => {
        const response = await db.select({
            table: test_table,
            columns: ["a", "b"],
            order_by: [1, 2]
        });
        
        expect(response.length).toEqual(2);
        
        expect(response[0].a).toEqual(1001);
        expect(response[0].b).toMatch("Test Data F1");
        
        expect(response[1].a).toEqual(1002);
        expect(response[1].b).toMatch("Test Data F2");
    });

    it("Selects from test table using SQL functions ordered both columns using number", async () => {
        const response = await db.select({
            table: test_table,
            columns: ["a", "b"],
            order_by: 1
        });

        
        
        expect(response.length).toEqual(2);
        
        expect(response[0].a).toEqual(1001);
        expect(response[0].b).toMatch("Test Data F1");
        
        expect(response[1].a).toEqual(1002);
        expect(response[1].b).toMatch("Test Data F2");
    });

    it("Selects from test table using SQL functions ordered both columns using string", async () => {
        const response = await db.select({
            table: test_table,
            columns: ["a", "b"],
            order_by: "a"
        });

        
        
        expect(response.length).toEqual(2);
        
        expect(response[0].a).toEqual(1001);
        expect(response[0].b).toMatch("Test Data F1");
        
        expect(response[1].a).toEqual(1002);
        expect(response[1].b).toMatch("Test Data F2");
    });

    it("Selects from test table using SQL functions ordered second column desc", async () => {
        const response = await db.select({
            table: test_table,
            columns: ["a", "b"],
            order_by: {
                "b": "desc",
                "a": "asc"
            }
        });

        
        
        expect(response.length).toEqual(2);
        
        expect(response[0].a).toEqual(1002);
        expect(response[0].b).toMatch("Test Data F2");
        
        expect(response[1].a).toEqual(1001);
        expect(response[1].b).toMatch("Test Data F1");
    });

    it("Selects from test table using where using SQL functions", async () => {
        const response = await db.select({
            table: test_table,
            columns: ["a", "b"],
            where: {
                a: 1001
            }
        });

        
        
        expect(response.length).toEqual(1);
        
        expect(response[0].a).toEqual(1001);
        expect(response[0].b).toMatch("Test Data F1");
    });

    it("Selects from test table using where using SQL functions, value", async () => {
        const response = await db.selectv({
            table: test_table,
            columns: ["a"],
            where: {
                a: 1001
            }
        });
        
        expect(response).toEqual(1001);
    });

    it("Selects from test table using where using SQL functions, row", async () => {
        const response = await db.selectr({
            table: test_table,
            columns: ["a", "b"],
            where: {
                a: 1001
            }
        });
        
        expect(response!.a).toEqual(1001);
        expect(response!.b).toMatch("Test Data F1");
    });

    it("Selects from test table using where second column array using SQL functions", async () => {
        const response = await db.select({
            table: test_table,
            columns: ["b"],
            where: {
                a: 1001
            }
        });
        
        expect(response.length).toEqual(1);
        
        expect(response[0].a).toBeUndefined();
        expect(response[0].b).toMatch("Test Data F1");
    });

    it("Selects from test table using where second column string using SQL functions", async () => {
        const response = await db.select({
            table: test_table,
            columns: "b",
            where: {
                a: 1001
            }
        });

        
        
        expect(response.length).toEqual(1);
        
        expect(response[0].a).toBeUndefined();
        expect(response[0].b).toMatch("Test Data F1");
    });

    it("Selects from test table using where second two columns string using SQL functions", async () => {
        const response = await db.select({
            table: test_table,
            columns: "b, a",
            where: {
                a: 1001
            }
        });

        
        
        expect(response.length).toEqual(1);
        
        expect(response[0].a).toEqual(1001);
        expect(response[0].b).toMatch("Test Data F1");
    });

    it("Selects from test table using where as an array using SQL functions", async () => {
        const response = await db.select({
            table: test_table,
            columns: "b, a",
            where: ["a", 1001]
        });

        
        
        expect(response.length).toEqual(1);
        
        expect(response[0].a).toEqual(1001);
        expect(response[0].b).toMatch("Test Data F1");
    });

    it("Selects from test table using where as an integer using SQL functions", async () => {
        const response = await db.select({
            table: test_table,
            columns: "b, a",
            where: 202
        });

        
        
        expect(response.length).toEqual(1);
        
        expect(response[0].a).toEqual(1001);
        expect(response[0].b).toMatch("Test Data F1");
    });

    it("Updates test table using SQL functions", async () => {
        const response = await db.update({
            table: test_table,
            values: {
                b: "Test Data F1 Updated"
            },
            where: {
                a: 1001
            }
        });
        
        expect(response.rows).toEqual(1);
    });

    it("Selects updated data from test table using SQL functions", async () => {
        const response = await db.select({
            table: test_table,
            columns: "b",
            where: {
                a: 1001
            }
        });

        expect(response.length).toEqual(1);
        
        expect(response[0].b).toMatch("Test Data F1 Updated");
    });

    it("Deletes from test table using SQL functions", async () => {
        const response = await db.delete({
            table: test_table,
            where: {
                a: 1002
            }
        });

        expect(response.rows).toEqual(1);
    });

    it("Selects from test table non existent row using SQL functions", async () => {
        const response = await db.select({
            table: test_table,
            where: {
                a: -1
            }
        });
        
        expect(response).toHaveLength(0);
    });


    it("Deletes from test table without where", async () => {
        const response = await db.dml(`delete from ${db.table_prefix()}${test_table}`);
        
        expect(response).toHaveProperty("rows", 1);
    });

    it("Inserts into test table returning identity using SQL functions", async () => {
        const response = await db.insert({
            table: test_table,
            values: {
                a: 1003,
                b: "Identity Test"
            },
            identity: "a"
        });
        
        expect(response.rows).toEqual(1);
        expect(response.identity).toEqual(1003);
    });

    it("Inserts into test table returning implicit identity using SQL functions", async () => {
        const response = await db.insert({
            table: test_table,
            values: {
                b: "Identity Test 2"
            },
            identity: "a"
        });
        
        expect(response.rows).toEqual(1);
        expect(response.identity).toEqual(100); // Check how table was created to find out why this number
    });

    it("Inserts into test table returning implicit identity using SQL functions", async () => {
        const response = await db.insert({
            table: test_table,
            values: {
                b: "Identity Test 3",
                c: new Date().toISOString()
            },
            identity: true
        });

        expect(response.rows).toEqual(1);
        expect(response.identity).toEqual(206); // Check how table was created to find out why this number
    });

    it("Gets sequence numbers using SQL functions", async () => {
        const response1 = await db.sequence();
        const response2 = await db.sequence();

        expect(response2).toEqual(response1 + 1);
    });

    it("Drops test table and returns standard object", async () => {
        const response = await db.sql(`drop table ${db.table_prefix()}${test_table}`);
        
        expect(response).toHaveLength(0);

    });

    it("Gets and checks UUID string from DB object", async () => {
        const response = db.uuid();

        expect(uuidval(response)).toEqual(true);
    });

});

afterAll(async (done) => {
    await db.disconnect("test");
    done();
});

