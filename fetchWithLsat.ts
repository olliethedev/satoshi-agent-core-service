import lnService from 'ln-service'
import { Lsat } from 'lsat-js'

export async function fetchWithLsat(input: RequestInfo, init?: RequestInit): Promise<any> {
  try {
    let response = await fetch(input, init);

    const header = response.headers.get('www-authenticate');

    // If the www-authenticate header is missing, proceed with a normal fetch.
    if (!header) {
      const json = await response.json();
      return json;
    }

    const lsat = Lsat.fromHeader(header);

    // after the invoice is paid, you can add the preimage
    const preimage = await payInvoice(lsat.invoice);

    // this will validate that the preimage is valid and throw if not
    lsat.setPreimage(preimage);

    response = await fetch(input, {
      headers: {
        'Authorization': lsat.toToken()
      }
    });

    const json = await response.json();

    return json;
  } catch (e) {
    console.error(e);
    throw e;
  }
}

// Helper function to pay a Bitcoin Lightning invoice
const payInvoice = async (input: string): Promise<string> => {
    console.log(`Paying invoice ${ input }...`);

    const { lnd } = lnService.authenticatedLndGrpc({
        macaroon: process.env.MACAROON,
        socket: process.env.LND_SOCKET,
    });
    try {
        const result = await lnService.pay({ lnd, request: input });
        return result.secrets.preimage;
    } catch (error: any) {
        console.error(`Error: ${ error.message }`);
        throw error;
    }
};