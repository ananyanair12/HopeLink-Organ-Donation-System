# ============================================================
#  HopeLink — Real Dataset Loader
#  Loads Kaggle CSVs and engineers features to match the
#  exact schema expected by MatchPredictor and SurvivalPredictor.
#
#  Feature schema (must not change — predict.py depends on it):
#    Matching  : blood_group_match, age_diff, ejection_frac_diff,
#                meld_score_diff, lung_cap_diff, insulin_diff, same_state
#    Survival  : recipient_age, donor_age, organ_type, ejection_frac,
#                meld_score, compatibility_score, same_state
# ============================================================

import pandas as pd
import numpy as np
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')

HEART_CSV   = os.path.join(DATA_DIR, 'heart_failure_clinical_records.csv')
LIVER_CSV   = os.path.join(DATA_DIR, 'indian_liver_patient.csv')

# Blood groups distributed roughly by Indian population frequency
BLOOD_GROUPS = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-']
BG_WEIGHTS   = [0.36, 0.22, 0.25, 0.09, 0.03, 0.02, 0.02, 0.01]

# ABO compatibility matrix — donor blood group → compatible recipient groups
ABO_COMPAT = {
    'O-':  ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
    'O+':  ['O+', 'A+', 'B+', 'AB+'],
    'A-':  ['A-', 'A+', 'AB-', 'AB+'],
    'A+':  ['A+', 'AB+'],
    'B-':  ['B-', 'B+', 'AB-', 'AB+'],
    'B+':  ['B+', 'AB+'],
    'AB-': ['AB-', 'AB+'],
    'AB+': ['AB+'],
}

ORGAN_MAP = {'Heart': 0, 'Liver': 1, 'Lungs': 2, 'Pancreas': 3}


def _check_files():
    missing = []
    if not os.path.exists(HEART_CSV):
        missing.append(f'  heart_failure_clinical_records.csv  →  {HEART_CSV}')
    if not os.path.exists(LIVER_CSV):
        missing.append(f'  indian_liver_patient.csv            →  {LIVER_CSV}')
    if missing:
        raise FileNotFoundError(
            '\n\nMissing dataset files. Download them from Kaggle and place in ml/data/:\n'
            + '\n'.join(missing)
            + '\n\nSee ml/data/README.txt for download links.\n'
        )


def _assign_blood_groups(n, rng):
    """Randomly assign blood groups using Indian population frequencies."""
    return rng.choice(BLOOD_GROUPS, size=n, p=BG_WEIGHTS)


def _blood_group_match(donor_bg, recipient_bg):
    """1 if donor blood group is compatible with recipient, else 0."""
    return int(recipient_bg in ABO_COMPAT.get(donor_bg, []))


