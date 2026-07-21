import Waitlist from './Waitlist.jsx';

// Site-wide early-access CTA rendered at the bottom of every page. Reuses the shared
// Waitlist form; a top border divides it from the page content above.
export default function FooterCTA() {
  return (
    <section className="footer-cta" aria-label="Get early access">
      <Waitlist
        heading="Want in early?"
        sub="Roast and Rake is coming to the App Store. Drop your info and we’ll let you know when it’s live."
        footNote="The Insult Jar is free. Always will be."
      />
    </section>
  );
}
