# SIGNAL track — voice guide

The `signal` track is the technical track: deep-dives, CTF writeups, methodology, detection
engineering, tool analysis — written practitioner-to-practitioner. The reader is a peer, a curious
specialist, or a hiring manager assessing how the author thinks.

## Who the reader is
A practitioner or a technical hiring manager. They know the basics; they're here for *insight*, not a
tutorial they could get from documentation. Assume fluency; earn their attention with a genuine point.

## What they want
A real idea they didn't already have, or a familiar thing seen from an angle that's actually useful.
Evidence over assertion. The implicit question they're asking: "does this person know what they're
talking about, and would I want them on my team?"

## What they do not want
- Basics they already know dressed up as insight (no "what is a port scan" preamble before the point).
- Hedged, non-committal opinions. Have a view; defend it; note where you're uncertain *honestly*
  rather than hedging everything.
- Marketing speak, hype, or "game-changing/revolutionary". Practitioners discount it instantly.
- Padding. If a section isn't earning its length, cut it.

## Tone
Direct, specific, peer-to-peer. Confident about what you've verified, explicit about what you haven't.
The strongest credibility move in this track is the **honest gap** — stating what a technique doesn't
cover, or where your own build falls short, exactly as the portfolio threat-models do.

## Shape
- **Length:** as long as the idea needs, no longer. No artificial minimum, no padding to look thorough.
- **Structure:** lead with the point, then the evidence. Code blocks properly formatted and minimal.
  ATT&CK technique IDs where relevant. Every claim either shown (command, output, config) or clearly
  marked as reasoning/opinion.
- **Evidence-based.** "Gobuster against a 4,000-path wordlist generates a 404 burst one IP can't
  explain away" beats "scanners are noisy." Show the mechanism.

## The test before publishing
1. Would you send this to a colleague at your current or future employer without caveat?
2. Is there a genuine insight, or is it documentation restated?
3. Is every claim either demonstrated or honestly flagged as opinion?
4. Did you cut everything that wasn't earning its place?

## Anti-patterns (rewrite if you catch these)
- A tutorial preamble before the actual point → delete it; start at the insight.
- An unsupported "X is better than Y" → show the trade-off, name the conditions where each wins.
- Hedging every sentence → commit to the claim; isolate genuine uncertainty into one honest line.
- A wall of someone else's tool output with no interpretation → say what it *means*.

## What "SIGNAL-grade" looks like (already on the platform)
- The spectre **Detection Perspective** — every offensive step mapped to its log source + ATT&CK +
  the Wazuh rule that catches it. That's the model: offence and the detection for it, together.
- The ironveil / nullbyte **threat models** — adversary set, per-vector control → residual → *honest
  gap*. The gap is the credibility.
- The enumeration-framework methodology post — an argued position (breadth before depth; document the
  negative space), not a command list.

Companion: `BASELINE_VOICE.md` (the civilian track). Shared rule across both: honest, specific, never
padded.
