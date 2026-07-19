export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

function genericErrorMessage(status: number): string {
  if (status === 404) return "The requested resource was not found.";
  if (status === 403) return "You don't have permission to do that.";
  if (status >= 500) return "Something went wrong on the server. Please try again.";
  return "The request could not be completed. Please check your input and try again.";
}

/**
 * Turns a { field: "message" } map (or an array of { field, message }
 * validation errors) into one readable string. Returns null if `value`
 * doesn't look like either shape.
 */
function describeFieldErrors(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;

  if (Array.isArray(value)) {
    const messages = value
      .map((entry) => {
        if (entry && typeof entry === "object") {
          const e = entry as Record<string, unknown>;
          const field = typeof e.field === "string" ? e.field : undefined;
          const msg =
            typeof e.defaultMessage === "string"
              ? e.defaultMessage
              : typeof e.message === "string"
              ? e.message
              : undefined;
          if (field && msg) return `${field}: ${msg}`;
          if (msg) return msg;
        }
        return typeof entry === "string" ? entry : undefined;
      })
      .filter((m): m is string => Boolean(m));
    return messages.length > 0 ? messages.join("; ") : null;
  }

  const entries = Object.entries(value as Record<string, unknown>).filter(
    (pair): pair is [string, string] => typeof pair[1] === "string"
  );
  return entries.length > 0
    ? entries.map(([field, msg]) => `${field}: ${msg}`).join("; ")
    : null;
}

/**
 * Reads a non-ok fetch Response and pulls a human-readable message out of it.
 * Handles the realistic shapes a Spring GlobalExceptionHandler tends to return:
 *   { "message": "..." }
 *   { "error": "Bad Request", "message": "...", "status": 400, "timestamp": "..." }
 *   { "errors": { "name": "must not be blank" } }               (field -> message map)
 *   { "errors": [{ "field": "name", "defaultMessage": "..." }] } (Spring validation array)
 *   { "name": "must not be blank" }                              (flat field -> message map)
 * Falls back to a readable generic message if the body is missing, empty,
 * not JSON, or none of the above shapes match.
 */
export async function extractErrorMessage(response: Response): Promise<string> {
  const fallback = genericErrorMessage(response.status);

  let text: string;
  try {
    text = await response.text();
  } catch {
    return fallback;
  }
  if (!text.trim()) return fallback;

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return fallback;
  }
  if (typeof body !== "object" || body === null) return fallback;

  const obj = body as Record<string, unknown>;

  if (typeof obj.message === "string" && obj.message.trim()) {
    return obj.message;
  }

  const fieldErrorsMessage = describeFieldErrors(
    obj.errors ?? obj.fieldErrors ?? obj.validationErrors
  );
  if (fieldErrorsMessage) return fieldErrorsMessage;

  // Only treat the whole body as a field->message map when it doesn't look
  // like a standard Spring error envelope (which mixes in timestamp/status/path).
  const looksLikeErrorEnvelope =
    "timestamp" in obj || "status" in obj || "path" in obj;
  if (!looksLikeErrorEnvelope) {
    const flatMessage = describeFieldErrors(obj);
    if (flatMessage) return flatMessage;
  }

  if (typeof obj.error === "string" && obj.error.trim()) {
    return obj.error;
  }

  return fallback;
}

/**
 * Fetch wrapper that attaches the JWT and handles session expiry in one place.
 * On a 401 it clears the session (via onUnauthorized) and throws immediately,
 * so callers don't need to special-case 401 themselves. Any other status is
 * returned as-is for the caller to check response.ok and, if needed, call
 * extractErrorMessage on it.
 */
export async function authFetch(
  token: string,
  path: string,
  onUnauthorized: () => void,
  options: RequestInit = {}
): Promise<Response> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
  if (response.status === 401) {
    onUnauthorized();
    throw new Error("Session expired. Please log in again.");
  }
  return response;
}
