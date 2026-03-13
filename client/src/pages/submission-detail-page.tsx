import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorAlert } from "@/components/feedback/error-alert";
import { LoadingPanel } from "@/components/feedback/loading-panel";
import { Card } from "@/components/ui/card";
import { SubmissionStatusBadge } from "@/features/form-system/components/submission-status-badge";
import { getSubmissionDetail } from "@/features/form-system/form-system-api";
import { formatDate, formatDateRange } from "@/lib/utils/format";

interface CompanionData {
  index: number;
  name: string;
  age: string;
  allergies: string;
  eatMeat: string;
  eatFish: string;
}

function getOrdinal(n: number): string {
  const suffixes = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]}`;
}

function parseCompanions(answers: Record<string, string | boolean>): CompanionData[] {
  const companions: CompanionData[] = [];
  let i = 1;

  while (answers[`companion_${i}_name`] !== undefined) {
    companions.push({
      index: i,
      name: String(answers[`companion_${i}_name`] ?? ""),
      age: String(answers[`companion_${i}_age`] ?? ""),
      allergies: String(answers[`companion_${i}_allergies`] ?? ""),
      eatMeat: String(answers[`companion_${i}_eat_meat`] ?? ""),
      eatFish: String(answers[`companion_${i}_eat_fish`] ?? ""),
    });
    i++;
  }

  return companions;
}

function formatValue(value: unknown): string {
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  const text = String(value ?? "").trim();
  return text.length > 0 ? text : "—";
}

function YesNoBadge({ value }: { value: unknown }) {
  const text = formatValue(value);
  const isYes = String(value).toLowerCase() === "yes";
  return <span className={`sd-yn sd-yn--${isYes ? "yes" : "no"}`}>{text}</span>;
}

function InfoRow({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="sd-info-row">
      <dt className="sd-info-row__label">{label}</dt>
      <dd className="sd-info-row__value">{formatValue(value)}</dd>
    </div>
  );
}

export default function SubmissionDetailPage(): React.JSX.Element {
  const { submissionId } = useParams();
  const detailQuery = useQuery({
    queryKey: ["submission-detail", submissionId],
    queryFn: () => getSubmissionDetail(String(submissionId)),
    enabled: Boolean(submissionId),
  });

  if (!submissionId) {
    return <EmptyState title="Submission not found" message="This workspace record does not exist." />;
  }

  if (detailQuery.isLoading) {
    return <LoadingPanel className="container" label="Loading submission detail" />;
  }

  if (detailQuery.error) {
    return <ErrorAlert message={String(detailQuery.error.message)} />;
  }

  if (!detailQuery.data) {
    return <EmptyState title="Submission not found" message="This workspace record does not exist." />;
  }

  const s = detailQuery.data;
  const a = s.answers;
  const companions = parseCompanions(a);
  const totalGuests = 1 + companions.length;

  return (
    <div className="sd-page">
      {/* ── Back link ── */}
      <Link className="sd-back" to="/dashboard">
        <span aria-hidden="true">&larr;</span> Back to dashboard
      </Link>

      {/* ── Hero header ── */}
      <section className="surface-card sd-hero">
        <div className="sd-hero__top">
          <div className="sd-hero__identity">
            <h1 className="sd-header__name">{s.guestName}</h1>
            <p className="sd-header__email">{s.guestEmail}</p>
          </div>
          <SubmissionStatusBadge status={s.status} />
        </div>

        <div className="sd-meta-row">
          <span className="sd-meta-tag">{s.linkedBooking.propertyName}</span>
          <span className="sd-meta-tag">{formatDateRange(s.linkedBooking.checkIn, s.linkedBooking.checkOut)}</span>
          <span className="sd-meta-tag">Order {s.shopifyOrderNumber}</span>
          <span className="sd-meta-tag">Ref {s.bookingReference}</span>
        </div>

        {/* Stats row inside hero */}
        <div className="sd-hero-stats">
          <div className="sd-hero-stat">
            <span className="sd-hero-stat__value">{s.completionPercent}%</span>
            <span className="sd-hero-stat__label">Completion</span>
          </div>
          <div className="sd-hero-stat">
            <span className="sd-hero-stat__value">{s.missingCount}</span>
            <span className="sd-hero-stat__label">Missing fields</span>
          </div>
          <div className="sd-hero-stat">
            <span className="sd-hero-stat__value">{totalGuests}</span>
            <span className="sd-hero-stat__label">Total guests</span>
          </div>
          <div className="sd-hero-stat">
            <span className="sd-hero-stat__value sd-hero-stat__value--sm">{formatDate(s.updatedAt)}</span>
            <span className="sd-hero-stat__label">Last updated</span>
          </div>
        </div>
      </section>

      {/* ── Two-column layout ── */}
      <div className="sd-columns">
        {/* ── Left column: Guest data ── */}
        <div className="sd-col-main">
          {/* Identity */}
          <Card className="sd-card">
            <h2 className="sd-card__title">Guest identity</h2>
            <dl className="sd-info-grid sd-info-grid--3">
              <InfoRow label="Full name" value={a.guest_name ?? s.guestName} />
              <InfoRow label="Email" value={a.guest_email ?? s.guestEmail} />
              <InfoRow label="WhatsApp" value={a.whatsapp ?? a.guest_phone} />
              <InfoRow label="Age" value={a.guest_age} />
              <InfoRow label="Country" value={a.country} />
              <InfoRow label="T-shirt size" value={a.tshirt} />
            </dl>
          </Card>

          {/* Trip & preferences */}
          <Card className="sd-card">
            <h2 className="sd-card__title">Trip details</h2>
            <dl className="sd-info-grid sd-info-grid--3">
              <InfoRow label="Group type" value={a.group_type} />
              <InfoRow label="Companions" value={a.companion_count ?? companions.length} />
              <InfoRow label="Guest count" value={a.guest_count ?? totalGuests} />
              <InfoRow label="Arrival time" value={a.arrival_time} />
              <InfoRow label="Purpose of stay" value={a.special_occasion} />
              <InfoRow label="Consent" value={a.accept_terms} />
            </dl>
          </Card>

          <Card className="sd-card">
            <h2 className="sd-card__title">Health & preferences</h2>
            <dl className="sd-info-grid sd-info-grid--3">
              <InfoRow label="Allergies" value={a.allergies} />
              <InfoRow label="Medical conditions" value={a.medical_conditions} />
              <InfoRow label="Eat meat" value={a.eat_meat} />
              <InfoRow label="Eat fish" value={a.eat_fish} />
            </dl>
            {(a.additional_requests || a.special_requests) && (
              <div className="sd-note-block">
                <span className="sd-note-block__label">Additional requests</span>
                <p className="sd-note-block__text">{formatValue(a.additional_requests ?? a.special_requests)}</p>
              </div>
            )}
          </Card>
        </div>

        {/* ── Right column: Booking + Timeline ── */}
        <div className="sd-col-side">
          <Card className="sd-card">
            <h2 className="sd-card__title">Booking summary</h2>
            <dl className="sd-info-list">
              <InfoRow label="Property" value={s.linkedBooking.propertyName} />
              <InfoRow label="Stay dates" value={formatDateRange(s.linkedBooking.checkIn, s.linkedBooking.checkOut)} />
              <InfoRow label="Booking ref" value={s.bookingReference} />
              <InfoRow label="Order number" value={s.shopifyOrderNumber} />
              <InfoRow label="Form" value={s.formTitle} />
              <InfoRow label="Created" value={formatDate(s.createdAt)} />
              <InfoRow label="Updated" value={formatDate(s.updatedAt)} />
            </dl>
          </Card>

          {s.timeline.length > 0 && (
            <Card className="sd-card">
              <h2 className="sd-card__title">Timeline</h2>
              <div className="sd-timeline">
                {s.timeline.map((event) => (
                  <article key={event.id} className="sd-timeline__item">
                    <div className="sd-timeline__dot" aria-hidden="true" />
                    <div className="sd-timeline__content">
                      <strong>{event.title}</strong>
                      <p>{event.description}</p>
                      <small>{formatDate(event.occurredAt)}</small>
                    </div>
                  </article>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* ── Companions table (full width) ── */}
      {companions.length > 0 && (
        <Card className="sd-card">
          <div className="sd-card__header">
            <h2 className="sd-card__title">Companions ({companions.length})</h2>
            <span className="sd-card__badge">{totalGuests} total guests</span>
          </div>

          <div className="sd-companion-table-wrap">
            <table className="sd-companion-table">
              <thead>
                <tr>
                  <th className="sd-companion-table__th--num">#</th>
                  <th>Guest</th>
                  <th>Age</th>
                  <th>Allergies</th>
                  <th>Meat</th>
                  <th>Fish</th>
                </tr>
              </thead>
              <tbody>
                <tr className="sd-companion-table__row--primary">
                  <td><span className="sd-companion-rank">1</span></td>
                  <td>
                    <div className="sd-companion-identity">
                      <strong>{formatValue(a.guest_name ?? s.guestName)}</strong>
                      <span>Primary guest</span>
                    </div>
                  </td>
                  <td>{formatValue(a.guest_age)}</td>
                  <td>{formatValue(a.allergies)}</td>
                  <td><YesNoBadge value={a.eat_meat} /></td>
                  <td><YesNoBadge value={a.eat_fish} /></td>
                </tr>
                {companions.map((c) => (
                  <tr key={c.index}>
                    <td><span className="sd-companion-rank">{c.index + 1}</span></td>
                    <td>
                      <div className="sd-companion-identity">
                        <strong>{formatValue(c.name)}</strong>
                        <span>{getOrdinal(c.index + 1)} guest</span>
                      </div>
                    </td>
                    <td>{formatValue(c.age)}</td>
                    <td>{formatValue(c.allergies)}</td>
                    <td><YesNoBadge value={c.eatMeat} /></td>
                    <td><YesNoBadge value={c.eatFish} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
