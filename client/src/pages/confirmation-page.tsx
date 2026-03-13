import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorAlert } from "@/components/feedback/error-alert";
import { LoadingPanel } from "@/components/feedback/loading-panel";
import { MultiStepForm } from "@/features/form-system/components/multi-step-form";
import { getConfirmationPayload, submitConfirmation } from "@/features/form-system/form-system-api";
import { ApiError } from "@/lib/api/types";

export default function ConfirmationPage(): React.JSX.Element {
  const { token } = useParams();
  const confirmationQuery = useQuery({
    queryKey: ["confirmation", token],
    queryFn: () => getConfirmationPayload(String(token)),
    enabled: Boolean(token),
  });

  const submitMutation = useMutation({
    mutationFn: (answers: Record<string, string | boolean>) =>
      submitConfirmation(String(token), answers),
  });

  if (!token) {
    return (
      <div className="typeform-page">
        <EmptyState label="Invalid link" title="Invalid confirmation link" message="This confirmation link is missing a token." />
      </div>
    );
  }

  if (confirmationQuery.isLoading) {
    return (
      <div className="typeform-page">
        <LoadingPanel label="Loading confirmation form" />
      </div>
    );
  }

  if (confirmationQuery.error) {
    if (confirmationQuery.error instanceof ApiError && [404, 410].includes(confirmationQuery.error.status ?? 0)) {
      return (
        <div className="typeform-page">
          <EmptyState
            label="Unavailable"
            title="Confirmation unavailable"
            message="This confirmation link is invalid, expired, or has already been completed."
          />
        </div>
      );
    }

    return (
      <div className="typeform-page">
        <ErrorAlert message={String(confirmationQuery.error.message)} />
      </div>
    );
  }

  if (!confirmationQuery.data) {
    return (
      <div className="typeform-page">
        <EmptyState label="Not found" title="Confirmation not found" message="This confirmation link is invalid or expired." />
      </div>
    );
  }

  const { form, submission } = confirmationQuery.data;

  if (submission.status === "completed") {
    return (
      <div className="typeform-page">
        <EmptyState
          label="Completed"
          title="Confirmation already completed"
          message="This confirmation link has already been used and can no longer be accessed."
        />
      </div>
    );
  }

  return (
    <div className="typeform-page">
      {submitMutation.error ? <ErrorAlert message={String(submitMutation.error.message)} /> : null}

      <MultiStepForm
        form={form}
        initialAnswers={submission.answers}
        isSubmitting={submitMutation.isPending}
        onSubmit={submitMutation.mutateAsync}
      />
    </div>
  );
}

