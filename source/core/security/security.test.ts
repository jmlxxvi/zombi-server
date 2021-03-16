import config from "../config";
import security from ".";

describe("SECURITY Tests", () => {

    it("Returns error on request validation - 1", async () => {
        try {
            const request = {};

            security.validate_request(request);

            fail("Should have thrown");
        } catch (error) {
            
            expect(error.message).not.toBeNull();
            expect(error.message).toMatch("JSON schema validation error: data should have required property 'mod'");
        }
    });

    it("Returns error on request validation - 2", async () => {
        try {
            const request = {
                "mod": "module"
            };

            security.validate_request(request);

            fail("Should have thrown");
        } catch (error) {
            
            expect(error.message).not.toBeNull();
            expect(error.message).toEqual(expect.any(String));
            expect(error.message).toMatch("JSON schema validation error: data should have required property 'fun'");
        }
    });

    it("Returns error on request validation - 4", async () => {
        try {
            const request = {
                "mod": "module",
                "fun": "function",
                "other": 999
            };

            security.validate_request(request);

            fail("Should have thrown");
        } catch (error) {
            
            expect(error.message).not.toBeNull();
            expect(error.message).toEqual(expect.any(String));
            expect(error.message).toMatch("JSON schema validation error: data should NOT have additional properties");
        }
    });

    it("Returns error on request validation - 5", async () => {
        try {
            const request = {
                "mod": 1000,
                "fun": "function"
            };

            security.validate_request(request);

            fail("Should have thrown");
        } catch (error) {
            
            expect(error.message).not.toBeNull();
            expect(error.message).toEqual(expect.any(String));
            expect(error.message).toMatch("JSON schema validation error: data.mod should be string");
        }
    });

    it("Returns error on request validation - 6", async () => {
        try {
            const request = {
                "mod": "module$",
                "fun": "function"
            };

            security.validate_request(request);

            fail("Should have thrown");
        } catch (error) {
            
            expect(error.message).not.toBeNull();
            expect(error.message).toEqual(expect.any(String));
            expect(error.message).toMatch("JSON schema validation error: data.mod should match pattern \"^[a-zA-Z0-9-_/]+$\"");
        }
    });

    it("Returns error on request validation - 7", async () => {
        try {
            const request = {
                "mod": "module/../wed",
                "fun": "function"
            };

            security.validate_request(request);

            fail("Should have thrown");
        } catch (error) {
            
            expect(error.message).not.toBeNull();
            expect(error.message).toEqual(expect.any(String));
            expect(error.message).toMatch("JSON schema validation error: data.mod should match pattern \"^[a-zA-Z0-9-_/]+$\"");
        }
    });

    it("Returns error on request validation - 8", async () => {
        try {
            const request = {
                "mod": "",
                "fun": "function"
            };

            security.validate_request(request);

            fail("Should have thrown");
        } catch (error) {
            
            expect(error.message).not.toBeNull();
            expect(error.message).toEqual(expect.any(String));
            expect(error.message).toMatch("JSON schema validation error: data.mod should NOT be shorter than 1 characters");
        }
    });

    it("Returns error on request validation - 9", async () => {
        try {
            const request = {
                "mod": null,
                "fun": "function"
            };

            security.validate_request(request);

            fail("Should have thrown");
        } catch (error) {
            
            expect(error.message).not.toBeNull();
            expect(error.message).toEqual(expect.any(String));
            expect(error.message).toMatch("JSON schema validation error: data.mod should be string");
        }
    });

    it("Returns error on request validation - 10", async () => {
        try {
            const request = {
                "mod": undefined,
                "fun": "function"
            };

            security.validate_request(request);

            fail("Should have thrown");
        } catch (error) {
            
            expect(error.message).not.toBeNull();
            expect(error.message).toEqual(expect.any(String));
            expect(error.message).toMatch("JSON schema validation error: data should have required property 'mod'");
        }
    });

    it("Returns error on request validation - 11", async () => {
        try {
            const request = {
                "mod": "module",
                "fun": 1000
            };

            security.validate_request(request);

            fail("Should have thrown");
        } catch (error) {
            
            expect(error.message).not.toBeNull();
            expect(error.message).toEqual(expect.any(String));
            expect(error.message).toMatch("JSON schema validation error: data.fun should be string");
        }
    });

    it("Returns error on request validation - 12", async () => {
        try {
            const request = {
                "mod": "module",
                "fun": null
            };

            security.validate_request(request);

            fail("Should have thrown");
        } catch (error) {
            
            expect(error.message).not.toBeNull();
            expect(error.message).toEqual(expect.any(String));
            expect(error.message).toMatch("JSON schema validation error: data.fun should be string");
        }
    });

    it("Returns error on request validation - 13", async () => {
        try {
            const request = {
                "mod": "module",
                "fun": undefined
            };

            security.validate_request(request);

            fail("Should have thrown");
        } catch (error) {
            
            expect(error.message).not.toBeNull();
            expect(error.message).toEqual(expect.any(String));
            expect(error.message).toMatch("JSON schema validation error: data should have required property 'fun'");
        }
    });

    it("Returns error on request validation - 15", async () => {
        try {
            const request = {
                "token": null,
                "mod": "module",
                "fun": "function"
            };

            security.validate_request(request);

            fail("Should have thrown");
        } catch (error) {
            
            expect(error.message).not.toBeNull();
            expect(error.message).toEqual(expect.any(String));
            expect(error.message).toMatch("JSON schema validation error: data.token should be string");
        }
    });

    it("Returns valid request validation - 1", async () => {
        const request = {
            "mod": "module",
            "fun": "function"
        };

        const validated = security.validate_request(request);

        expect(validated).toBeTruthy();
        expect(validated).toEqual(expect.any(Boolean));
    });

    it("Returns valid request validation - 2", async () => {
        const request = {
            "token": Array((config.security.token_size * 2) + 1).join("X"),
            "mod": "module",
            "fun": "function"
        };

        const validated = security.validate_request(request);

        expect(validated).toBeTruthy();
        expect(validated).toEqual(expect.any(Boolean));
    });

    it("Returns valid request validation - 3", async () => {
        const request = {
            "mod": "module/submodule",
            "fun": "function"
        };

        const validated = security.validate_request(request);

        expect(validated).toBeTruthy();
        expect(validated).toEqual(expect.any(Boolean));
    });

    it("Returns valid request validation - 4", async () => {
        const request = {
            "mod": "mod_ule/sub-module",
            "fun": "function"
        };

        const validated = security.validate_request(request);

        expect(validated).toBeTruthy();
        expect(validated).toEqual(expect.any(Boolean));
    });

    it("Returns error on response validation - 1", async () => {
        try {
            const request = null;

            security.validate_response(request);

            fail("Should have thrown");
        } catch (error) {
            
            expect(error.message).not.toBeNull();
            expect(error.message).toEqual(expect.any(String));
            expect(error.message).toMatch("JSON schema validation error: data should be object");
        }
    });

    it("Returns error on response validation - 2", async () => {
        try {
            const request = {};

            security.validate_response(request);

            fail("Should have thrown");
        } catch (error) {
            
            expect(error.message).not.toBeNull();
            expect(error.message).toEqual(expect.any(String));
            expect(error.message).toMatch("JSON schema validation error: data should have required property 'error'");
        }
    });

    it("Returns error on response validation - 3", async () => {
        try {
            const request = {
                "error": true
            };

            security.validate_response(request);

            fail("Should have thrown");
        } catch (error) {
            
            expect(error.message).not.toBeNull();
            expect(error.message).toEqual(expect.any(String));
            expect(error.message).toMatch("JSON schema validation error: data should have required property 'code'");
        }
    });

    it("Returns error on response validation - 4", async () => {
        try {
            const request = {
                "error": 1000
            };

            security.validate_response(request);

            fail("Should have thrown");
        } catch (error) {
            
            expect(error.message).not.toBeNull();
            expect(error.message).toEqual(expect.any(String));
            expect(error.message).toMatch("JSON schema validation error: data.error should be boolean");
        }
    });

    it("Returns error on response validation - 5", async () => {
        try {
            const request = {
                "error": null
            };

            security.validate_response(request);

            fail("Should have thrown");
        } catch (error) {
            
            expect(error.message).not.toBeNull();
            expect(error.message).toEqual(expect.any(String));
            expect(error.message).toMatch("JSON schema validation error: data.error should be boolean");
        }
    });

    it("Returns error on response validation - 6", async () => {
        try {
            const request = {
                "error": undefined
            };

            security.validate_response(request);

            fail("Should have thrown");
        } catch (error) {
            
            expect(error.message).not.toBeNull();
            expect(error.message).toEqual(expect.any(String));
            expect(error.message).toMatch("JSON schema validation error: data should have required property 'error'");
        }
    });

    it("Returns error on response validation - 7", async () => {
        try {
            const request = {
                "error": true,
                "message": "all good so far"
            };

            security.validate_response(request);

            fail("Should have thrown");
        } catch (error) {
            
            expect(error.message).not.toBeNull();
            expect(error.message).toEqual(expect.any(String));
            expect(error.message).toMatch("JSON schema validation error: data should have required property 'code'");
        }
    });

    it("Returns error on response validation - 8", async () => {
        try {
            const request = {
                "error": true,
                "message": 1200
            };

            security.validate_response(request);

            fail("Should have thrown");
        } catch (error) {
            
            expect(error.message).not.toBeNull();
            expect(error.message).toEqual(expect.any(String));
            expect(error.message).toMatch("JSON schema validation error: data.message should be string");
        }
    });

    it("Returns error on response validation - 9", async () => {
        try {
            const request = {
                "error": true,
                "message": null
            };

            security.validate_response(request);

            fail("Should have thrown");
        } catch (error) {
            
            expect(error.message).not.toBeNull();
            expect(error.message).toEqual(expect.any(String));
            expect(error.message).toMatch("JSON schema validation error: data.message should be string");
        }
    });

    it("Returns error on response validation - 10", async () => {
        try {
            const request = {
                "error": true,
                "message": ""
            };

            security.validate_response(request);

            fail("Should have thrown");
        } catch (error) {
            
            expect(error.message).not.toBeNull();
            expect(error.message).toEqual(expect.any(String));
            expect(error.message).toMatch("JSON schema validation error: data.message should match pattern \"^[a-zA-Z0-9-_/ :.,]+$\"");
        }
    });

    it("Returns error on response validation - 11", async () => {
        try {
            const request = {
                "error": true,
                "code": null
            };

            security.validate_response(request);

            fail("Should have thrown");
        } catch (error) {
            
            expect(error.message).not.toBeNull();
            expect(error.message).toEqual(expect.any(String));
            expect(error.message).toMatch("JSON schema validation error: data.code should be number");
        }
    });

    it("Returns error on response validation - 12", async () => {
        try {
            const request = {
                "error": true,
                "code": "nonnumber"
            };

            security.validate_response(request);

            fail("Should have thrown");
        } catch (error) {
            
            expect(error.message).not.toBeNull();
            expect(error.message).toEqual(expect.any(String));
            expect(error.message).toMatch("JSON schema validation error: data.code should be number");
        }
    });

    it("Returns error on response validation - 13", async () => {
        try {
            const request = {
                "error": true,
                "code": undefined
            };

            security.validate_response(request);

            fail("Should have thrown");
        } catch (error) {
            
            expect(error.message).not.toBeNull();
            expect(error.message).toEqual(expect.any(String));
            expect(error.message).toMatch("JSON schema validation error: data should have required property 'code'");
        }
    });

    it("Returns error on response validation - 14", async () => {
        try {
            const request = {
                "error": true,
                "code": 1
            };

            security.validate_response(request);

            fail("Should have thrown");
        } catch (error) {
            
            expect(error.message).not.toBeNull();
            expect(error.message).toEqual(expect.any(String));
            expect(error.message).toMatch("JSON schema validation error: data should have required property 'data'");
        }
    });

    it("Returns error on response validation - 15", async () => {
        try {
            const request = {
                "error": true,
                "code": 1,
                "data": undefined
            };

            security.validate_response(request);

            fail("Should have thrown");
        } catch (error) {
            
            expect(error.message).not.toBeNull();
            expect(error.message).toEqual(expect.any(String));
            expect(error.message).toMatch("JSON schema validation error: data should have required property 'data'");
        }
    });


    it("Returns valid response validation - 1", async () => {
        const request = {
            "error": true,
            "code": 1,
            "data": null
        };

        const validated = security.validate_response(request);

        expect(validated).toBeTruthy();
        expect(validated).toEqual(expect.any(Boolean));
    });

    it("Returns valid response validation - 2", async () => {
        const request = {
            "error": true,
            "code": -1,
            "data": [1, 2, 3, "four"]
        };

        const validated = security.validate_response(request);

        expect(validated).toBeTruthy();
        expect(validated).toEqual(expect.any(Boolean));
    });

    it("Returns valid response validation - 3", async () => {
        const request = {
            "error": false,
            "code": 0,
            "data": {"an": "object"}
        };

        const validated = security.validate_response(request);

        expect(validated).toBeTruthy();
        expect(validated).toEqual(expect.any(Boolean));
    });

    it("Checks if encrypted password is in a valid format and matches with unencrypted", async () => {

        const unencrypted_password = "mypassword";

        const encrypted_password = await security.password_hash(unencrypted_password);

        expect(encrypted_password).toEqual(expect.any(String));
        expect(encrypted_password.length).toEqual(60);
        expect(encrypted_password.substring(0, 2)).toMatch("$2");

        const password_matches = await security.password_compare(unencrypted_password, encrypted_password);

        expect(password_matches).toEqual(expect.any(Boolean));
        expect(password_matches).toBeTruthy();
    });

});