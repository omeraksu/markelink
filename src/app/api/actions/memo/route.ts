import {
  ActionPostResponse,
  createPostResponse,
  MEMO_PROGRAM_ID,
  ActionGetResponse,
  ActionPostRequest,
  createActionHeaders,
} from "@solana/actions";

import {
  clusterApiUrl,
  ComputeBudgetProgram,
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";

// create the standard headers for this route (including CORS)
const headers = createActionHeaders({});

export const GET = async (req: Request) => {
  try {
    const requestUrl = new URL(req.url);
    const { toPubkey } = validatedQueryParams(requestUrl);

    const baseHref = new URL(
      `/api/actions/donate-sol?to=${toPubkey.toBase58()}`,
      requestUrl.origin
    ).toString();

    const payload: ActionGetResponse = {
      type: "action",
      title: "Donate SOL to Alice",
      icon: "https://ucarecdn.com/7aa46c85-08a4-4bc7-9376-88ec48bb1f43/-/preview/880x864/-/quality/smart/-/format/auto/",
      description:
        "Cybersecurity Enthusiast | Support my research with a donation.",
      label: "Transfer", // this value will be ignored since `links.actions` exists
      links: {
        actions: [
          {
            label: "Send 1 SOL", // button text
            href: `${baseHref}&amount=${"1"}`,
          },
          {
            label: "Send 5 SOL", // button text
            href: `${baseHref}&amount=${"5"}`,
          },
          {
            label: "Send 10 SOL", // button text
            href: `${baseHref}&amount=${"10"}`,
          },
          {
            label: "Send SOL", // button text
            href: `${baseHref}&amount={amount}`, // this href will have a text input
            parameters: [
              {
                name: "amount", // parameter name in the `href` above
                label: "Enter the amount of SOL to send", // placeholder of the text input
                required: true,
              },
            ],
          },
        ],
      },
    };

    return Response.json(payload, {
      headers,
    });
  } catch (err) {
    console.log(err);
    let message = "An unknown error occurred";
    if (typeof err == "string") message = err;
    return new Response(message, {
      status: 400,
      headers,
    });
  }
};

// DO NOT FORGET TO INCLUDE THE `OPTIONS` HTTP METHOD
// THIS WILL ENSURE CORS WORKS FOR BLINKS
export const OPTIONS = async () => {
  return new Response(null, { headers });
};

export const POST = async (req: Request) => {
  try {
    const body: ActionPostRequest = await req.json();

    let account: PublicKey;
    try {
      account = new PublicKey(body.account);
    } catch (err) {
      return new Response('Invalid "account" provided', {
        status: 400,
        headers,
      });
    }

    const connection = new Connection(
      process.env.SOLANA_RPC! || clusterApiUrl("devnet")
    );

    const transaction = new Transaction().add(
      // note: `createPostResponse` requires at least 1 non-memo instruction
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 1000,
      }),
      new TransactionInstruction({
        programId: new PublicKey(MEMO_PROGRAM_ID),
        data: Buffer.from("this is a simple memo message2", "utf8"),
        keys: [],
      })
    );

    // set the end user as the fee payer
    transaction.feePayer = account;

    transaction.recentBlockhash = (
      await connection.getLatestBlockhash()
    ).blockhash;

    const payload: ActionPostResponse = await createPostResponse({
      fields: {
        transaction,
        message: "Post this memo on-chain",
      },
      // no additional signers are required for this transaction
      // signers: [],
    });

    return Response.json(payload, {
      headers,
    });
  } catch (err) {
    console.log(err);
    let message = "An unknown error occurred";
    if (typeof err == "string") message = err;
    return new Response(message, {
      status: 400,
      headers,
    });
  }
};
function validatedQueryParams(requestUrl: URL): { toPubkey: any } {
  throw new Error("Function not implemented.");
}
