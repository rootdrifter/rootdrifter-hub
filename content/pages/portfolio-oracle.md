<!-- ghost-page
slug: portfolio-oracle
title: ORACLE — Applied ML Security Research
excerpt: RSI-CB256 DATASET · TERRACNN · RESNET-18 · LATENT SPACE ANALYSIS · SECURITY-RELEVANT METHODOLOGY
-->

> **// RESEARCH STATUS — COMPLETE · rev 2026-06-10**

> **// Why this is in a security portfolio** — The imagery is satellite land-cover; the
> transferable asset is the detection methodology. Engineering for class imbalance, optimising
> for minority-class recall, validating that a model learns genuine structure rather than
> spurious correlation, and weighing deep against classical learners under identical splits are
> exactly the disciplines that govern intrusion detection, malware classification, and anomaly
> detection. A production IDS where 0.01% of traffic is malicious must not score 99.99% accuracy
> by calling everything benign — the imbalance problem solved here is the imbalance problem in
> the SOC. The dataset is the vehicle; the method is the point.

---

## Key Results

| Metric | Value |
|--------|-------|
| ResNet-18 Accuracy | **99.11%** |
| TerraCNN Accuracy | **93.97%** |
| TerraCNN F1 Macro | **0.9390** |
| Latent Space ARI | **0.6478** |

> **// Metric Choice** — Primary evaluation metric is macro-averaged F₁ — equal weight to all
> four classes regardless of frequency. This mirrors the threat-detection requirement where rare
> events (attacks) must not be drowned by majority-class accuracy. A model that labels
> everything benign achieves high accuracy but zero security value.

---

## Dataset — RSI-CB256

| Class | Samples | Characteristics |
|-------|---------|-----------------|
| Forest | 1,500 | High saturation variance; green-dominant |
| Water | 1,500 | High brightness; spectrally distinct |
| Cloudy | 1,500 | Low saturation; significant illumination spread |
| Desert | 1,131 | Low saturation; brown-dominant; under-represented |

Total: 5,631 images. Approximately 25% inter-class imbalance (Desert vs. majority classes).
HSV saturation means span 0.12 to 0.35 — photometric diversity that rules out simple
colour-histogram classifiers. Data split: stratified 70/20/10 (train 3,941 / val 1,126 /
test 563), identical across all models.

---

## TerraCNN Architecture

```text
Input: 128 × 128 × 3 (RGB, ImageNet-normalised)

Conv Block 1:  32 filters, 3×3 kernel → ReLU → BatchNorm → MaxPool 2×2
Conv Block 2:  64 filters, 3×3 kernel → ReLU → BatchNorm → MaxPool 2×2
Conv Block 3: 128 filters, 3×3 kernel → ReLU → BatchNorm → MaxPool 2×2

Global Average Pooling

Dense:    256 units → ReLU → Dropout (p = 0.50)
Output:     4 units → Softmax

Regularisation: dropout 0.50, L₂ weight decay λ = 1e-4
Optimiser: Adam β1=0.9, β2=0.999 · LR: 1e-3 → 2.5e-4 by epoch 70
Imbalance: class-weighted cross-entropy + inverse-frequency sampler
```

Augmentation policy was motivated by EDA: HSV means differing by up to 0.23 across classes. A
colour-insensitive augmentation (colour jitter brightness=contrast=saturation=0.3 and ±20°
rotation) avoids leaking class information through photometric artefacts.

---

## Model Comparison

<div id="oracle-component" aria-label="Interactive model comparison chart"></div>

| Model | Architecture | Test Accuracy | F₁_macro |
|-------|--------------|---------------|----------|
| ResNet-18 (transfer) | Pretrained 18-layer residual CNN, fine-tuned on RSI-CB256 | **99.11%** | **0.9916** |
| TerraCNN (scratch) | Custom 3-stage CNN (32→64→128 filters) + GAP + 256-unit dense | 93.97% | 0.9390 |
| Random Forest | 100-tree ensemble, class-balanced, 49,152-D pixel vectors | — | ~0.94 |
| SVM (RBF) | RBF-kernel SVM, 49,152-D pixel vectors, grid search C×γ | — | ~0.90 |

