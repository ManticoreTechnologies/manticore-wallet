const BASE_URL = 'https://api.manticore.exchange:443/evrmore/rpc';//'http://192.168.0.242/evrmore/rpc'

export async function makeRpcRequest(command: string, params: object = {}): Promise<any> {
  try {
    const url = `${BASE_URL}/${command}`;
    //console.log(`Making request to: ${url}`);
    //console.log('Request params:', params);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    //console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response text:', errorText);
      throw new Error(`Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    //console.log('Response data:', data);
    return data;
  } catch (error) {
    console.error('Error making RPC request:', error);
    console.error(error)
    throw error;
  }
}
