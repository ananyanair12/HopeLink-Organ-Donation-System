# ============================================================
#  HopeLink — Compatibility Matching Model
#  Algorithm : Random Forest Classifier
#  Data      : Real Kaggle datasets (heart failure + liver patient)
#              engineered into the HopeLink feature schema
#
#  Run standalone : python matching_model.py
#  Called by      : app.py (auto-retrain if model.pkl missing)
# ============================================================

import os
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score

MODEL_DIR  = os.path.join(os.path.dirname(__file__), 'ml')
MODEL_PATH = os.path.join(MODEL_DIR, 'model.pkl')


def train_model(use_real_data=True):
    """
    Train the Random Forest compatibility model.

    Parameters
    ----------
    use_real_data : bool
        True  → load from Kaggle CSVs via data_loader.py (recommended)
        False → fall back to synthetic data generation (legacy)
    """
    os.makedirs(MODEL_DIR, exist_ok=True)

    if use_real_data:
        try:
            from data_loader import load_matching_data
            print("Loading real dataset for compatibility model...")
            X, y = load_matching_data()
        except FileNotFoundError as e:
            print(str(e))
            print("Falling back to synthetic data.\n")
            X, y = _generate_synthetic_data()
    else:
        X, y = _generate_synthetic_data()

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print("Training Random Forest Classifier...")
    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=10,
        min_samples_leaf=4,
        class_weight='balanced',   # handles class imbalance
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train, y_train)

    # Evaluation
    y_pred = model.predict(X_test)
    acc    = accuracy_score(y_test, y_pred)
    print(f"\nCompatibility Model — Test Accuracy: {acc:.4f}")
    print(classification_report(y_test, y_pred, target_names=['Not Compatible', 'Compatible']))

    joblib.dump(model, MODEL_PATH)
    print(f"Model saved → {MODEL_PATH}\n")
    return model


def _generate_synthetic_data():
    """Legacy synthetic fallback — used only when CSVs are unavailable."""
    import pandas as pd
    rng = np.random.default_rng(42)
    n   = 2000

    blood_group_match  = rng.choice([0, 1], size=n, p=[0.35, 0.65])
    age_diff           = rng.integers(0, 50, size=n)
    ejection_frac_diff = rng.uniform(0, 30, size=n)
    meld_score_diff    = rng.integers(0, 30, size=n)
    lung_cap_diff      = rng.uniform(0, 3, size=n)
    insulin_diff       = rng.uniform(0, 30, size=n)
    same_state         = rng.integers(0, 2, size=n)

    score = (
        blood_group_match * 40
        + same_state * 20
        + np.maximum(0, 20 - age_diff / 2)
        + np.maximum(0, 10 - ejection_frac_diff / 3)
        + np.maximum(0, 10 - meld_score_diff)
    )
    target = (score > 50).astype(int)

    X = pd.DataFrame({
        'blood_group_match':  blood_group_match,
        'age_diff':           age_diff,
        'ejection_frac_diff': ejection_frac_diff,
        'meld_score_diff':    meld_score_diff,
        'lung_cap_diff':      lung_cap_diff,
        'insulin_diff':       insulin_diff,
        'same_state':         same_state,
    })
    return X, pd.Series(target, name='target')


if __name__ == '__main__':
    train_model(use_real_data=True)
