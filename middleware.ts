import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import * as AlbyTools from 'alby-tools'
import { generateToken, isValidPreimage } from '@/utils';
const RECIPIENT = process.env.RECIPIENT as any;
const PRICE_IN_SATS = 10;

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
    const requestHeaders = new Headers(request.headers)
    const authHeader = requestHeaders.get('Authorization')
    if (authHeader) {
        console.info(`Auth header present`);
        const [token, preimage] = authHeader.replace('LSAT ', '').split(":");
        const isValid = await isValidPreimage(token, preimage, request.url);
        if (isValid) {
            console.info(`Payment valid`);
            return NextResponse.next();
        }
    }
    console.log(`Requesting LSAT payment`);
    const ln = new AlbyTools.LightningAddress(RECIPIENT);
    await ln.fetch();
    const invoice = await ln.requestInvoice({ satoshi: PRICE_IN_SATS });
    const jwt = await generateToken(invoice, request.url);

    const newHeaders = new Headers(request.headers)

    newHeaders.set('www-authenticate', `LSAT macaroon=${ jwt },invoice=${ invoice.paymentRequest }`);

    return new Response(JSON.stringify({ invoice: invoice.paymentRequest, macaroon: invoice.paymentHash }), {
        status: 402,
        headers: {
            'content-type': 'application/json',
            'www-authenticate': `LSAT macaroon=${ jwt },invoice=${ invoice.paymentRequest }`
        },
    })
}

export const config = {
    matcher: '/api/chat/:path*',
}