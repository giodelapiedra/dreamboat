import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

import { listingFilterSchema, type ListingFilterValues } from "./listings-schemas";

interface ListingFiltersProps {
  initialValues: ListingFilterValues;
  onSubmit: (values: ListingFilterValues) => void;
}

export function ListingFilters({ initialValues, onSubmit }: ListingFiltersProps): React.JSX.Element {
  const [values, setValues] = useState<ListingFilterValues>(initialValues);

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  function updateValue<Key extends keyof ListingFilterValues>(key: Key, value: ListingFilterValues[Key]): void {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    onSubmit(listingFilterSchema.parse(values));
  }

  function reset(): void {
    const defaults = listingFilterSchema.parse({});
    setValues(defaults);
    onSubmit(defaults);
  }

  return (
    <form className="filters surface-card" onSubmit={handleSubmit}>
      <div className="filters__grid">
        <Field label="Search">
          <Input
            placeholder="Beachfront, resort, villa..."
            value={values.search}
            onChange={(event) => updateValue("search", event.target.value)}
          />
        </Field>
        <Field label="Location">
          <Input value={values.location} onChange={(event) => updateValue("location", event.target.value)} />
        </Field>
        <Field label="Category">
          <Input value={values.category} onChange={(event) => updateValue("category", event.target.value)} />
        </Field>
        <Field label="Guests">
          <Input value={values.guestCount} onChange={(event) => updateValue("guestCount", event.target.value)} />
        </Field>
        <Field label="Check in">
          <Input type="date" value={values.checkIn} onChange={(event) => updateValue("checkIn", event.target.value)} />
        </Field>
        <Field label="Check out">
          <Input type="date" value={values.checkOut} onChange={(event) => updateValue("checkOut", event.target.value)} />
        </Field>
        <Field label="Min price">
          <Input type="number" value={values.minPrice} onChange={(event) => updateValue("minPrice", event.target.value)} />
        </Field>
        <Field label="Max price">
          <Input type="number" value={values.maxPrice} onChange={(event) => updateValue("maxPrice", event.target.value)} />
        </Field>
        <Field label="Amenities" hint="Comma-separated, for example wifi,pool,parking">
          <Input value={values.amenities} onChange={(event) => updateValue("amenities", event.target.value)} />
        </Field>
        <Field label="Sort">
          <Select value={values.sort} onChange={(event) => updateValue("sort", event.target.value as ListingFilterValues["sort"])}>
            <option value="newest">Newest</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </Select>
        </Field>
      </div>
      <div className="filters__actions">
        <Button type="submit">Apply filters</Button>
        <Button type="button" variant="ghost" onClick={reset}>
          Reset
        </Button>
      </div>
    </form>
  );
}