def load_matching_data():
    """
    Build the matching feature matrix from real Kaggle data.

    Strategy:
    - Heart rows  → ejection_frac_diff derived from real EF values
    - Liver rows  → meld_score_diff derived from real liver disease severity
    - Lung rows   → lung_cap_diff derived from age-adjusted TLC estimates
    - Pancreas    → insulin_diff derived from diabetes indicators
    - Blood group → sampled by Indian population frequency
    - Target      → 1 (compatible) if blood group matches AND organ metric
                    difference is within clinical tolerance

    Returns: X (DataFrame), y (Series)
    """
    _check_files()
    rng = np.random.default_rng(42)

    # ── Heart data ───────────────────────────────────────────
    heart_df = pd.read_csv(HEART_CSV)
    heart_df = heart_df[['age', 'ejection_fraction']].dropna()
    heart_df.columns = ['age', 'ejection_frac']

    n_heart = len(heart_df)
    donor_ef   = heart_df['ejection_frac'].values
    # Simulate a paired donor by sampling from the same distribution
    recip_ef   = rng.choice(donor_ef, size=n_heart, replace=True)
    ef_diff    = np.abs(donor_ef - recip_ef)

    donor_age_h  = heart_df['age'].values
    recip_age_h  = rng.integers(18, 75, size=n_heart)
    age_diff_h   = np.abs(donor_age_h - recip_age_h)

    donor_bg_h   = _assign_blood_groups(n_heart, rng)
    recip_bg_h   = _assign_blood_groups(n_heart, rng)
    bg_match_h   = np.array([_blood_group_match(d, r) for d, r in zip(donor_bg_h, recip_bg_h)])
    same_state_h = rng.integers(0, 2, size=n_heart)

    # Clinical tolerance: EF within ±10 is compatible
    ef_ok     = (ef_diff <= 10).astype(int)
    target_h  = ((bg_match_h == 1) & (ef_ok == 1)).astype(int)

    heart_rows = pd.DataFrame({
        'blood_group_match':  bg_match_h,
        'age_diff':           age_diff_h,
        'ejection_frac_diff': ef_diff,
        'meld_score_diff':    np.zeros(n_heart),
        'lung_cap_diff':      np.zeros(n_heart),
        'insulin_diff':       np.zeros(n_heart),
        'same_state':         same_state_h,
        'target':             target_h,
    })

    # ── Liver data ───────────────────────────────────────────
    liver_df = pd.read_csv(LIVER_CSV)
    liver_df = liver_df[['Age', 'Dataset']].dropna()
    liver_df.columns = ['age', 'disease_flag']

    # Map disease severity to a MELD-like score (range 6–40)
    # disease_flag=1 → liver disease present → higher MELD (15–40)
    # disease_flag=2 → no disease            → lower MELD  (6–14)
    n_liver = len(liver_df)
    donor_meld = np.where(
        liver_df['disease_flag'].values == 1,
        rng.integers(15, 40, size=n_liver),
        rng.integers(6,  15, size=n_liver)
    )
    recip_meld  = rng.integers(6, 40, size=n_liver)
    meld_diff   = np.abs(donor_meld - recip_meld)

    donor_age_l  = liver_df['age'].values
    recip_age_l  = rng.integers(18, 75, size=n_liver)
    age_diff_l   = np.abs(donor_age_l - recip_age_l)

    donor_bg_l   = _assign_blood_groups(n_liver, rng)
    recip_bg_l   = _assign_blood_groups(n_liver, rng)
    bg_match_l   = np.array([_blood_group_match(d, r) for d, r in zip(donor_bg_l, recip_bg_l)])
    same_state_l = rng.integers(0, 2, size=n_liver)

    # Clinical tolerance: MELD diff ≤ 10 is acceptable
    meld_ok   = (meld_diff <= 10).astype(int)
    target_l  = ((bg_match_l == 1) & (meld_ok == 1)).astype(int)

    liver_rows = pd.DataFrame({
        'blood_group_match':  bg_match_l,
        'age_diff':           age_diff_l,
        'ejection_frac_diff': np.zeros(n_liver),
        'meld_score_diff':    meld_diff,
        'lung_cap_diff':      np.zeros(n_liver),
        'insulin_diff':       np.zeros(n_liver),
        'same_state':         same_state_l,
        'target':             target_l,
    })

    # ── Lung data (derived from heart dataset — age → TLC estimate) ──
    # Estimated TLC (litres) from age using published regression:
    #   Male:   TLC ≈ 7.99 - 0.021 * age   (Quanjer et al.)
    #   Female: TLC ≈ 6.60 - 0.018 * age
    # We use the heart dataset ages as a proxy population.
    n_lung      = n_heart
    ages_lung   = heart_df['age'].values
    # Assume mixed gender — average the two equations
    donor_tlc   = 7.30 - 0.020 * ages_lung + rng.normal(0, 0.3, n_lung)
    recip_tlc   = rng.choice(donor_tlc, size=n_lung, replace=True)
    tlc_diff    = np.abs(donor_tlc - recip_tlc)

    donor_age_lu  = ages_lung
    recip_age_lu  = rng.integers(18, 75, size=n_lung)
    age_diff_lu   = np.abs(donor_age_lu - recip_age_lu)

    donor_bg_lu   = _assign_blood_groups(n_lung, rng)
    recip_bg_lu   = _assign_blood_groups(n_lung, rng)
    bg_match_lu   = np.array([_blood_group_match(d, r) for d, r in zip(donor_bg_lu, recip_bg_lu)])
    same_state_lu = rng.integers(0, 2, size=n_lung)

    # Clinical tolerance: TLC within ±1L
    tlc_ok    = (tlc_diff <= 1.0).astype(int)
    target_lu = ((bg_match_lu == 1) & (tlc_ok == 1)).astype(int)

    lung_rows = pd.DataFrame({
        'blood_group_match':  bg_match_lu,
        'age_diff':           age_diff_lu,
        'ejection_frac_diff': np.zeros(n_lung),
        'meld_score_diff':    np.zeros(n_lung),
        'lung_cap_diff':      tlc_diff,
        'insulin_diff':       np.zeros(n_lung),
        'same_state':         same_state_lu,
        'target':             target_lu,
    })

    # ── Pancreas data (insulin proxy from liver dataset) ─────
    # Use liver dataset age to estimate fasting insulin (µU/mL)
    # Published range: 2–25 µU/mL fasting; diabetic patients higher (15–50)
    n_panc      = n_liver
    disease_flag = liver_df['disease_flag'].values
    donor_ins   = np.where(
        disease_flag == 1,
        rng.uniform(15, 50, size=n_panc),   # disease → higher insulin resistance
        rng.uniform(2,  15, size=n_panc)    # healthy  → normal range
    )
    recip_ins   = rng.uniform(2, 50, size=n_panc)
    ins_diff    = np.abs(donor_ins - recip_ins)

    donor_age_p  = liver_df['age'].values
    recip_age_p  = rng.integers(18, 75, size=n_panc)
    age_diff_p   = np.abs(donor_age_p - recip_age_p)

    donor_bg_p   = _assign_blood_groups(n_panc, rng)
    recip_bg_p   = _assign_blood_groups(n_panc, rng)
    bg_match_p   = np.array([_blood_group_match(d, r) for d, r in zip(donor_bg_p, recip_bg_p)])
    same_state_p = rng.integers(0, 2, size=n_panc)

    # Clinical tolerance: insulin diff ≤ 10 µU/mL
    ins_ok    = (ins_diff <= 10).astype(int)
    target_p  = ((bg_match_p == 1) & (ins_ok == 1)).astype(int)

    panc_rows = pd.DataFrame({
        'blood_group_match':  bg_match_p,
        'age_diff':           age_diff_p,
        'ejection_frac_diff': np.zeros(n_panc),
        'meld_score_diff':    np.zeros(n_panc),
        'lung_cap_diff':      np.zeros(n_panc),
        'insulin_diff':       ins_diff,
        'same_state':         same_state_p,
        'target':             target_p,
    })

    # ── Combine all organ rows ───────────────────────────────
    df = pd.concat([heart_rows, liver_rows, lung_rows, panc_rows], ignore_index=True)
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)  # shuffle

    X = df.drop('target', axis=1)
    y = df['target']

    print(f"  Matching dataset: {len(df)} rows  |  "
          f"compatible={y.sum()}  not_compatible={len(y)-y.sum()}")
    return X, y


