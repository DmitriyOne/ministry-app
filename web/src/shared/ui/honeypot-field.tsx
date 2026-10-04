// A decoy field: bots that fill in every input on a form trip it, real
// visitors never see or reach it. Purely "dumb" markup — no validation, no
// submit handling, no business meaning attached to the field name. The
// caller reads its value off the native <form> at submit time (see
// shared/ui/pill-form.tsx's FormData read) and decides what a filled-in
// value means (features/join-waitlist pretends success without saving
// anything or calling the server).
//
// Hiding technique, chosen from current guidance rather than copied from
// an old tutorial: `display: none`/`visibility: hidden` alone is a
// pattern some bots already check for and skip, so the field stays laid
// out and is instead pushed off-screen (absolute positioning, far
// negative offset) and clipped to a single pixel — closer to what a
// careless bot's DOM scan would still consider "a normal, fillable
// field". `aria-hidden` on the wrapper removes it from the accessibility
// tree entirely (screen readers never announce it), `tabIndex={-1}` keeps
// it out of the keyboard tab order, and `autoComplete="off"` stops a
// browser's own autofill from populating it and creating a false
// positive for a genuine visitor.
type HoneypotFieldProps = {
  name: string;
  label: string;
};

export const HoneypotField = ({ name, label }: HoneypotFieldProps) => (
  <div aria-hidden="true" className="pointer-events-none absolute left-[-9999px] top-[-9999px] h-px w-px overflow-hidden">
    <label htmlFor={name}>{label}</label>
    <input id={name} name={name} type="text" tabIndex={-1} autoComplete="off" />
  </div>
);
