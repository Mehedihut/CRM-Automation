import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <main className="page">
      <div className="card not-found">
        <h1>404</h1>
        <p>Page not found.</p>
        <Link to="/leads" className="btn btn-primary">
          Back to leads
        </Link>
      </div>
    </main>
  );
}
