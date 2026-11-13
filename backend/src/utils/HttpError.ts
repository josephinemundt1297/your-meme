// Erwartete fachliche Fehler werden im Controller in die API-Antwort übersetzt.
export class HttpError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "HttpError";
  }
}
