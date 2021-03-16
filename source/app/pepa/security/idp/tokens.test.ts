import { verify_token } from "./tokens";

const test_jwt = "eyJ0eXAiOiJKV1QiLCJraWQiOiJ3VTNpZklJYUxPVUFSZVJCL0ZHNmVNMVAxUU09IiwiYWxnIjoiUlMyNTYifQ.eyJhdF9oYXNoIjoiaXV2YmtuS3ZSc3NkT1p0cmtYSXFqdyIsInN1YiI6IjM0NGY5NmE1LWE1MGYtNDkzNy1iZmQwLTllN2VjYjEzODhiZiIsImF1ZGl0VHJhY2tpbmdJZCI6ImFmYWY2ZmFiLTgzODMtNDk0Zi1hNzI5LTEyZDc5NmU0ODBmZi00MDMyNjAwIiwiaXNzIjoiaHR0cHM6Ly9pZHBzZXNpb250LnRlbGVjb20uY29tLmFyOjQ0My9vcGVuYW0vb2F1dGgyL2ZpbnRlY2hkZXYtYXBwIiwidG9rZW5OYW1lIjoiaWRfdG9rZW4iLCJhdmF0YXIiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vLTZPSFdKZDB4VHhjL0FBQUFBQUFBQUFJL0FBQUFBQUFBQUFBL0FNWnV1Y2x4Z1JuclNBYmRHQVdmbnFPeVNuM29qOThDZ0Evczk2LWMvcGhvdG8uanBnIiwiZ2l2ZW5fbmFtZSI6Imx1aXMgZ2FicmllbCIsImF1ZCI6Im9pZGMtZmludGVjaGFway1kZXYiLCJjX2hhc2giOiJlQ1hVUV8zZGxpdVpjX3hUSUhwTnJnIiwiYWNyIjoiMCIsIm9yZy5mb3JnZXJvY2sub3BlbmlkY29ubmVjdC5vcHMiOiJxYUNwVkNfaTcwM1p4NkRMV3FPOXR1Q0NkTnciLCJzX2hhc2giOiJEUkxsOTV4QkFWMzJ1S1RYbkE4czNRIiwiYXpwIjoib2lkYy1maW50ZWNoYXBrLWRldiIsImF1dGhfdGltZSI6MTYxNTU5MDY4MywibmFtZSI6Imx1aXMgZ2FicmllbCBhY2V2ZWRvIiwicmVhbG0iOiIvZmludGVjaGRldi1hcHAiLCJleHAiOjE2MTU5NTA2ODQsInRva2VuVHlwZSI6IkpXVFRva2VuIiwiZmFtaWx5X25hbWUiOiJhY2V2ZWRvIiwiaWF0IjoxNjE1NTkwNjg0LCJlbWFpbCI6Imx1aXNnYWJyaWVsLmFjZUBnbWFpbC5jb20ifQ.MbXO07vVN5zhRzAcFbGfi1GUexo-nJKbhIdHC1Jg_aJ2M9AZAvCAXDyk1KiXxRm5D3YjK-at2bzMricwwWv6jhfwF-jiLjwCj5WP4V3WX3Q7a_s0bSftprrgwECQqDa3guv7tmvwji7khV5tFXHutTlO0cOrqK5sWYmK235qG_GCH4p96OjiOlKN991F-4CeRaqcZbpTfPActNH9WUrWfFORIm-U1vConUfjkT3ynQtz6pnp6w9a-dqldIBENdQy2lIWafbZMKkbLYK82fnkVGEQBr1vVZTnkgHC1hrRMGu32aCcd6hUg_cMlASQp2y26R-mLna-5layPpcQq4BdrA";

describe("JWT Verify Tests", () => {

    it("Responds with error invalid URI", async () => {

        const uri_env_var = process.env.APP_IDP_JWK_URI;

        try {

            process.env.APP_IDP_JWK_URI = "http://invalid_uri:666";

            await verify_token(test_jwt, "test");

            fail("Should have thrown");

        } catch (error) {

            process.env.APP_IDP_JWK_URI = uri_env_var;

            expect(/^getaddrinfo/.test(error.message)).toBeTruthy; //("getaddrinfo EAI_AGAIN invalid_uri")
            
        }

    });

    it("Responds with error invalid token", async () => {

        try {

            await verify_token("invalid_token", "test");

        } catch (error) {

            expect(error.message).toBe("Token invalid, decoded as null");

        }

    });

    it("Responds with error invalid issuer", async () => {

        const issuer_env_var = process.env.APP_IDP_JWK_ISSUER;

        try {

            process.env.APP_IDP_JWK_ISSUER = "invalid_issuer";

            await verify_token(test_jwt, "test");

            fail("Should have thrown");

        } catch (error) {

            process.env.APP_IDP_JWK_ISSUER = issuer_env_var;

            expect(error.message).toBe("Invalid token, wrong issuer, see process.env.APP_IDP_JWK_ISSUER environment variable");
            
        }

    });

    it("Responds with error invalid audience", async () => {

        const audience_env_var = process.env.APP_IDP_JWK_AUDIENCE;

        try {

            process.env.APP_IDP_JWK_AUDIENCE = "invalid_audience";

            await verify_token(test_jwt, "test");

            fail("Should have thrown");

        } catch (error) {

            process.env.APP_IDP_JWK_AUDIENCE = audience_env_var;

            expect(error.message).toBe("Invalid token, wrong audience, see process.env.APP_IDP_JWK_AUDIENCE environment variable");
            
        }

    });

});
