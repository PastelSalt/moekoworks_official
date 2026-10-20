import type { Metadata } from "next";
import { PageHead } from "@/components/site/PageHead";
import { site } from "@/lib/site";
import "@/styles/pages.css";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What Moeko Works collects, why, how long it is kept and your rights under the Philippine Data Privacy Act of 2012.",
  alternates: { canonical: "/privacy" },
};

const UPDATED = "4 October 2026";

export default function PrivacyPage() {
  return (
    <>
      <PageHead label="Privacy" title="Privacy notice" giant="PRIVACY" micro={<span>Updated {UPDATED}</span>}>
        <p>
          Plain-language notice for {site.url.replace(/^https?:\/\//, "")}, written with the Philippine Data Privacy Act of 2012 (Republic Act No. 10173) in mind. The short version: no tracking cookies, no ads, and
          your messages are only used to reply to you.
        </p>
      </PageHead>

      <section className="wrap section legal">
        <div className="legal__card paper reveal">
          <h2>Who is responsible</h2>
          <p>
            This site is the personal portfolio of {site.owner}, published as {site.name}. For anything about your data, e-mail <a href={`mailto:${site.email}`}>{site.email}</a>.
          </p>
        </div>

        <div className="legal__card paper reveal">
          <h2>What is collected, and why</h2>
          <ul>
            <li>
              <strong>Messages you send through the contact form:</strong> your name, e-mail address, subject and message, so I can read and answer it. With each message the site also keeps a few technical details to
              keep spam out: the page it came from, the referring site, your approximate country (from the hosting provider), and your device type and browser family.
            </li>
            <li>
              <strong>Anonymous visit statistics:</strong> which pages are viewed and for how long, clicks on project links and media, the referring site, approximate country, and device, browser and operating-system
              family. No cookies are used and IP addresses are never stored: visits are counted with a hash that changes every day, so they can&apos;t be linked across days or back to you.
            </li>
          </ul>
        </div>

        <div className="legal__card paper reveal">
          <h2>Cookies and browser storage</h2>
          <p>
            Visitors get no cookies. The site remembers two small preferences in your own browser: whether you turned motion off (<code>mw_motion</code>, local storage) and that you have already seen the loading
            screen in this tab (<code>mw_splash</code>, session storage). The private admin area uses one strictly necessary sign-in cookie for the site owner only.
          </p>
        </div>

        <div className="legal__card paper reveal">
          <h2>How long it is kept</h2>
          <ul>
            <li>Messages: until I delete them. Messages in Spam or Trash are deleted automatically after 30 days.</li>
            <li>Detailed visit events: 90 days. After that, only daily totals remain.</li>
          </ul>
        </div>

        <div className="legal__card paper reveal">
          <h2>Who processes it</h2>
          <p>The site runs on services that process data on my behalf:</p>
          <ul>
            <li>Vercel: hosting and delivery.</li>
            <li>Neon: the database (Singapore region).</li>
            <li>Cloudinary: storage and delivery of images and videos.</li>
          </ul>
          <p>Nothing is sold or shared for advertising.</p>
        </div>

        <div className="legal__card paper reveal">
          <h2>Your rights</h2>
          <p>
            You may ask to see, correct or delete the personal data I hold about you, object to its processing, or ask for a copy. E-mail <a href={`mailto:${site.email}`}>{site.email}</a> and I&apos;ll reply as soon
            as I can. You can also lodge a complaint with the National Privacy Commission of the Philippines.
          </p>
          <p className="legal__meta">Last updated: {UPDATED}.</p>
        </div>
      </section>
    </>
  );
}
