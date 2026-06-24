export interface IApiInput {
  endpoint: string;
  query?: Record<string, string | number | boolean>;
  body?: any;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  credentials?: RequestCredentials,
}

export interface IApiOutput {
  success: boolean;
  message: string; //error or message
  data: any;
}

export const BACKEND_ORIGIN = "http://localhost:3000";

export async function callApi(input: IApiInput): Promise<IApiOutput> {
  const { endpoint, query, body, method, credentials } = input;

  const url = new URL(endpoint, BACKEND_ORIGIN);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }

  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(body ? {} : {}),
    },
    credentials: credentials ?? undefined,
    body: body ? JSON.stringify(body) : undefined,
  };

  const response = await fetch(url.toString(), options);

  const data = await response.json();

  const output: IApiOutput = {
    success: response.status == 200,
    message: data.message,
    data: data
  };

  return output;
}
