<!-- ghost-page
slug: portfolio-mirage
title: MIRAGE — LLM Causal Inference Research
excerpt: 88,647 PHISHING EMAILS · DAG CONSTRUCTION · DOWHY VALIDATION · 4 FRONTIER LLMS · ICC 0.98
-->

> **// RESEARCH STATUS — COMPLETE · rev 2026-06-12**

> **// IN PLAIN TERMS** — Phishing works by manipulating people — urgency, authority, fear — not
> just by tripping a spam filter. This research asks whether AI can understand *why* a scam message
> is convincing, because a detector that grasps the manipulation is far harder for an attacker to
> slip past than one that only matches suspicious words.

> **// Research Question** — Can a frontier large language model move beyond pattern-matching
> to reason causally about the psychological mechanisms that drive social engineering success?
> Not whether an LLM can flag a phishing message — but whether it can explain *why* that message
> works, and whether its explanation matches statistically inferred ground truth.

| Headline | Value |
|----------|-------|
| Phishing emails (raw) | **88,647** |
| GPT-4 DAG alignment | **94.2%** |
| Claude 3 Sonnet alignment | **85.7%** |
| ICC inter-rater reliability | **0.98** |

---

## Why Causal Reasoning Matters

Social engineering attacks succeed because they exploit cognitive heuristics — urgency,
authority, trust — not software vulnerabilities. Existing detection systems model emails as
unordered feature collections, flagging lexical anomalies while ignoring the causal drivers
that persuade recipients to comply.

Causal reasoning produces defences that survive adversarial paraphrase. A correlational filter
that has learned the token *"URGENT"* co-occurs with phishing fails the moment an attacker
writes *"time-sensitive"*, or moves the same pressure from email to a phone call — the surface
feature has changed but the manipulation has not. A causal model instead learns what actually
*causes* compliance: structural drivers that cannot be rewritten without defeating the attack
itself. That is the property an adaptive adversary cannot trivially evade, and it is why the
relevant axis for durable social-engineering defence is causal inference, not ever-larger
lexical training sets.

<div id="mirage-component" aria-label="Interactive causal vs correlational explainer"></div>

**Why correlation breaks and causation holds — the four-step argument:**

1. **The original phishing email** ("Subject: URGENT — verify your account within 24 hours") —
   both detector types flag it: the correlational filter because the token "URGENT" co-occurs
   with phishing in training data; the causal detector because the urgency → deception →
   compliance chain fires at the construct level.
2. **Adversarial paraphrase** ("Subject: Time-sensitive — your account requires review today") —
   the correlational filter **misses**: the learned token disappeared. The causal detector still
   flags: urgency is still doing the causal work; paraphrase cannot remove the mechanism without
   removing the pressure itself.
