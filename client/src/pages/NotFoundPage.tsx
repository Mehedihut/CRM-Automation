import { Link } from "react-router-dom";

export function NotFoundPage(): JSX.Element {
  return (
    <main className="page">
      <section className="card">
        <h2>Not found</h2>
        <p>The page you're looking for doesn't exist.</p>
        <p>
          <Link to="/">Back to dashboard</Link>
        </p>
      </section>
    </main>
  );
}