ResNet-18 confirms ImageNet-pretrained spatial features transfer effectively to constrained
four-class remote-sensing tasks. TerraCNN reaches 0.9390 F₁_macro from scratch — within a point
of the Random Forest baseline (~0.94) and roughly five points behind the pretrained network,
the expected gap for a small custom network trained on ~3,900 images without pretraining.

All models struggle most with Water–Forest confusion (spectral overlap in low-illumination
scenes). ResNet-18 reduces this to 3.6% error through learned spatial context; SVM reaches
17.4%, demonstrating the limitation of raw pixel vectors.

---

## Latent Space Analysis

Penultimate layer activations (128-dimensional) extracted from TerraCNN on the test split. PCA
reduced to 200 components (retaining 96.0% of variance) followed by t-SNE (perplexity=30) for
two-dimensional projection.

**ARI = 0.6478** — strong agreement between TerraCNN's internal cluster structure and true
class labels. Four coherent clusters emerge in the projection, with residual Water–Cloudy
overlap accounting for the gap from a theoretical maximum of 1.0. This confirms the CNN is
learning genuine discriminative features, not spurious correlations.

---

## Security Relevance

**Why classifying satellite imagery is a security problem, not just computer vision.** The most
direct framing: this is **automated intelligence-analysis triage**. GEOINT/IMINT analysts
receive far more overhead imagery than any team can read; the bottleneck is deciding which
scenes deserve a human look. Automated land-cover classification *is* that triage layer —
routing scenes, flagging change, and aiming scarce analyst attention. A model that sorts
forest/water/cloud/desert is a toy; the reproducible, imbalance-aware, latent-validated
*method* is what sorts "normal" from "anomalous" across an ISR feed.

> **// Two further security framings** — **Critical-infrastructure monitoring** — the same
> classifier, retrained on the right classes, drives automated change-detection around fixed
> sites (ports, substations, borders); the imbalance discipline is what stops the rare,
> important scene being averaged away. **Adversarial robustness in contested environments** —
> any vision model fielded for ISR is a target, so understanding how it fails (and proving its
> representations are genuine, not spurious — the ARI = 0.6478 check) is itself a security
> discipline. See below.

Beneath the domain framing, the techniques map directly to detection pipelines:

| Technique | Detection-pipeline application |
|-----------|-------------------------------|
| Macro F₁ primary metric | Rare-class recall — attacks are the minority class in any production IDS. High accuracy by labelling everything benign is not acceptable. |
| Class-weighted loss + inverse-frequency sampler | Prevents benign-class dominance in intrusion detection. Standard practice in applied threat detection pipelines. |
| SVM with RBF kernel | Classical anomaly scoring; used in network intrusion detection benchmarks (NSL-KDD, CICIDS). |
| Random Forest | Feature importance ranking in malware classification; explainability for SOC analysts reviewing flagged samples. |
| CNN spatial feature extraction | Network traffic image encoding; binary visualisation for malware classification at scale. |
| Latent space ARI analysis | Cluster validation in unsupervised threat grouping — verifying the model learns real structure. |

---

## Transfer Learning — the 5.14-point gap

The two deep models tell a representation-learning story. **ResNet-18** (ImageNet-pretrained,
fine-tuned) reached **99.11%** accuracy / 0.9916 F₁; **TerraCNN** (trained from scratch on
~3,900 tiles) reached **93.97%** / 0.9390. The pretrained network wins by **+5.14 percentage
points** (99.11 − 93.97). That gap is not the architecture — it is *representation transfer*:
ResNet-18 arrives already knowing edges, textures and shapes from a million photographs and
only re-aims that vocabulary; TerraCNN must invent the entire visual vocabulary from a few
thousand satellite tiles. The gap is the measurable price of not having pretraining.

