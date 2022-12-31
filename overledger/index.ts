import OverledgerSDK from "@quantnetwork/overledger-bundle";
import { DltNameOptions } from "@quantnetwork/overledger-types";

const overledger = new OverledgerSDK({
  dlts: [{ dlt: DltNameOptions.ETHEREUM }],
  provider: { network: "testnet" },
  envFilePassword: process.env.SECRET! as string,
});

interface OverledgerAPIResponse {
  data: any;
  error: any;
}

const createEthAccount = async (): Promise<OverledgerAPIResponse> => {
  let data, error;

  try {
    data = await overledger.dlts.ethereum.createAccount();
  } catch (e: any) {
    error = e;
  }

  return { data, error };
};

export { createEthAccount };
