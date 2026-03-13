import { Link } from "react-router-dom";

import { Card } from "@/components/ui/card";
import { useAuthStore } from "@/features/auth/auth-store";

export default function HomePage(): React.JSX.Element {
  const status = useAuthStore((state) => state.status);
  const confirmationsTarget = status === "authenticated" ? "/dashboard" : "/login";

  return (
    <div className="container stack-lg">
      <section className="hero surface-card typeform-hero">
        <div className="hero__content">
          <span className="eyebrow">Confirmation workflow</span>
          <h1>Confirmed Shopify bookings automatically create the record. Guests only fill in the missing confirmation details.</h1>
          <p>
            Once a customer buys and the booking is confirmed in Shopify, this system detects it and creates the confirmation record automatically. The guest does not create a new record here. They only complete extra details on the existing confirmation, like companions, allergies, and other missing booking information.
          </p>
          <div className="actions-row">
            <Link className="button button--primary" to={confirmationsTarget}>
              {status === "authenticated" ? "Open workspace" : "Team login"}
            </Link>
          </div>
        </div>
        <div className="hero__stats typeform-hero__stats">
          <div>
            <strong>1</strong>
            <span>Shopify booking confirmation creates the base record automatically</span>
          </div>
          <div>
            <strong>2</strong>
            <span>Guest fills only the remaining confirmation questions</span>
          </div>
          <div>
            <strong>3</strong>
            <span>CMS team reviews the completed record internally</span>
          </div>
        </div>
      </section>

      <section className="system-flow">
        <Card className="system-flow__card">
          <span className="eyebrow">Auto-created</span>
          <h2>Base confirmation record already exists</h2>
          <p>The booking and core order data come from Shopify first, so the CMS starts from an existing record.</p>
        </Card>
        <Card className="system-flow__card">
          <span className="eyebrow">Guest input</span>
          <h2>Guest only fills the missing fields</h2>
          <p>Examples include who is coming, how many companions there are, allergies, and other missing trip details.</p>
        </Card>
        <Card className="system-flow__card">
          <span className="eyebrow">CMS review</span>
          <h2>Internal team manages the record</h2>
          <p>Your team tracks completion, checks details, and follows up on missing guest answers from the dashboard.</p>
        </Card>
      </section>

      <section className="quick-links-grid">
        <Link className="quick-link-card surface-card" to={confirmationsTarget}>
          <span className="eyebrow">Workspace</span>
          <h2>Confirmation records queue</h2>
          <p>Review Shopify-created confirmation records and check which fields still need to be completed.</p>
        </Link>
      </section>
    </div>
  );
}
