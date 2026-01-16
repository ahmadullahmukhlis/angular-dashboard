export type FieldType =
  | 'text'
  | 'number'
  | 'password'
  | 'select'
  | 'multi-select'
  | 'server-select'
  | 'radio'
  | 'file'
  | 'date'
  | 'textarea'
  | 'editor'
  | 'checkbox'
  | 'switch'
  | 'div';

export interface DynamicField {
  type: FieldType;

  name: string;
  label: string;

  defaultValue?: any;
  disabled: boolean;
  required?: boolean;

  className?: string;

  options?: any[];

  /* conditional show */
  show?: (values: any) => boolean;

  /* validation */
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;

  /* server select */
  url?: string | ((values: any) => string);
  optionLabel?: string;
  optionValue?: string;

  /* mapping */
  changeValue?: string;
  onSelect?: (row: any) => void;

  onChange?: (value: any) => void;
}
