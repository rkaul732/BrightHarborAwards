"use client";

import { PROGRAMS } from "../lib/programs";

export default function ProgramPicker({ value, onChange, id = "signup-programs" }: {
  value: string[];
  onChange: (programs: string[]) => void;
  id?: string;
}) {
  return <fieldset className="program-picker" aria-describedby={`${id}-hint`}>
    <legend>Programs <span aria-hidden="true">*</span></legend>
    <p id={`${id}-hint`}>Select every program you work in. Choose at least one.</p>
    <div className="program-options">
      {PROGRAMS.map((program) => <label key={program}>
        <input type="checkbox" name="programs" value={program} checked={value.includes(program)}
          onChange={(event) => onChange(event.target.checked ? [...value, program] : value.filter((item) => item !== program))} />
        <span>{program}</span>
      </label>)}
    </div>
    <small>{value.length} {value.length === 1 ? "program" : "programs"} selected</small>
  </fieldset>;
}
