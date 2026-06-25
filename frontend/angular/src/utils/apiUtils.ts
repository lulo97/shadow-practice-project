export interface IApiInput {
  endpoint: string;
  query?: Record<string, string | number | boolean>;
  body?: any;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  credentials?: RequestCredentials;
}

export interface IApiOutput {
  success: boolean;
  message: string;
  data: any;
  contentType?: string;
}

export const BACKEND_ORIGIN = "http://localhost:3000";

type ContentCategory = "json" | "image" | "video" | "text" | "binary";

function getContentCategory(contentType: string): ContentCategory {
  if (contentType.includes("application/json")) return "json";
  if (contentType.includes("image/")) return "image";
  if (contentType.includes("video/")) return "video";
  if (contentType.includes("text/")) return "text";
  return "binary";
}

export async function callApi(input: IApiInput): Promise<IApiOutput> {
  const { endpoint, query, body, method, credentials } = input;

  const url = new URL(endpoint, BACKEND_ORIGIN);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }

  const isFormData = body instanceof FormData;

  const options: RequestInit = {
    method,
    credentials: credentials ?? undefined,
    headers: isFormData ? {} : { "Content-Type": "application/json" },
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  };

  // Only set Content-Type for non-FormData bodies
  if (!(body instanceof FormData)) {
    (options.headers as Record<string, string>)["Content-Type"] =
      "application/json";
  }

  const response = await fetch(url.toString(), options);
  const contentType = response.headers.get("Content-Type") ?? "";
  const category = getContentCategory(contentType);

  let data: any;
  let message = "";

  switch (category) {
    case "json": {
      const json = await response.json();
      data = json;
      message = json?.message ?? "";
      break;
    }

    case "image":
    case "video":
    case "binary": {
      const blob = await response.blob();
      data = {
        url: URL.createObjectURL(blob),
        blob,
        contentType,
      };
      message = response.ok ? "Binary data received" : "Binary request failed";
      break;
    }

    case "text": {
      const text = await response.text();
      data = text;
      message = response.ok ? text : "Text request failed";
      break;
    }
  }

  return {
    success: response.ok,
    message,
    data,
    contentType,
  };
}
