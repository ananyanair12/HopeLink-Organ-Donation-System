# ============================================================
#  HopeLink — Survival Prediction Model
#  Algorithm : Logistic Regression
#  Data      : Real Kaggle heart failure dataset
#              (DEATH_EVENT = actual patient survival outcome)
#
#  Run standalone : python survival_model.py
#  Called by      : app.py (auto-retrain if survival_model.pkl missing)
# ============================================================

import os
import numpy as np
import joblib
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, accuracy_score, roc_auc_score

MODEL_DIR  = os.path.join(os.path.dirname(__file__), 'ml')
MODEL_PATH = os.path.join(MODEL_DIR, 'survival_model.pkl')


def train_survival_model(use_real_data=True):
    """
    Train the Logistic Regression survival model.

    Parameters
    ----------
    use_real_data : bool
        True  → load from Kaggle CSVs via data_loader.py (recommended)
        False → fall back to synthetic data generation (legacy)

    Notes
    -----
    The model is saved as a sklearn Pipeline (StandardScaler + LogisticRegression)
    so that inference in predict.py receives correctly scaled features.
    The predict_proba interface is unchanged.
    """
    os.makedirs(MODEL_DIR, exist_ok=True)

    if use_real_data:
        try:
            from data_loader import load_survival_data
            print("Loading real dataset for survival model...")
            X, y = load_survival_data()
        except FileNotFoundError as e:
            print(str(e))
            print("Falling back to synthetic data.\n")
            X, y = _generate_synthetic_data()
    else:
        X, y = _generate_synthetic_data()

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=99, stratify=y
    )

    print("Training Logistic Regression Survival Model...")
    pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('clf',    LogisticRegression(
            max_iter=1000,
            class_weight='balanced',
            C=1.0,
            random_state=99
        ))
    ])
    pipeline.fit(X_train, y_train)

    # Evaluation
    y_pred  = pipeline.predict(X_test)
    y_proba = pipeline.predict_proba(X_test)[:, 1]
    acc     = accuracy_score(y_test, y_pred)
    auc     = roc_auc_score(y_test, y_proba)

    print(f"\nSurvival Model — Test Accuracy: {acc:.4f}  |  ROC-AUC: {auc:.4f}")
    print(classification_report(y_test, y_pred, target_names=['Did Not Survive', 'Survived']))

    joblib.dump(pipeline, MODEL_PATH)
    print(f"Model saved → {MODEL_PATH}\n")
    return pipeline


def _generate_synthetic_data():
    """Legacy synthetic fallback — used only when CSVs are unavailable."""
    import pandas as pd
    rng        = np.random.default_rng(99)
    organ_map  = {'Heart': 0, 'Liver': 1, 'Lungs': 2, 'Pancreas': 3}
    n          = 2000

    recipient_age       = rng.integers(18, 75, size=n)
    donor_age           = rng.integers(18, 75, size=n)
    organ_type          = rng.choice(list(organ_map.values()), size=n)
    ejection_frac       = rng.uniform(20, 70, size=n)
    meld_score          = rng.integers(6, 40, size=n)
    compatibility_score = rng.uniform(0, 100, size=n)
    same_state          = rng.integers(0, 2, size=n)

    base_prob   = (compatibility_score / 100.0) * 0.6
    age_penalty = (recipient_age + donor_age) / 200.0 * 0.2
    state_bonus = same_state * 0.1
    final_prob  = np.clip(base_prob - age_penalty + state_bonus + 0.3, 0.1, 0.95)
    target      = (rng.random(n) < final_prob).astype(int)

    X = pd.DataFrame({
        'recipient_age':       recipient_age,
        'donor_age':           donor_age,
        'organ_type':          organ_type,
        'ejection_frac':       ejection_frac,
        'meld_score':          meld_score,
        'compatibility_score': compatibility_score,
        'same_state':          same_state,
    })
    return X, pd.Series(target, name='target')


if __name__ == '__main__':
    train_survival_model(use_real_data=True)
