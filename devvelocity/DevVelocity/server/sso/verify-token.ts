// server/sso/verify-token.ts

import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";

/**
 * Verifies and decodes an ID token from any SSO provider.
 *
 * Providers supported:
 *  - Okta
 *  - Azure AD
 *  - Google Workspace
 *  - Auth0
 *  - OneLogin
 *  - Generic OIDC
 *
 * Output:
 *   {
 *     email,
 *     name,
 *     sub,
 *     provider,
 *     orgId,
 *     picture
 *   }
 */

export async function verifySSOToken({
  token,
  issuer,
  audience,
  provider,
  orgId,
}: {
  token: string;
  issuer: string;
  audience: string;
  provider: string;
  orgId: string;
}) {
  if (!token) throw new Error("Missing ID token.");
  if (!issuer) throw new Error("Missing issuer.");
  if (!audience) throw new Error("Missing audience.");

  // ---------------------------------------------------------------
  // JWKS CLIENT (needed for verifying signatures from all providers)
  // ---------------------------------------------------------------
  const client = jwksClient({
    jwksUri: `${issuer}/.well-known/jwks.json`,
    timeout: 5000,
  });

  function getSigningKey(header: any, callback: any) {
    client.getSigningKey(header.kid, function (err, key) {
      if (err) {
        callback(err, null);
        return;
      }
      const signingKey = key.getPublicKey();
      callback(null, signingKey);
    });
  }

  // ---------------------------------------------------------------
  // VERIFY TOKEN WITH PUBLIC SIGNING KEY
  // ---------------------------------------------------------------
  const decoded: any = await new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getSigningKey,
      {
        audience,
        issuer,
        algorithms: ["RS256"],
      },
      (err, payload) => {
        if (err) reject(err);
        else resolve(payload);
      }
    );
  });

  if (!decoded) {
    throw new Error("Failed to decode SSO token.");
  }

  // ---------------------------------------------------------------
  // Normalize fields across different SSO providers
  // ---------------------------------------------------------------
  const identity = {
    sub: decoded.sub,
    email: decoded.email ?? decoded.preferred_username ?? "",
    name: decoded.name ?? decoded.given_name ?? "",
    picture: decoded.picture ?? null,
    provider,
    orgId,
    raw: decoded,
  };

  if (!identity.email) {
    throw new Error("Token did not include an email field.");
  }

  return identity;
}
