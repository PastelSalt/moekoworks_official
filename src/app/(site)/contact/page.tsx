import { Clock, Mail } from "lucide-react";
import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/ContactForm";
import { CopyEmail } from "@/components/contact/CopyEmail";
import { Flower, Sticker } from "@/components/decor/Decor";
import { PageHead } from "@/components/site/PageHead";
import { SocialIcon } from "@/components/site/SocialIcon";
import { site } from "@/lib/site";
import "@/styles/pages.css";

export const metadata: Metadata = {
  title: "Contact",
  description: "Questions about Kyle Zoleta or the projects on Moesoft? Send a message.",
  alternates: { canonical: "/contact" },
};

const ASK = ["How something in one of my projects works.", "A bug or typo you spotted.", "Anything else about me or Moesoft, or just a kind word ✿"];

export default function ContactPage() {
  const github = site.socials.find((s) => s.id === "github")!;
  const facebook = site.socials.find((s) => s.id === "facebook")!;
  return (
    <>
      <PageHead
        label="Contact"
        title="Contact"
        giant="HELLO"
        micro={
          <>
            <span>
              <b>No.02</b> Message
            </span>
            <span>Replies in 1–2 days</span>
            <span>GMT+8</span>
          </>
        }
      />

      <section className="wrap section contact">
        <div className="contact__grid">
          <div className="contact__info">
            <p className="contact__intro reveal">
              Questions about me or my projects? Ask away! I read every message myself and usually reply within a day or two (Philippine time, GMT+8).
            </p>

            <ul className="contact__list paper reveal">
              <li>
                <span className="contact__icon" aria-hidden="true">
                  <Mail size={18} />
                </span>
                <span className="contact__what">
                  <span className="micro">E-mail</span>
                  <a href={`mailto:${site.email}`}>{site.email}</a>
                </span>
                <CopyEmail email={site.email} />
              </li>
              <li>
                <span className="contact__icon" aria-hidden="true">
                  <SocialIcon id="github" />
                </span>
                <span className="contact__what">
                  <span className="micro">GitHub</span>
                  <a href={github.href} target="_blank" rel="noopener noreferrer me">
                    @{github.handle}
                  </a>
                </span>
              </li>
              <li>
                <span className="contact__icon" aria-hidden="true">
                  <SocialIcon id="facebook" />
                </span>
                <span className="contact__what">
                  <span className="micro">Facebook</span>
                  <a href={facebook.href} target="_blank" rel="noopener noreferrer me">
                    {facebook.handle}
                  </a>
                </span>
              </li>
              <li className="contact__reply">
                <span className="contact__icon" aria-hidden="true">
                  <Clock size={18} />
                </span>
                <span className="contact__what">
                  <span className="micro">Reply time</span>
                  <span>{site.replyNote}</span>
                </span>
              </li>
            </ul>

            <div className="ask paper paper--dots reveal">
              <Sticker tone="blue" tilt={-5} className="ask__sticker" decorative>
                What can I ask?
              </Sticker>
              <ul className="ask__list">
                {ASK.map((q) => (
                  <li key={q}>
                    <Flower tone="pink" size={16} />
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="contact__form reveal">
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
