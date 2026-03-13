import { Link } from "react-router-dom";

import { EmptyState } from "@/components/feedback/empty-state";

export default function NotFoundPage(): React.JSX.Element {
  return (
    <div className="container">
      <EmptyState
        title="Page not found"
        message="The route you requested does not exist in the current frontend application."
        action={
          <Link className="button button--primary" to="/">
            Return home
          </Link>
        }
      />
    </div>
  );
}