def load_survival_data():
    """
    Build the survival feature matrix from real Kaggle data.

    Uses heart_failure_clinical_records.csv directly:
      - age               → recipient_age
      - ejection_fraction → ejection_frac
      - DEATH_EVENT       → target (0 = survived, 1 = died)
                            inverted: 1 = transplant success (survived)

    Donor-side features are simulated from the same distribution
    (no paired donor dataset exists publicly).

    Returns: X (DataFrame), y (Series)
    """
    _check_files()
    rng = np.random.default_rng(99)

    heart_df = pd.read_csv(HEART_CSV)
    heart_df = heart_df[['age', 'ejection_fraction', 'DEATH_EVENT']].dropna()

    n = len(heart_df)

    recipient_age  = heart_df['age'].values
    ejection_frac  = heart_df['ejection_fraction'].values

    # Simulate donor age from same population
    donor_age      = rng.choice(recipient_age, size=n, replace=True)

    # Organ type — distribute across all four types
    organ_types    = rng.choice(list(ORGAN_MAP.values()), size=n)

    # MELD score — liver patients: use liver dataset if available, else estimate
    if os.path.exists(LIVER_CSV):
        liver_df   = pd.read_csv(LIVER_CSV)[['Dataset']].dropna()
        meld_pool  = np.where(
            liver_df['Dataset'].values == 1,
            rng.integers(15, 40, size=len(liver_df)),
            rng.integers(6,  15, size=len(liver_df))
        )
        meld_score = rng.choice(meld_pool, size=n, replace=True)
    else:
        meld_score = rng.integers(6, 40, size=n)

    # Compatibility score — derived from EF proximity (higher EF diff → lower compat)
    ef_donor       = rng.choice(ejection_frac, size=n, replace=True)
    ef_diff        = np.abs(ejection_frac - ef_donor)
    # Normalise: EF diff of 0 → compat ~90%, diff of 30 → compat ~30%
    compatibility_score = np.clip(90 - (ef_diff * 2), 10, 95)
    compatibility_score += rng.normal(0, 5, size=n)
    compatibility_score  = np.clip(compatibility_score, 0, 100)

    same_state     = rng.integers(0, 2, size=n)

    # Target: DEATH_EVENT=0 means patient survived → transplant success = 1
    # DEATH_EVENT=1 means patient died → transplant success = 0
    target = (heart_df['DEATH_EVENT'].values == 0).astype(int)

    df = pd.DataFrame({
        'recipient_age':       recipient_age,
        'donor_age':           donor_age,
        'organ_type':          organ_types,
        'ejection_frac':       ejection_frac,
        'meld_score':          meld_score,
        'compatibility_score': compatibility_score,
        'same_state':          same_state,
        'target':              target,
    })

    X = df.drop('target', axis=1)
    y = df['target']

    print(f"  Survival dataset : {len(df)} rows  |  "
          f"survived={y.sum()}  died={len(y)-y.sum()}")
    return X, y
