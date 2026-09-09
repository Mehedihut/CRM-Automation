/**
 * Test-only stub matching the shape of `services/api`'s `ApiClientError`.
 * Tests mock the api module and need to construct errors that look like the
 * real class without importing the production module (which would pull in
 * `config`, fetch wrappers, etc.).
 */
export class ApiClientErrorStub extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}