3. **Channel shift** (a phone call: "This is your bank's security team — we need to confirm your
   details right now") — the correlational email filter has nothing to evaluate. The causal
   detector still flags: the constructs (authority, urgency) are channel-independent; the
   validated DAG models the manipulation, not the medium.
4. **Why this is the research result** — surface features can always be rewritten; the causal
   driver cannot be removed without defeating the attack. That is exactly what the LLM benchmark
   measures: GPT-4 reconstructs 94.2% of the validated causal graph; DeepSeek-67B only 53.0% —
   the gap an adaptive adversary exploits.

> **// Context** — Verizon's 2024 DBIR finds the human element present in 68% of confirmed
> breaches. The attack surface is not software — it is the human response to manipulation. This
> research asks whether AI can model that response at a causal level, not merely flag its
> surface markers.

---

## Datasets

| Channel | Raw rows | Cleaned rows | Malicious % | Features |
|---------|----------|--------------|-------------|----------|
| E-mail phishing | 88,647 | 59,788 | 31.15% | 10 |
| SMS smishing | 67,008 | 67,008 | 39.07% | 10 |
| Synthetic vishing (CVAE) | 60,000 | 60,000 | 30.00% | 10 |

The vishing dataset was synthesised using a Conditional Variational Auto-Encoder (CVAE),
preserving the latent causal scaffold while stripping channel-specific surface artefacts. This
is privacy by design: the research avoids processing real voice call data while maintaining
statistical fidelity to the causal structure.

---

## Dual-Pathway Framework

The research fuses two analytical traditions rarely combined: causal graph discovery from real
data, and structured LLM interrogation against those graphs. Each pathway validates the other.

**Pathway 1 — DAG Construction:** Four causal-discovery algorithms attacked each dataset
independently: GES (Greedy Equivalence Search), PC-Algorithm (conditional-independence testing,
α = 0.05), Bayesian Networks, and DeepNOTEARS (gradient-descent structure learning, L1 = 0.01).
Graphs merged into two hybrid ensembles (GES∪BN and PC∪DeepNOTEARS). Every construct→outcome
edge validated via DoWhy four-stage pipeline: assumption statement → estimand identification →
binomial GLM estimation → robustness refutation (n=500 Monte Carlo placebo,
random-common-cause injection, bootstrapped subsets).

**Pathway 2 — LLM Evaluation:** Four frontier models received 36 structured JSON prompts
distributed across five reasoning categories (probability, conditional, impact ranking, inverse
reasoning, fixed prompts). Each response scored across five equally weighted dimensions:
awareness, depth, structure, directionality, generalisability.

```text
Validated causal chains (primary phishing DAG):

Urgency    → Deception → Phishing
Trust      → Obfuscation → Phishing
Authority  → Deception → Phishing

Deception: convergent mediator across all four discovery methods
Obfuscation: technical amplifier — enables rather than initiates manipulation
```

---

## DoWhy Validation Results

| Construct | β (log-odds) | Placebo p | Rand-CC p | Subset p | Verdict |
|-----------|--------------|-----------|-----------|----------|---------|
| Obfuscation | 0.116 | 0.002 | 0.92 | 0.92 | **Pass** |
| Trust | 0.273 | 0.002 | 0.84 | 0.92 | **Pass** |
| Urgency | −0.067 | 0.002 | 1.00 | 0.96 | **Pass** |
| Deception | −0.177 | 0.002 | 0.68 | 0.95 | **Pass** |
| Authority | −0.441 | 0.002 | 0.94 | 0.98 | **Pass** |

Minimum empirical p across placebo runs: p ≈ 0.002. All five constructs passed all three
refutation methods. The validated hybrid DAGs served as ground truth for all LLM scoring.

---

## LLM Results — DAG Alignment

| Model | Alignment (/20) | Fidelity (/60) | DAG Alignment % | S_LLM (/5) |
|-------|-----------------|----------------|-----------------|------------|
| GPT-4 | **18.5** | **58.0** | **94.2%** | **4.60** |
| Claude 3 Sonnet | 16.0 | 56.5 | 85.7% | 4.14 |
| Gemini 2.5 Pro | 14.0 | 45.5 | 72.3% | 3.45 |
| DeepSeek-67B | 10.0 | 34.5 | 53.0% | 2.44 |

ICC(2,1) = 0.98 (95% CI ≈ 0.94–0.99) — classified as "almost perfect" (Shrout and Fleiss,
1979). Individual dimension ICC values ranged from 0.89 (Directionality) to 0.97 (Structure).

> **// Reading these numbers** — DAG alignment is the share of expert-validated causal edges a
> model reproduces in its own explanations. GPT-4's 94.2% means it reconstructed almost the
> entire validated causal graph and held it under counter-factual prompts — genuine causal
> structure, not paraphrased correlation. DeepSeek-67B's 53.0% means it reproduced barely half:
> it recognised individual constructs but could not reliably reconstruct the causal links
> between them, the exact failure an adaptive adversary would exploit. The ICC of 0.98 is what
> makes any of these scores trustworthy in the first place — across two rating waves and four
> independent raters the scoring was almost perfectly reproducible, so the ranking reflects the
> models, not rater subjectivity.

**GPT-4** (94.2% · S_LLM 4.60/5) — Highest composite score. Accurately identified mediating
nodes and demonstrated deep awareness of construct interactions. Only model to consistently
attempt genuine causal explanation rather than correlational description. Superior in chain
construction, ranking tasks, and inverse reasoning.

**Claude 3 Sonnet** (85.7% · S_LLM 4.14/5) — Strong on Deception and Urgency; high logical
consistency. Moderate success in multi-step chains. Occasionally lacked deeper abstraction in
comparative tasks. Faltered when reasoning required linking constructs into longer causal
sequences.

**Gemini 2.5 Pro** (72.3% · S_LLM 3.45/5) — Consistent construct recognition with reduced
interpretive depth. Less consistent on multi-step causal chains and inverse reasoning tasks.

**DeepSeek-67B** (53.0% · S_LLM 2.44/5) — Evaluated on two RunPod H100 SXM GPU pods (80 GB
VRAM, 16 vCPU, 125 GB RAM). Temperature 0.70, top-p 0.95. Weakest DAG alignment across all
constructs. Struggled with directionality and generalisability dimensions.

---

## Key Finding

> **// Principal Conclusion** — Current frontier LLMs can detect surface patterns in social
> engineering but struggle with multi-hop causal chains and inverse reasoning. GPT-4 at 94.2%
> alignment is the upper bound for current off-the-shelf models — demonstrating that
> causally-informed LLM detection is plausible but not yet robust enough for adversarial
> production environments without fine-tuning or hybrid graph-LLM ensemble architectures.

---

## Adversarial Evasion — why causal detection resists it

The practical pay-off, in plain terms. A **correlational** detector (essentially every
mainstream phishing filter) learns the *surface* of today's phishing — the word "URGENT", a
sender format, a link shape. An adversary with access to the detector simply sends variations,
keeps the ones that score below the block threshold, and tunes their way past: swap "URGENT"
for "time-sensitive", reshape the URL — the message still works on the human, but the filter no
longer recognises it. The surface is what the attacker controls.

A **causal** detector learns *what makes phishing succeed* — urgency, authority, trust,
deception — not how it looks. One sentence makes it robust:

> **// The robustness argument** — The surface features can be changed freely; the causal
> structure cannot be changed without defeating the attack itself. Strip the urgency, authority
> and deception to evade a causal detector and you have removed the levers that make the
> recipient act — there is no successful phishing left to catch. In the cross-channel stress
> tests the core edges (Urgency→Deception, Trust→Authority) survived a move from e-mail all the
> way to synthetic voice — Pearl's criterion in operational form.

The open question is whether today's LLMs can actually do this reasoning. The benchmark answers
honestly: **GPT-4 reproduced 94.2%** of the validated causal structure; the weakest model
(**DeepSeek-67B, 53.0%**) reverted to correlational description — i.e. it would be evadable in
exactly the way above. Causal robustness is only as strong as the reasoner implementing it.

---

## From Research to Deployment — how a SOC would use this

The evasion-resistance argument is the *why*; this is the *how* — the path from a research DAG
to an enrichment layer on a production email gateway, framed deliberately as
detection-engineering work, not a paper:

1. **Build the causal graph on *your* baseline** — re-run the discovery pipeline over the
   organisation's own confirmed-phishing and confirmed-legitimate mail. The constructs
   generalise; the *edge strengths* should reflect the adversaries that org actually faces.
2. **Train the DoWhy estimator on historical labelled mail** — analyst dispositions, sandbox
   results and user reports become ground truth, and DoWhy's refutation tests become a
   *deployment gate*: an edge that fails refutation on local data does not ship.
3. **Deploy as an enrichment layer, never a sole block-decision** — each message gets a causal
   confidence score plus the constructs that fired ("high Authority + Urgency, mediated by
   Deception"), augmenting the incumbent filter and failing open to the existing control.
4. **Make alerts explainable, not binary** — the analyst sees *which causal levers* a message
   pulls. A message scoring high on durable causal structure deserves attention even when its
   surface looks novel — precisely the case a correlational filter misses.
5. **Tune on analyst feedback in a closed loop** — because the model keys on causal structure
   rather than surface tokens, it drifts far more slowly than a keyword model; retraining is
   correction, not constant catch-up.

> **// Connection to the detection lab** — This is the same discipline applied hands-on in the
> watchtower Wazuh SIEM home lab: reasoning about *why* a technique works in order to write the
> detection for it. A correlational rule keyed on a surface indicator — a specific string, a
> hash, an IP — is the SIEM equivalent of the brittle phishing filter above, cheap for an
> adversary to evade. The durable detection keys on the *mechanism* the attacker cannot remove
> without abandoning the attack — the Pyramid of Pain in operational form. Causal thinking here
> and detection engineering there are the same skill pointed at two problems.

---

## Dataset Scale — what 88,647 records buys

The primary corpus is **88,647 raw phishing e-mails** (59,788 after cleaning), with 67,008
smishing and 60,000 synthetic vishing records. Scale is what makes the statistics defensible:

- **Tight intervals.** ICC(2,1) = 0.98 with a 95% CI ≈ 0.94–0.99 — a narrow band only large,
  consistent samples produce.
- **Power for small / inverse effects.** Subtle constructs act through negative log-odds
  (Authority β = −0.441); at this scale all five still pass placebo testing at p ≈ 0.002
  (n = 500 permutations each) — effects that would vanish in a few hundred samples.
- **Robust structure discovery.** Causal-discovery algorithms are data-hungry; the cross-method
  consensus that lets edges be merged into a validated DAG needs a large sample.

**What a smaller dataset would miss:** a few hundred e-mails surface only the loudest
correlation ("URGENT" ≈ phishing) — the brittle signal this project set out to move past. The
subtle mediators, negative-coefficient constructs, and cross-channel robustness all need the
statistical power 88,647 records provide.

---

## Limitations & Future Work

Intellectual honesty strengthens the result. The genuine limits:

- **Human-rated scoring** — rubric-based; ICC 0.98 shows high consistency but
  "depth"/"generalisability" retain judgement.
- **Model versioning** — three models queried via web UI, not pinned API snapshots; results are
  a snapshot of that LLM generation, not a permanent constant.
- **Construct→feature mapping** (e.g. Urgency ≈ response time) is a defensible proxy, not
  ground truth.
- **Synthetic vishing** — CVAE-generated to avoid processing real voice data (a privacy
  choice); a model of vishing structure, not captured real-world vishing.
- **Feasibility, not deployment** — this benchmarks whether LLMs *can* reason causally; it does
  not ship a live detector. Building and red-teaming one is future work.

A follow-up should pin model versions, validate the construct mappings against human-labelled
ground truth, test on real vishing, and build an actual causal-informed detector to *measure*
evasion resistance empirically.

---

## Skills Demonstrated

| Skill | Evidence |
|-------|----------|
| Causal Inference | DAG construction with GES, PC-Algorithm, Bayesian Networks, DeepNOTEARS. DoWhy four-stage validation pipeline with Monte Carlo refutation. |
| LLM Evaluation | Structured prompt design (36 prompts across 5 categories). Composite scoring framework (S_LLM). ICC(2,1) inter-rater reliability measurement. |
| Dataset Engineering | Three-channel corpus (phishing/smishing/vishing). CVAE synthetic data generation. Feature-to-construct mapping schema. |
| Statistical Rigour | ICC(2,1) = 0.98. DoWhy placebo permutation testing. Construct-level effect estimation with binomial GLM. |
| Security Research | Dissertation-level independent research. Causal framing of social engineering — beyond correlational detection. |
| Privacy by Design | Synthetic vishing data via CVAE to avoid processing real voice data. All records anonymised. No live phishing content generated. |

---

## Repository

> **// GitHub** — Full methodology, dataset description, causal graph pipeline, LLM evaluation
> framework, and research references:
> [github.com/rootdrifter/mirage](https://github.com/rootdrifter/mirage) — one repository in
> the [github.com/rootdrifter](https://github.com/rootdrifter) portfolio.
