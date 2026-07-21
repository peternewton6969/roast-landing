import Waitlist from './Waitlist.jsx';

export default function CaptainsLog() {
  return (
    <main className="mission">
      <h1 className="mission-title">Captain&rsquo;s Log</h1>

      <p className="mission-lead">The AI that watched your whole round and has opinions.</p>

      <p>
        Captain&rsquo;s Commentary is the roast your foursome deserves but could never write fast
        enough. It reads the round. It reads the room. It delivers the verdict.
      </p>

      <p className="mission-emph">Three moments. Every round.</p>

      <hr className="mission-rule" />

      <h2 className="mission-h">Pre-Round</h2>

      <p>
        Sets the stakes before anyone tees off. Who held the snake last week. Who still owes money.
        Who has been talking the most game with the least results. Consider it a threat assessment.
      </p>

      <hr className="mission-rule" />

      <h2 className="mission-h">The Turn</h2>

      <p>
        After hole 9 the Captain checks in. Who is bleeding. Who is holding the snake. Who has made
        three putts look genuinely dangerous. Mid-round accountability delivered while the back nine
        still matters.
      </p>

      <hr className="mission-rule" />

      <h2 className="mission-h">End of Round</h2>

      <p>
        The full summary. Scores, bets, side bets, settlement. All of it wrapped in the kind of
        language that makes the cart ride home worth taking. Named. Specific. Devastating.
      </p>

      <hr className="mission-rule" />

      <h2 className="mission-h">Sample Summaries</h2>

      <h3 className="mission-sub">Pre-Round &mdash; Prestonwood Meadows, Tuesday Morning</h3>
      <blockquote className="captains-quote">
        <p>Captain&rsquo;s Log. Tuesday. Meadows. Four men who should know better.</p>
        <p>
          Peter arrives with the confidence of a man who shot 81 once in 2019 and has been dining
          out on it ever since. Jim has not stopped talking about his new driver since March. It is
          July. Brooks owes the group $47 from last Tuesday and has not mentioned it once. JP is the
          most dangerous man on this tee sheet and everyone knows it except JP.
        </p>
        <p>
          Snake is live. Skins pool is $80. Best Ball teams are set. May God have mercy on whoever
          three-putts first.
        </p>
        <p>Let&rsquo;s get after it.</p>
      </blockquote>

      <h3 className="mission-sub">The Turn &mdash; Team B up 2, Snake on Brooks, 3 skins carried</h3>
      <blockquote className="captains-quote">
        <p>Captain&rsquo;s Log. Hole 9. Status report.</p>
        <p>
          Team B is 2 up and playing like they know it. Team A is playing like they also know it,
          which is the problem.
        </p>
        <p>
          Brooks is holding the snake. He picked it up on hole 6 and has not let go. His putting
          stroke at this point is less a technique and more a cry for help. Three skins are carrying
          into the back nine because nobody on this golf course can make a putt when it counts.
        </p>
        <p>
          Peter had a net birdie on 8 that briefly made him insufferable. He is now back to
          baseline. Jim hit a drive on 9 that the group agreed was the best shot of the day. Jim
          agreed loudest.
        </p>
        <p>
          Back nine. Snake is worth $30. Someone is about to have a very bad Tuesday.
        </p>
      </blockquote>

      <h3 className="mission-sub">End of Round &mdash; Full Verdict</h3>
      <blockquote className="captains-quote">
        <p>Captain&rsquo;s Log. Round complete. Prestonwood Meadows. Tuesday.</p>
        <p>
          Team B wins. Aaron and Brooks collect $25 each. Peter and Jim pay $25 each and should
          reflect on their choices.
        </p>
        <p>Skins: JP won 7. Sean won 4. The math is what it is.</p>
        <p>
          Brooks held the snake through hole 18 because of course he did. That is $30 out and $10
          back in. Net negative. On a course he plays every week.
        </p>
        <p>
          Final settlement: Peter pays $54. Aaron collects $22. Brooks somehow breaks even which is
          its own kind of insult. JP is the only adult in the group.
        </p>
        <p>No one cares what you shot. Everyone cares about this. See you Tuesday.</p>
      </blockquote>

      <hr className="mission-rule" />

      <h2 className="mission-h">How to Share</h2>

      <p>
        At the end of every Captain&rsquo;s Summary there is one button. Share. It generates a card
        formatted for Instagram, group chat, or wherever your foursome lives. The Insult Caddy stamp
        travels with every share.
      </p>

      <p>
        Your friends who were not there will wish they were. Your friends who were there will wish
        they were not.
      </p>

      <hr className="mission-rule" />

      <h2 className="mission-h">Free vs Premium</h2>

      <p className="mission-emph">Reading the Captain&rsquo;s Summary is free.</p>

      <p>Firing back costs $0.99. One shot. Make it count.</p>

      <p>
        Full Captain&rsquo;s access &mdash; all three summaries, every round, full history &mdash; is
        the Roast and Rake premium tier. Pricing coming soon.
      </p>

      <Waitlist />
    </main>
  );
}
