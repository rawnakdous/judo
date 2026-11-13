const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api";

export class ApiError extends Error {
  status: number;
  /** Parsed JSON error body, when the server sent one (e.g. 409 from "next combat" carries `tatami`). */
  body?: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  // FormData (file upload): let the browser set multipart/form-data with its boundary.
  const isFormData = typeof FormData !== "undefined" && init?.body instanceof FormData;
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    let message = "Une erreur est survenue";
    let body: unknown;
    try {
      body = await response.json();
      message = (body as { message?: string }).message ?? message;
    } catch {}
    throw new ApiError(response.status, message, body);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  const text = await response.text();
  return text ? JSON.parse(text) : (undefined as T);
}
