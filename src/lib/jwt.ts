import { SignJWT, jwtVerify, JWTPayload } from 'jose';

const secretKey = process.env.JWT_SECRET!;
const key = new TextEncoder().encode(secretKey);

export async function signJwt(payload: JWTPayload, expiresInSeconds?: number) {
  const jwt = new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt();

  if (expiresInSeconds) {
    jwt.setExpirationTime(`${expiresInSeconds}s`);
  } else {
    jwt.setExpirationTime('1y');
  }

  return await jwt.sign(key);
}

export async function verifyJwt(token: string) {
  try {
    const { payload } = await jwtVerify(token, key);
    return payload;
  } catch {
    return null;
  }
}


