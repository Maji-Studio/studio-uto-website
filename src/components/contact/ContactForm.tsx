import ContactFormScript from "./ContactForm.client";
import "./ContactForm.css";

/*
 * The booking/contact form. Each field is a transparent input riding a hairline
 * with a floating label — at rest the label sits on the line (matching the
 * identity's "everything is a form field" language); on focus or once filled it
 * shrinks and rises out of the way. Pure CSS via :placeholder-shown, so it works
 * without JS.
 *
 * Submission is progressive: the <form> posts to a mailto: action as a no-JS
 * fallback, and ContactForm.script.ts enhances that into a composed mail draft
 * (subject + labelled body) opened in the visitor's mail client. No backend is
 * wired yet — swap the action/handler for a real endpoint (Formspree, a Worker,
 * etc.) when one exists; the field `name`s already carry the payload.
 */
const fields = [
  {
    name: "name",
    label: "Name",
    type: "text",
    required: true,
    autoComplete: "name",
  },
  {
    name: "firma",
    label: "Firma",
    type: "text",
    required: false,
    autoComplete: "organization",
  },
  {
    name: "adresse",
    label: "Adresse",
    type: "text",
    required: false,
    autoComplete: "street-address",
  },
  {
    name: "email",
    label: "Email",
    type: "email",
    required: true,
    autoComplete: "email",
  },
  {
    name: "telefon",
    label: "Telefon",
    type: "tel",
    required: false,
    autoComplete: "tel",
  },
] as const;

export default function ContactForm({ email }: { email: string }) {
  return (
    <form
      className="cform"
      data-email={email}
      action={`mailto:${email}`}
      method="post"
      encType="text/plain"
      noValidate
    >
      {fields.map((field) => (
        <p className="field" key={field.name}>
          <input
            className="field__input"
            id={`f-${field.name}`}
            name={field.name}
            type={field.type}
            placeholder=" "
            required={field.required}
            aria-required={field.required ? "true" : undefined}
            autoComplete={field.autoComplete}
          />
          <label className="field__label" htmlFor={`f-${field.name}`}>
            {field.label}{" "}
            {field.required && (
              <span className="field__req" aria-hidden="true">
                *
              </span>
            )}
          </label>
        </p>
      ))}

      <p className="field field--area">
        <textarea
          className="field__input field__textarea"
          id="f-nachricht"
          name="nachricht"
          rows={3}
          placeholder=" "
          required
          aria-required="true"
        ></textarea>
        <label className="field__label" htmlFor="f-nachricht">
          Nachricht{" "}
          <span className="field__req" aria-hidden="true">
            *
          </span>
        </label>
      </p>

      {/* Honeypot — hidden from people, tempting to bots. Filled ⇒ silently dropped. */}
      <div className="hp" aria-hidden="true">
        <label htmlFor="f-website">Website</label>
        <input
          id="f-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <button className="cform__submit" type="submit" data-label="Absenden">
        Absenden
      </button>

      <p className="cform__status" role="status" aria-live="polite"></p>
      <ContactFormScript />
    </form>
  );
}