> **// What +5.14pp means in deployment — and the trade-off** — On a triage queue of 10,000
> scenes, 5.14pp is roughly **514 fewer misclassifications per batch** — fewer wasted analyst
> hours, fewer scenes wrongly waved through. But the pretrained model is a **third-party
> artefact**: opaque 512-D features, inherited ImageNet biases, and a supply-chain dependency
> on weights you did not train. TerraCNN is ~5 points weaker yet **fully owned and auditable** —
> a compact 128-D latent (its ARI = 0.6478 is that audit), trainable on-prem on classified data
> with no external dependency. In a cleared environment the auditable from-scratch model can be
> the *correct* choice despite −5.14pp: provenance and inspectability are security properties.
> "Most accurate" ≠ "most deployable in a contested setting."

---

## Adversarial Robustness — fooling the classifier

A 99.11% figure measures performance on clean, honest data. It says almost nothing about an
adversary actively trying to deceive the model — the case that matters for anything fielded in
a contested environment. **What an attacker would need to do:**

- **Adversarial perturbation (cheapest).** Both models classify on RGB statistics and are
  differentiable, so an attacker with model (or surrogate) gradients can compute a minimal,
  near-imperceptible pixel change (FGSM/PGD) that flips the class with high confidence — no
  physical access to the scene required.
- **Exploit the known weak boundary.** Every model's dominant confusion is **Water ↔ Forest**
  in low illumination (SVM 17.4%, even the best CNN 3.6%). An adversary who understands the
  model operates in exactly that ambiguity — no digital tampering needed.
- **Physical-world deception.** Camouflage, decoys and terrain alteration are perturbations
  applied to the scene rather than the file — the physical analogue of an adversarial example,
  historically effective against human and machine analysts alike.
- **Data poisoning.** Influence the training set (mislabelled / trojaned tiles) and you install
  a blind spot before deployment — a supply-chain attack on the model itself.

> **// The limit of ML-based security** — High benchmark accuracy is **not** robustness. A
> 99.11% classifier can be driven toward near-100% *error* by an adversary with gradient
> access — accuracy and adversarial robustness are different properties against different
> threat models. Clean-data benchmarks must be paired with **adversarial evaluation**;
> contested-use models need **defence-in-depth and a human in the loop**; and a model's
> **known confusion structure is also its attack surface**. This is the vision-model
> counterpart of the [mirage](https://github.com/rootdrifter/mirage) argument: a detector that
> keys on surface features is one an adversary can learn to evade. Robustness is designed and
> tested for — it does not come free with accuracy.

---

## Skills Demonstrated

| Skill | Evidence |
|-------|----------|
| Deep Learning | Custom CNN architecture design; PyTorch training pipeline; Adam with scheduling; early stopping. |
| Classical ML | SVM grid search; Random Forest with OOB validation; five-fold cross-validation; scikit-learn. |
| Imbalance Handling | Class-weighted cross-entropy; inverse-frequency mini-batch sampling; EDA-driven augmentation design. |
| Evaluation Methodology | Macro F₁; stratified splits identical across all models; controlled comparability; fixed seeds. |
| Latent Space Analysis | PCA (200 components, 96% variance); t-SNE projection; Adjusted Rand Index for cluster validation. |
| Security-Relevant Framing | Imbalance techniques directly applicable to IDS and malware classification; GEOINT/IMINT triage framing. |
| Transfer-Learning Analysis | Quantified the +5.14pp pretraining gap; interpretability/provenance trade-off for cleared deployment. |
| Adversarial ML Thinking | Threat-modelled the classifier (FGSM/PGD, poisoning, physical deception); "accuracy ≠ robustness". |

---

## Repository

> **// GitHub** — Full methodology, dataset description, architecture documentation, and
> research references: [github.com/rootdrifter/oracle](https://github.com/rootdrifter/oracle) —
> one repository in the [github.com/rootdrifter](https://github.com/rootdrifter) portfolio.
