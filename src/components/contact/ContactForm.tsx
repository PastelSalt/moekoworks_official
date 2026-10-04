"use client";

import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import FormLabel from "@mui/material/FormLabel";
import OutlinedInput from "@mui/material/OutlinedInput";
import { Send } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { Flower } from "@/components/decor/Decor";
import { flowerBurst } from "@/lib/confetti";
import { site } from "@/lib/site";
import { track } from "@/lib/track";
import { type ContactState, contactToken, sendMessage } from "@/server/actions/contact";

type FieldProps = { name: "name" | "email" | "subject" | "message"; label: string; type?: string; autoComplete?: string; max: number; multiline?: boolean; value?: string; error?: string };

/** Label above the field (friendlier than a floating label), MUI input, inline error announced to screen readers. */
function Field({ name, label, type = "text", autoComplete, max, multiline, value, error }: FieldProps) {
  const id = `cf-${name}`;
  return (
    <FormControl fullWidth required error={Boolean(error)} className="cfield">
      <FormLabel htmlFor={id} className="cfield__label">
        {label}
      </FormLabel>
      <OutlinedInput
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        defaultValue={value}
        multiline={multiline}
        minRows={multiline ? 6 : undefined}
        inputProps={{ maxLength: max, "aria-describedby": error ? `${id}-error` : undefined }}
      />
      {error ? (
        <FormHelperText id={`${id}-error`} role="alert">
          {error}
        </FormHelperText>
      ) : null}
    </FormControl>
  );
}

function Form({ onSent }: { onSent: () => void }) {
  const [state, action, pending] = useActionState<ContactState, FormData>(sendMessage, undefined);
  const token = useRef<HTMLInputElement>(null);
  const ref = useRef<HTMLInputElement>(null);
  const armed = useRef(false);

  // The signed start time is fetched when the visitor starts filling the form (the page itself is static).
  const arm = () => {
    if (armed.current) return;
    armed.current = true;
    track({ t: "contact_start" });
    if (ref.current) ref.current.value = document.referrer;
    contactToken()
      .then((t) => {
        if (token.current) token.current.value = t;
      })
      .catch(() => (armed.current = false));
  };

  useEffect(() => {
    if (state?.ok) onSent();
  }, [state, onSent]);

  const v = state?.values;
  const f = state?.fields ?? {};
  return (
    <form action={action} className="cform" onFocus={arm} noValidate>
      <div className="cform__row">
        <Field name="name" label="Name" autoComplete="name" max={100} value={v?.name} error={f.name} />
        <Field name="email" label="E-mail" type="email" autoComplete="email" max={254} value={v?.email} error={f.email} />
      </div>
      <Field name="subject" label="Subject" max={150} value={v?.subject} error={f.subject} />
      <Field name="message" label="Message" multiline max={5000} value={v?.message} error={f.message} />

      {/* honeypot: people never see or fill this */}
      <div className="visually-hidden" aria-hidden="true">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <input ref={token} type="hidden" name="t" />
      <input ref={ref} type="hidden" name="ref" />

      <p className="cform__error" role="alert" aria-live="assertive">
        {state?.error ?? ""}
      </p>
      <div className="cform__actions">
        <button type="submit" className="btn" disabled={pending}>
          <Send size={18} aria-hidden="true" />
          {pending ? "Sending…" : "Send message"}
        </button>
        <p className="cform__note">
          I only use your details to reply to you. See the <Link href="/privacy">Privacy notice</Link>.
        </p>
      </div>
    </form>
  );
}

/** The lilac paper form card (plan §8.4). On success: flower confetti + "Message sent! Thank you ✿". */
export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [round, setRound] = useState(0);
  const card = useRef<HTMLDivElement>(null);

  return (
    <div ref={card} className="cform-card paper paper--lilac">
      <p className="micro cform-card__label">
        <b>No.02</b> Message form
      </p>
      {sent ? (
        <div className="cform__done" role="status" aria-live="polite">
          <Flower tone="pink" size={64} outline className="float" />
          <p className="cform__done-title">Message sent! Thank you ✿</p>
          <p className="cform__done-sub">{site.replyNote}</p>
          <button
            type="button"
            className="btn btn--white"
            onClick={() => {
              setSent(false);
              setRound((r) => r + 1);
            }}
          >
            Write another message
          </button>
        </div>
      ) : (
        <Form
          key={round}
          onSent={() => {
            track({ t: "contact_submit" });
            setSent(true);
            flowerBurst(card.current);
          }}
        />
      )}
    </div>
  );
}
