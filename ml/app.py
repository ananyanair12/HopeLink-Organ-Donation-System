# ============================================================
#  HopeLink — Flask ML Inference Server
#  Port : 5001
#  Endpoints:
#    POST /predict          → compatibility score (0–100%)
#    POST /predict-survival → survival probability (0–100%)
# ============================================================

from flask import Flask, request, jsonify
import joblib
import numpy as np
import os

app = Flask(__name__)

# ── Model paths ──────────────────────────────────────────────
BASE_DIR        = os.path.dirname(__file__)
MATCH_MODEL     = os.path.join(BASE_DIR, 'ml', 'model.pkl')
SURVIVAL_MODEL  = os.path.join(BASE_DIR, 'ml', 'survival_model.pkl')

ORGAN_MAP = {'Heart': 0, 'Liver': 1, 'Lungs': 2, 'Pancreas': 3}


# ── Auto-train if models are missing ─────────────────────────
if not os.path.exists(MATCH_MODEL):
    print("model.pkl not found — training compatibility model...")
    from matching_model import train_model
    train_model(use_real_data=True)

if not os.path.exists(SURVIVAL_MODEL):
    print("survival_model.pkl not found — training survival model...")
    from survival_model import train_survival_model
    train_survival_model(use_real_data=True)


# ── Load models ───────────────────────────────────────────────
match_model    = joblib.load(MATCH_MODEL)
survival_model = joblib.load(SURVIVAL_MODEL)


# ── Feature extraction helpers ────────────────────────────────
def _matching_features(donor, recipient):
    """
    Build the 7-feature vector expected by the Random Forest model.
    Feature order must match data_loader.load_matching_data() columns.
    """
    blood_group_match  = 1 if donor.get('blood_group') == recipient.get('blood_group') else 0
    age_diff           = abs(int(donor.get('age', 0)) - int(recipient.get('age', 0)))
    ejection_frac_diff = abs(float(donor.get('ejection_frac') or 0)   - float(recipient.get('ejection_frac') or 0))
    meld_score_diff    = abs(int(donor.get('meld_score') or 0)         - int(recipient.get('meld_score') or 0))
    lung_cap_diff      = abs(float(donor.get('total_lung_cap') or 0)   - float(recipient.get('total_lung_cap') or 0))
    insulin_diff       = abs(float(donor.get('insulin_levels') or 0)   - float(recipient.get('insulin_levels') or 0))
    same_state         = 1 if donor.get('state') == recipient.get('state') else 0

    return np.array([[
        blood_group_match, age_diff, ejection_frac_diff,
        meld_score_diff, lung_cap_diff, insulin_diff, same_state
    ]])


def _survival_features(donor, recipient, comp_score):
    """
    Build the 7-feature vector expected by the Logistic Regression pipeline.
    Feature order must match data_loader.load_survival_data() columns.
    """
    organ_type = recipient.get('organ_needed') or donor.get('organ') or 'Heart'

    return np.array([[
        int(recipient.get('age', 0)),
        int(donor.get('age', 0)),
        ORGAN_MAP.get(organ_type, 0),
        float(donor.get('ejection_frac') or 0),
        int(donor.get('meld_score') or 0),
        float(comp_score),
        1 if donor.get('state') == recipient.get('state') else 0
    ]])


# ── Routes ────────────────────────────────────────────────────
@app.route('/predict', methods=['POST'])
def predict():
    data      = request.json
    donor     = data.get('donor')
    recipient = data.get('recipient')

    if not donor or not recipient:
        return jsonify({'error': 'Missing donor or recipient data'}), 400

    try:
        features = _matching_features(donor, recipient)
        score    = round(match_model.predict_proba(features)[0][1] * 100, 2)
        return jsonify({'compatibility_score': score})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/predict-survival', methods=['POST'])
def predict_survival():
    data      = request.json
    donor     = data.get('donor')
    recipient = data.get('recipient')
    comp_score = data.get('compatibility_score', 50)

    if not donor or not recipient:
        return jsonify({'error': 'Missing donor or recipient data'}), 400

    try:
        features = _survival_features(donor, recipient, comp_score)
        prob     = round(survival_model.predict_proba(features)[0][1] * 100, 2)
        return jsonify({'survival_probability': prob})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'models': ['match', 'survival']})


# ── Start ─────────────────────────────────────────────────────
if __name__ == '__main__':
    app.run(port=5001, debug=True)
