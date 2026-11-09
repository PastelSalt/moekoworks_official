// Structured data (JSON-LD) shared by every public page, so search engines read one linked picture:
// Kyle Zoleta (the person) runs Moeko Works (the brand and this site) and made each project.
// The Person @id below is also used by the project sites themselves (Aqua Iro Archive, the Kotoha and Hanon fan
// sites, Himawari): keep it stable, or those sites stop joining to this one.
import { site } from "@/lib/site";

export const base = site.url.replace(/\/$/, "");
export const ids = {
  website: `${base}/#website`,
  person: `${base}/#person`,
  profile: `${base}/#profile`,
  works: `${base}/history#works`,
};

/** Profiles that are the same person: what Google uses to build a knowledge panel for the name. */
const sameAs = site.socials.filter((s) => s.id !== "email").map((s) => s.href);

export function personNode(knowsAbout: string[] = []) {
  return {
    "@type": "Person",
    "@id": ids.person,
    name: site.owner,
    url: `${base}/`,
    image: `${base}/opengraph-image.jpg`,
    jobTitle: "Web developer",
    description: `${site.owner} makes creative websites and the systems behind them, as ${site.name}.`,
    brand: { "@type": "Brand", name: site.name },
    ...(knowsAbout.length ? { knowsAbout } : {}),
    sameAs,
  };
}

export function websiteNode() {
  return {
    "@type": "WebSite",
    "@id": ids.website,
    name: site.name,
    alternateName: [`${site.name} by ${site.owner}`, `${site.owner} portfolio`, `${site.owner}`],
    url: `${base}/`,
    description: site.intro,
    inLanguage: "en",
    author: { "@id": ids.person },
    publisher: { "@id": ids.person },
  };
}

export function breadcrumbs(items: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: `${base}${it.path}` })),
  };
}

/** The list of works, newest first, pointing at each case study. */
export function worksList(projects: { slug: string; title: string }[]) {
  return {
    "@type": "ItemList",
    "@id": ids.works,
    name: `Projects by ${site.owner}`,
    numberOfItems: projects.length,
    itemListElement: projects.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: `${base}/history/${p.slug}`, name: p.title })),
  };
}

export function graph(...nodes: object[]) {
  return { "@context": "https://schema.org", "@graph": nodes };
}

/** For a <script type="application/ld+json">: escapes "<" so the JSON can't close the tag. */
export const ldHtml = (data: object) => ({ __html: JSON.stringify(data).replace(/</g, "\\u003c") });
