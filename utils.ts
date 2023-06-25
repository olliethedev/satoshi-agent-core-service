import * as jose from 'jose';
import * as AlbyTools from 'alby-tools'

const SECRET = Buffer.from(process.env.JWT_SECRET as any);


export const isValidPreimage = async function isValidPreimage(token: string, preimage: string, path: string) {
    let jwt
    try {
        jwt = await jose.jwtVerify(token, SECRET, {}) as any;
    } catch (e) {
        console.error(e);
        return false;
    }
    if (path !== jwt.payload.path) {
        return false;
    }
    if (Math.floor(Date.now() / 1000) > jwt?.payload?.exp) {
        return false; // expired
    }
    const invoice = new AlbyTools.Invoice({ pr: jwt.payload.pr, preimage: preimage });
    const isPaid = await invoice.isPaid();
    return isPaid;
}

export const generateToken = async function generateToken(invoice: { paymentRequest: string }, path: string) {
    const jwt = await new jose.SignJWT({ 'pr': invoice.paymentRequest, 'path': path })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('60s')
        .sign(SECRET)

    return jwt;
}

