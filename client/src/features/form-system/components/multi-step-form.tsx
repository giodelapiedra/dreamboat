import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import type { AnswerValue, FormDefinition, FormField } from "../form-system-types";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface MultiStepFormProps {
  form: FormDefinition;
  initialAnswers?: Record<string, AnswerValue>;
  isSubmitting: boolean;
  onSubmit: (answers: Record<string, AnswerValue>) => void | Promise<unknown>;
}

interface Question {
  fieldId: string;
  label: string;
  helperText?: string;
  type: FormField["type"];
  options?: { label: string; value: string }[];
  placeholder?: string;
  required: boolean;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getOrdinal(n: number): string {
  const suffixes = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]}`;
}

function buildQuestions(
  steps: FormDefinition["steps"],
  answers: Record<string, AnswerValue>,
): Question[] {
  const questions: Question[] = [];

  for (const step of steps) {
    for (const field of step.fields) {
      questions.push({
        fieldId: field.id,
        label: field.label,
        helperText: field.helperText,
        type: field.type,
        options: field.options,
        placeholder: field.placeholder,
        required: field.required,
      });

      // After companion_count, inject dynamic companion questions
      if (field.id === "companion_count") {
        const count = parseInt(String(answers.companion_count ?? "0"), 10);

        for (let i = 1; i <= count; i++) {
          const ordinal = getOrdinal(i + 1); // booker = 1st, companions start at 2nd

          questions.push(
            {
              fieldId: `companion_${i}_name`,
              label: `What is ${ordinal} Guest's Full name?`,
              helperText: "First and Last Name is required",
              type: "short-text",
              placeholder: "Type your answer here...",
              required: true,
            },
            {
              fieldId: `companion_${i}_age`,
              label: `What is ${ordinal} Guest's age?`,
              helperText: "Must be aged 12 and above. Proof of age will be required.",
              type: "short-text",
              placeholder: "Type your answer here...",
              required: true,
            },
            {
              fieldId: `companion_${i}_allergies`,
              label: `Does the ${ordinal} Guest have any allergies?`,
              helperText: "Select one or choose 'Other' to specify.",
              type: "select-or-other",
              options: [
                { label: "No allergies", value: "No allergies" },
                { label: "Shrimp / Shellfish allergy", value: "Shrimp / Shellfish allergy" },
                { label: "Peanut allergy", value: "Peanut allergy" },
                { label: "Seafood allergy", value: "Seafood allergy" },
                { label: "Dairy / Lactose intolerance", value: "Dairy / Lactose intolerance" },
                { label: "Gluten intolerance", value: "Gluten intolerance" },
                { label: "Egg allergy", value: "Egg allergy" },
                { label: "Other", value: "__other__" },
              ],
              required: true,
            },
            {
              fieldId: `companion_${i}_eat_meat`,
              label: `Does the ${ordinal} Guest eat meat?`,
              type: "select",
              options: [
                { label: "YES", value: "YES" },
                { label: "NO", value: "NO" },
              ],
              required: true,
            },
            {
              fieldId: `companion_${i}_eat_fish`,
              label: `Does the ${ordinal} Guest eat fish?`,
              type: "select",
              options: [
                { label: "YES", value: "YES" },
                { label: "NO", value: "NO" },
              ],
              required: true,
            },
          );
        }
      }
    }
  }

  return questions;
}

/* ------------------------------------------------------------------ */
/*  Render single input                                                */
/* ------------------------------------------------------------------ */

