export type Nullable<T> = T | null | undefined;

export type DisplayNameSource = {
  label?: Nullable<string>;
  title?: Nullable<string>;
  name?: Nullable<string>;
  child_name?: Nullable<string>;
  preferred_name?: Nullable<string>;
  first_name?: Nullable<string>;
  surname?: Nullable<string>;
  family_name?: Nullable<string>;
  last_name?: Nullable<string>;
};

export type YearLabelSource = {
  yearLabel?: Nullable<string>;
  year_label?: Nullable<string>;
  year_level?: Nullable<string | number>;
};

export type EvidenceTextSource = {
  summary?: Nullable<string>;
  body?: Nullable<string>;
  note?: Nullable<string>;
};
