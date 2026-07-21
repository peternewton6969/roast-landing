import FooterCTA from './FooterCTA.jsx';

export default function Features() {
  return (
    <main className="mission">
      <h1 className="mission-title">Features</h1>

      <p className="mission-lead">We built the scoring app golfers actually deserve.</p>

      <p>
        Not the one that makes you squint at a spreadsheet. Not the one that crashes on hole 14. The
        one that handles every bet, tracks every debt, and still has time to remind you that Brooks
        three-putted from four feet.
      </p>

      <hr className="mission-rule" />

      <h2 className="mission-h">Games</h2>

      <p>
        Roast and Rake supports 15 to 20 of the most popular formats in recreational golf and we are
        adding more.
      </p>

      <h3 className="mission-sub">Team Games</h3>
      <p>Best Ball, Scramble, and more coming at launch.</p>

      <h3 className="mission-sub">Individual Games</h3>
      <p>Skins, Wolf, and more coming at launch.</p>

      <h3 className="mission-sub">Junk Games</h3>
      <p>
        Greenie, Sandy, Snake, Net Birdie, Net Eagle. The side bets that make the back nine worth
        playing.
      </p>

      <hr className="mission-rule" />

      <h2 className="mission-h">Handicap and Scoring</h2>

      <p className="mission-emph">World class. USGA compliant. Accurate.</p>

      <p>
        Course handicaps calculated automatically using the official USGA formula. Stroke
        allocations computed per player per game before the round starts. Net scores updated in real
        time as you enter gross scores hole by hole. No math. No arguments. No spreadsheets.
      </p>

      <hr className="mission-rule" />

      <h2 className="mission-h">Course Coverage</h2>

      <p>
        Every course you play. Search by name, save your favorites, and get accurate hole-by-hole
        par and handicap rank data for any round.
      </p>

      <hr className="mission-rule" />

      <h2 className="mission-h">Bet Settlement</h2>

      <p>
        When the round ends, Roast and Rake does the math. Every game. Every side bet. Every dollar.
        Settlement instructions in plain English so nobody has to argue about who owes what.
      </p>

      <p className="mission-emph">We cannot make you pay. That part is still on you.</p>

      <hr className="mission-rule" />

      <h2 className="mission-h">
        IOU Ledger<span className="coming-soon">Coming Soon</span>
      </h2>

      <p>
        Running tab of who owes whom across every round. Two buttons per debt: Paid Up and Still
        Owes. No Venmo integration. No real money processed. Just the receipts, organized, forever.
      </p>

      <hr className="mission-rule" />

      <h2 className="mission-h">
        Captain&rsquo;s Commentary<span className="coming-soon">Coming Soon</span>
      </h2>

      <p>
        The AI-generated roast that makes the 19th hole worth showing up for. Pre-round trash talk.
        Nine hole carnage update. End of round verdict. Names named. Receipts presented.
      </p>

      <p className="mission-emph">
        This is the premium feature. Free to read. You pay to fire back.
      </p>

      <hr className="mission-rule" />

      <h2 className="mission-h">Free vs Premium</h2>

      <p className="mission-emph">The Insult Jar is free. Always will be.</p>

      <p>Captain&rsquo;s Commentary and IOU Ledger are premium. Pricing coming soon.</p>

      <FooterCTA />
    </main>
  );
}