function SelectOrOtherInput({
  options,
  placeholder,
  value,
  onChange,
}: {
  options: { label: string; value: string }[];
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const isOther = value !== "" && !options.some((o) => o.value === value);
  const [showOther, setShowOther] = useState(isOther);

  function handleSelect(selected: string) {
    if (selected === "__other__") {
      setShowOther(true);
      onChange("");
    } else {
      setShowOther(false);
      onChange(selected);
    }
  }

  return (
    <div className="typeform-select-or-other">
      <Select
        value={showOther ? "__other__" : value}
        onChange={(e) => handleSelect(e.target.value)}
      >
        <option value="">Select an option</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
      {showOther && (
        <Input
          type="text"
          placeholder={placeholder ?? "Please specify..."}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoFocus
        />
      )}
    </div>
  );
}

function renderQuestionInput(
  question: Question,
  value: AnswerValue | undefined,
  onChange: (v: AnswerValue) => void,
): React.ReactNode {
  if (question.type === "select-or-other") {
    return (
      <SelectOrOtherInput
        options={question.options ?? []}
        placeholder={question.placeholder}
        value={typeof value === "string" ? value : ""}
        onChange={onChange}
      />
    );
  }

  if (question.type === "textarea") {
    return (
      <Textarea
        rows={4}
        placeholder={question.placeholder ?? "Type your answer here..."}
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  if (question.type === "select") {
    return (
      <Select
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select an option</option>
        {question.options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
    );
  }

  if (question.type === "boolean") {
    return (
      <label className="typeform-checkbox">
        <input
          type="checkbox"
          checked={value === true}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span>{question.label}</span>
      </label>
    );
  }

  const inputTypeMap: Record<string, string> = {
    "short-text": "text",
    email: "email",
    phone: "tel",
    date: "date",
  };

  return (
    <Input
      type={inputTypeMap[question.type] ?? "text"}
      placeholder={question.placeholder ?? "Type your answer here..."}
      value={typeof value === "string" ? value : ""}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function MultiStepForm({
  form,
  initialAnswers,
  isSubmitting,
  onSubmit,
}: MultiStepFormProps): React.JSX.Element {
  const [questionIndex, setQuestionIndex] = useState(-1); // -1 = welcome
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>(
    initialAnswers ?? {},
  );
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const questions = useMemo(
    () => buildQuestions(form.steps, answers),
    [form.steps, answers],
  );

  // Clamp index if questions list shrank (e.g. companion_count decreased)
  const safeIndex = Math.min(questionIndex, questions.length - 1);
  const currentQuestion = safeIndex >= 0 ? questions[safeIndex] : null;

  /* ---- handlers ---- */

  function setAnswer(fieldId: string, value: AnswerValue): void {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
    setError(null);
  }

  function validate(): boolean {
    if (!currentQuestion) return false;
    if (!currentQuestion.required) return true;

    const value = answers[currentQuestion.fieldId];

    if (currentQuestion.type === "boolean") {
      if (value !== true) {
        setError("Please confirm before continuing");
        return false;
      }
      return true;
    }

    if (!String(value ?? "").trim()) {
      setError("This field is required");
      return false;
    }

    return true;
  }

  async function handleOk(): Promise<void> {
    if (!validate()) return;
    setError(null);

    // Last question → submit
    if (safeIndex === questions.length - 1) {
      await onSubmit(answers);
      setIsComplete(true);
      return;
    }

    setQuestionIndex(safeIndex + 1);
  }

  function handleBack(): void {
    if (safeIndex > 0) {
      setQuestionIndex(safeIndex - 1);
      setError(null);
    } else if (safeIndex === 0) {
      setQuestionIndex(-1);
      setError(null);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent): void {
    if (e.key === "Enter" && !e.shiftKey && currentQuestion?.type !== "textarea") {
      e.preventDefault();
      void handleOk();
    }
  }

  /* ---- welcome screen ---- */

  if (questionIndex === -1) {
    return (
      <div className="typeform-center">
        <blockquote className="typeform-welcome__quote">
          {form.description}
        </blockquote>
        <Button onClick={() => setQuestionIndex(0)}>Continue</Button>
      </div>
    );
  }

  /* ---- completion screen ---- */

  if (isComplete) {
    return (
      <div className="typeform-center typeform-complete">
        <h1 className="typeform-complete__title">{form.completionTitle}</h1>
        <p className="typeform-complete__message">{form.completionMessage}</p>
      </div>
    );
  }

  /* ---- question screen ---- */

  if (!currentQuestion) return <></>;

  const questionNumber = safeIndex + 1;

  return (
    <div className="typeform-center" onKeyDown={handleKeyDown}>
      <div className="typeform-question">
        <div className="typeform-question__header">
          <span className="typeform-question__badge">{questionNumber}</span>
          <h2 className="typeform-question__label">
            {currentQuestion.type === "boolean" ? "Confirmation" : currentQuestion.label}
            {currentQuestion.required && <span className="typeform-required">*</span>}
          </h2>
        </div>
        {currentQuestion.helperText && (
          <p className="typeform-question__hint">{currentQuestion.helperText}</p>
        )}
      </div>

      <div className="typeform-question__input">
        {renderQuestionInput(
          currentQuestion,
          answers[currentQuestion.fieldId],
          (v) => setAnswer(currentQuestion.fieldId, v),
        )}
      </div>

      {error && <p className="typeform-error">{error}</p>}

      <div className="typeform-actions">
        {safeIndex > 0 && (
          <Button variant="ghost" onClick={handleBack} disabled={isSubmitting}>
            Back
          </Button>
        )}
        <Button onClick={() => void handleOk()} disabled={isSubmitting}>
          {isSubmitting
            ? "Submitting..."
            : safeIndex === questions.length - 1
              ? form.submitLabel
              : "OK"}
        </Button>
      </div>
    </div>
  );
}
