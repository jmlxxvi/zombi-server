import log from "../../../../core/log";

import jwt from "jsonwebtoken";
import jwkToPem from "jwk-to-pem";

import { http } from "../../../../core/client";

type jwkkey = {
    kty: string,
    kid: string,
    use: string,
    x5t: string,
    x5c: string[],
    x?: string,
    y?: string,
    crv?: string,
    n?: string,
    e?: string
};

let jwkkeys: jwkkey[];

/**
 * Download JWK.
 * @returns The JWK keys array
 */
const get_jwk = async (request_id: string): Promise<jwkkey[]> => {

    if (typeof jwkkeys === "undefined") {

        log.debug(`JWK not found, downloading from ${process.env.APP_IDP_JWK_URI}`, "pepa/security/idp/tokens", request_id);

        const response = await http({ method: "get", url: process.env.APP_IDP_JWK_URI ?? "invalid_url" });

        if (response && response.data && response.data.keys) {

            jwkkeys = response.data.keys;

            return jwkkeys;

        } else {

            throw new Error(`Invalid response from JWK URL ${process.env.APP_IDP_JWK_URI}`);

        }

    } else {

        return jwkkeys;

    }

};

type TokenVerificationReturnData = {
    verified: boolean,
    name: string,
    email: string
}

/**
 * Verifies the JWT token passed as parameter
 * @param token The JWT token to verify
 * @param request_id The transaction ID
 * @returns Boolean indicating the token is valid
 */
const verify_token = async (token: string, request_id: string): Promise<TokenVerificationReturnData> => {

    const jwk = await get_jwk(request_id);

    const decoded = jwt.decode(token, { complete: true });

    if (decoded === null) {

        throw new Error("Token invalid, decoded as null");

    } else {

        if (typeof decoded === "object" && "payload" in decoded) {

            if (!(decoded && decoded.payload))
                throw new Error("No payload on decoded token");

            const { iss, aud } = decoded.payload;

            log.debug(`Decoded Issuer: ${iss}`, "pepa/security/idp/tokens", request_id);
            log.debug(`Decoded Audience: ${iss}`, "pepa/security/idp/tokens", request_id);
            log.debug(`Decoded Name/email: ${decoded.payload.name ? decoded.payload.name : "No name"}/${decoded.payload.email ? decoded.payload.email : "No email"}`, "pepa/security/idp/tokens", request_id);

            if (iss !== process.env.APP_IDP_JWK_ISSUER)
                throw new Error("Invalid token, wrong issuer, see process.env.APP_IDP_JWK_ISSUER environment variable");

            if (aud !== process.env.APP_IDP_JWK_AUDIENCE)
                throw new Error("Invalid token, wrong audience, see process.env.APP_IDP_JWK_AUDIENCE environment variable");

            if (!(decoded && decoded.header && decoded.header.kid))
                throw new Error("No header kid on decoded token");

            const jwk_key: jwkkey = jwk.filter((key: jwkkey) => key.kty === "RSA" && key.kid === decoded.header.kid)[0];

            if (!jwk_key) throw new Error("Invalid token, no valid jwk keys found");

            const pem = jwkToPem(jwk_key as jwkToPem.JWK);

            if (!pem) throw new Error("Invalid token, cannot get PEM format from JWK");

            return new Promise((resolve, reject) => {
                jwt.verify(token, pem, (error) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve({
                            verified: true,
                            name: decoded.payload.name,
                            email: decoded.payload.email
                        });
                    }
                });
            });

        } else {

            throw new Error("Invalid token, no decoded payload found");

        }

    }

};

export {
    verify_token
};

