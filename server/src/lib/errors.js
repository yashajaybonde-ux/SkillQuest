export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
// Throw a readable error for failed Supabase calls.
export function must({ data, error }, msg = 'Database error') {
  if (error) { console.error(msg, error); throw new HttpError(500, msg); }
  return data;
}