/*
Example JWK

{
  "keys": [
    {
      "kty": "EC",
      "kid": "I4x/IijvdDsUZMghwNq2gC/7pYQ=",
      "use": "sig",
      "x5t": "GxQ9K-sxpsH487eSkJ7lE_SQodk",
      "x5c": [
        "MIIB/zCCAYYCCQDS7UWmBdQtETAJBgcqhkjOPQQBMGoxCzAJBgNVBAYTAlVLMRAwDgYDVQQIEwdCcmlzdG9sMRAwDgYDVQQHEwdCcmlzdG9sMRIwEAYDVQQKEwlGb3JnZVJvY2sxDzANBgNVBAsTBk9wZW5BTTESMBAGA1UEAxMJZXMzODR0ZXN0MB4XDTE3MDIwMzA5MzgzNFoXDTIwMTAzMDA5MzgzNFowajELMAkGA1UEBhMCVUsxEDAOBgNVBAgTB0JyaXN0b2wxEDAOBgNVBAcTB0JyaXN0b2wxEjAQBgNVBAoTCUZvcmdlUm9jazEPMA0GA1UECxMGT3BlbkFNMRIwEAYDVQQDEwllczM4NHRlc3QwdjAQBgcqhkjOPQIBBgUrgQQAIgNiAASTnBK9b/omE64KP7090NZ0QDigf3RFKYLYZOWKJQcCFePquZN0TZL7/MaYwXG5+5Vd9tH61GhVxkwKhSuQq25lQjJ8KADLxvQVac9mp6/Cl2hPMZAE5dI2Lq4i03+ji0cwCQYHKoZIzj0EAQNoADBlAjAsZyt7iNOBtYCtdEro1QJ2RQ8LOARQ4MBu+8LJNICdi+slnmdh75ulI9UcEhgqiFsCMQD32u2nm26LXbuwKC9DP8BjV+CdFPOZdv/UUfiQBNXz0cJE+uhEfnMJtgvwcovqntI="
      ],
      "x": "k5wSvW_6JhOuCj-9PdDWdEA4oH90RSmC2GTliiUHAhXj6rmTdE2S-_zGmMFxufuV",
      "y": "XfbR-tRoVcZMCoUrkKtuZUIyfCgAy8b0FWnPZqevwpdoTzGQBOXSNi6uItN_o4tH",
      "crv": "P-384"
    },
    {
      "kty": "EC",
      "kid": "pZSfpEq8tQPeiIe3fnnaWnnr/Zc=",
      "use": "sig",
      "x5t": "6syJZMj8X0Adm-XNzWHHIl_3kG4",
      "x5c": [
        "MIICSTCCAawCCQD+h7BW+8vxbTAJBgcqhkjOPQQBMGoxCzAJBgNVBAYTAlVLMRAwDgYDVQQIEwdCcmlzdG9sMRAwDgYDVQQHEwdCcmlzdG9sMRIwEAYDVQQKEwlGb3JnZVJvY2sxDzANBgNVBAsTBk9wZW5BTTESMBAGA1UEAxMJZXM1MTJ0ZXN0MB4XDTE3MDIwMzA5NDA0OVoXDTIwMTAzMDA5NDA0OVowajELMAkGA1UEBhMCVUsxEDAOBgNVBAgTB0JyaXN0b2wxEDAOBgNVBAcTB0JyaXN0b2wxEjAQBgNVBAoTCUZvcmdlUm9jazEPMA0GA1UECxMGT3BlbkFNMRIwEAYDVQQDEwllczUxMnRlc3QwgZswEAYHKoZIzj0CAQYFK4EEACMDgYYABAB3VSmzQx8pvjIlIenGmqHf5LafD1zeoNcyCi85WgkjmT/NiimkLH8JbQCpzK8NdvZ1cftpLfMdSdaadQA3vR7V7QFKoUSnGLwOpRJSN1K36r6boVbMhBQUOHDPxPb+Fhp0XP6a4ok1Wv1Au2HwrUCU/RfDnNtb/4ue0qdzKv78ObnkXTAJBgcqhkjOPQQBA4GLADCBhwJCAd0cIC8QSVn2bp3DGYXxkz5vPNmR7Mv22E2WaWtHlsYcBIY8E7Kd4wxVD+otogDFf4fcFmA34tk5n4PLa67wS26CAkExH1YP2rFbF3LQZVEjTHOwTh+K5S0cIxmzTGx7nnH9+dnxSpCaxKjQ/L//pH/siWe6h/dmUkTY3Y9t939ypY1Blw=="
      ],
      "x": "AHdVKbNDHym-MiUh6caaod_ktp8PXN6g1zIKLzlaCSOZP82KKaQsfwltAKnMrw129nVx-2kt8x1J1pp1ADe9HtXt",
      "y": "AUqhRKcYvA6lElI3UrfqvpuhVsyEFBQ4cM_E9v4WGnRc_priiTVa_UC7YfCtQJT9F8Oc21v_i57Sp3Mq_vw5ueRd",
      "crv": "P-521"
    },
    {
      "kty": "RSA",
      "kid": "wU3ifIIaLOUAReRB/FG6eM1P1QM=",
      "use": "sig",
      "x5t": "5eOfy1Nn2MMIKVRRkq0OgFAw348",
      "x5c": [
        "MIIDdzCCAl+gAwIBAgIES3eb+zANBgkqhkiG9w0BAQsFADBsMRAwDgYDVQQGEwdVbmtub3duMRAwDgYDVQQIEwdVbmtub3duMRAwDgYDVQQHEwdVbmtub3duMRAwDgYDVQQKEwdVbmtub3duMRAwDgYDVQQLEwdVbmtub3duMRAwDgYDVQQDEwdVbmtub3duMB4XDTE2MDUyNDEzNDEzN1oXDTI2MDUyMjEzNDEzN1owbDEQMA4GA1UEBhMHVW5rbm93bjEQMA4GA1UECBMHVW5rbm93bjEQMA4GA1UEBxMHVW5rbm93bjEQMA4GA1UEChMHVW5rbm93bjEQMA4GA1UECxMHVW5rbm93bjEQMA4GA1UEAxMHVW5rbm93bjCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBANdIhkOZeSHagT9ZecG+QQwWaUsi7OMv1JvpBr/7HtAZEZMDGWrxg/zao6vMd/nyjSOOZ1OxOwjgIfII5+iwl37oOexEH4tIDoCoToVXC5iqiBFz5qnmoLzJ3bF1iMupPFjz8Ac0pDeTwyygVyhv19QcFbzhPdu+p68epSatwoDW5ohIoaLzbf+oOaQsYkmqyJNrmht091XuoVCazNFt+UJqqzTPay95Wj4F7Qrs+LCSTd6xp0Kv9uWG1GsFvS9TE1W6isVosjeVm16FlIPLaNQ4aEJ18w8piDIRWuOTUy4cbXR/Qg6a11l1gWls6PJiBXrOciOACVuGUoNTzztlCUkCAwEAAaMhMB8wHQYDVR0OBBYEFMm4/1hF4WEPYS5gMXRmmH0gs6XjMA0GCSqGSIb3DQEBCwUAA4IBAQDVH/Md9lCQWxbSbie5lPdPLB72F4831glHlaqms7kzAM6IhRjXmd0QTYq3Ey1J88KSDf8A0HUZefhudnFaHmtxFv0SF5VdMUY14bJ9UsxJ5f4oP4CVh57fHK0w+EaKGGIw6TQEkL5L/+5QZZAywKgPz67A3o+uk45aKpF3GaNWjGRWEPqcGkyQ0sIC2o7FUTV+MV1KHDRuBgreRCEpqMoY5XGXe/IJc1EJLFDnsjIOQU1rrUzfM+WP/DigEQTPpkKWHJpouP+LLrGRj2ziYVbBDveP8KtHvLFsnexA/TidjOOxChKSLT9LYFyQqsvUyCagBb4aLs009kbW6inN8zA6"
      ],
      "n": "10iGQ5l5IdqBP1l5wb5BDBZpSyLs4y_Um-kGv_se0BkRkwMZavGD_Nqjq8x3-fKNI45nU7E7COAh8gjn6LCXfug57EQfi0gOgKhOhVcLmKqIEXPmqeagvMndsXWIy6k8WPPwBzSkN5PDLKBXKG_X1BwVvOE9276nrx6lJq3CgNbmiEihovNt_6g5pCxiSarIk2uaG3T3Ve6hUJrM0W35QmqrNM9rL3laPgXtCuz4sJJN3rGnQq_25YbUawW9L1MTVbqKxWiyN5WbXoWUg8to1DhoQnXzDymIMhFa45NTLhxtdH9CDprXWXWBaWzo8mIFes5yI4AJW4ZSg1PPO2UJSQ",
      "e": "AQAB"
    },
    {
      "kty": "RSA",
      "kid": "DkKMPE7hFVEn77WWhVuzaoFp4O8=",
      "use": "enc",
      "x5t": "JRxY4hJRL3sI_dAUWUEosCEQJ3A",
      "x5c": [
        "MIIDYTCCAkmgAwIBAgIEFt4OQjANBgkqhkiG9w0BAQsFADBhMQswCQYDVQQGEwJVSzEQMA4GA1UECBMHQnJpc3RvbDEQMA4GA1UEBxMHQnJpc3RvbDESMBAGA1UEChMJRm9yZ2VSb2NrMQswCQYDVQQLEwJBTTENMAsGA1UEAxMEdGVzdDAeFw0xODA0MDMxNDIwNThaFw0yODAzMzExNDIwNThaMGExCzAJBgNVBAYTAlVLMRAwDgYDVQQIEwdCcmlzdG9sMRAwDgYDVQQHEwdCcmlzdG9sMRIwEAYDVQQKEwlGb3JnZVJvY2sxCzAJBgNVBAsTAkFNMQ0wCwYDVQQDEwR0ZXN0MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAi7t6m4d/02dZ8dOe+DFcuUYiOWueHlNkFwdUfOs06eUETOV6Y9WCXu3D71dbF0Fhou69ez5c3HAZrSVS2qC1Htw9NkVlLDeED7qwQQMmSr7RFYNQ6BYekAtn/ScFHpq8Tx4BzhcDb6P0+PHCo+bkQedxwhbMD412KSM2UAVQaZ+TW+ngdaaVEs1Cgl4b8xxZ9ZuApXZfpddNdgvjBeeYQbZnaqU3b0P5YE0s0YvIQqYmTjxh4RyLfkt6s/BS1obWUOC+0ChRWlpWE7QTEVEWJP5yt8hgZ5MecTmBi3yZ/0ts3NsL83413NdbWYh+ChtP696mZbJozflF8jR9pewTbQIDAQABoyEwHzAdBgNVHQ4EFgQUDAvAglxsoXuEwI2NT1hFtVww2SUwDQYJKoZIhvcNAQELBQADggEBADiHqUwRlq1xdHP7S387vMLOr+/OUgNvDUogeyrpdj5vFve/CBxSFlcoY215eE0xzj2+bQoe5To3s8CWkP9hqB3EdhaRBfCrd8Vpvu8xBZcxQzmqwNjmeDrxNpKes717t05fDGgygUM8xIBs29JwRzHzf7e0ByJjn9fvlUjDAGZ7emCTN382F2iOeLC2ibVl7dpmsWZTINhQRbmq5L4ztOcjITk5WZnBF439oRRn68fWZVkOv2UqaKbkuMjgotNuot+ebHtOchEiwKz8VAK7O3/IgD6rfNBfz+c/WeoPcrfQBR4zfizw/ioR115RSywifzlwq5yziqyU04eP4wLr3cM="
      ],
      "n": "i7t6m4d_02dZ8dOe-DFcuUYiOWueHlNkFwdUfOs06eUETOV6Y9WCXu3D71dbF0Fhou69ez5c3HAZrSVS2qC1Htw9NkVlLDeED7qwQQMmSr7RFYNQ6BYekAtn_ScFHpq8Tx4BzhcDb6P0-PHCo-bkQedxwhbMD412KSM2UAVQaZ-TW-ngdaaVEs1Cgl4b8xxZ9ZuApXZfpddNdgvjBeeYQbZnaqU3b0P5YE0s0YvIQqYmTjxh4RyLfkt6s_BS1obWUOC-0ChRWlpWE7QTEVEWJP5yt8hgZ5MecTmBi3yZ_0ts3NsL83413NdbWYh-ChtP696mZbJozflF8jR9pewTbQ",
      "e": "AQAB"
    },
    {
      "kty": "EC",
      "kid": "Fol7IpdKeLZmzKtCEgi1LDhSIzM=",
      "use": "sig",
      "x5t": "MUOPc5byMEN9q_9gqArkd1EDajg",
      "x5c": [
        "MIIBwjCCAWkCCQCw3GyPBTSiGzAJBgcqhkjOPQQBMGoxCzAJBgNVBAYTAlVLMRAwDgYDVQQIEwdCcmlzdG9sMRAwDgYDVQQHEwdCcmlzdG9sMRIwEAYDVQQKEwlGb3JnZVJvY2sxDzANBgNVBAsTBk9wZW5BTTESMBAGA1UEAxMJZXMyNTZ0ZXN0MB4XDTE3MDIwMzA5MzQ0NloXDTIwMTAzMDA5MzQ0NlowajELMAkGA1UEBhMCVUsxEDAOBgNVBAgTB0JyaXN0b2wxEDAOBgNVBAcTB0JyaXN0b2wxEjAQBgNVBAoTCUZvcmdlUm9jazEPMA0GA1UECxMGT3BlbkFNMRIwEAYDVQQDEwllczI1NnRlc3QwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAAQ3sy05tV/3YUlPBi9jZm9NVPeuBmntrtcO3NP/1HDsgLsTZsqKHD6KWIeJNRQnONcriWVaIcZYTKNykyCVUz93MAkGByqGSM49BAEDSAAwRQIgZhTox7WpCb9krZMyHfgCzHwfu0FVqaJsO2Nl2ArhCX0CIQC5GgWD5jjCRlIWSEFSDo4DZgoQFXaQkJUSUbJZYpi9dA=="
      ],
      "x": "N7MtObVf92FJTwYvY2ZvTVT3rgZp7a7XDtzT_9Rw7IA",
      "y": "uxNmyoocPopYh4k1FCc41yuJZVohxlhMo3KTIJVTP3c",
      "crv": "P-256"
    }
  ]
}

*/