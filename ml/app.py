from flask import Flask, request, jsonify
from predict import MatchPredictor
import os

app = Flask(__name__)

import joblib
import numpy as np

class MatchPredictor:
    def __init__(self, model_path='ml/model.pkl'):
        if not os.path.exists(model_path): model_path = 'model.pkl'
        self.model = joblib.load(model_path)

    def predict_score(self, donor, recipient):
        blood_group_match = 1 if donor.get('blood_group') == recipient.get('blood_group') else 0
        age_diff = abs(int(donor.get('age', 0)) - int(recipient.get('age', 0)))
        ejection_frac_diff = abs(float(donor.get('ejection_frac') or 0) - float(recipient.get('ejection_frac') or 0))
        meld_score_diff = abs(int(donor.get('meld_score') or 0) - int(recipient.get('meld_score') or 0))
        lung_cap_diff = abs(float(donor.get('total_lung_cap') or 0) - float(recipient.get('total_lung_cap') or 0))
        insulin_diff = abs(float(donor.get('insulin_levels') or 0) - float(recipient.get('insulin_levels') or 0))
        same_state = 1 if donor.get('state') == recipient.get('state') else 0
        
        features = np.array([[blood_group_match, age_diff, ejection_frac_diff, meld_score_diff, lung_cap_diff, insulin_diff, same_state]])
        return round(self.model.predict_proba(features)[0][1] * 100, 2)

class SurvivalPredictor:
    def __init__(self, model_path='ml/survival_model.pkl'):
        if not os.path.exists(model_path): model_path = 'survival_model.pkl'
        self.model = joblib.load(model_path)
        self.organ_map = {'Heart': 0, 'Liver': 1, 'Lungs': 2, 'Pancreas': 3}

    def predict_survival(self, donor, recipient, comp_score):
        organ_type = recipient.get('organ_needed') or donor.get('organ') or 'Heart'
        features = np.array([[
            int(recipient.get('age', 0)),
            int(donor.get('age', 0)),
            self.organ_map.get(organ_type, 0),
            float(donor.get('ejection_frac') or 0),
            int(donor.get('meld_score') or 0),
            float(comp_score),
            1 if donor.get('state') == recipient.get('state') else 0
        ]])
        return round(self.model.predict_proba(features)[0][1] * 100, 2)

# Initialize predictors
if not os.path.exists('ml/model.pkl'):
    from matching_model import train_model
    train_model()
if not os.path.exists('ml/survival_model.pkl'):
    from survival_model import train_survival_model
    train_survival_model()

predictor = MatchPredictor()
survival_predictor = SurvivalPredictor()

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    donor, recipient = data.get('donor'), data.get('recipient')
    if not donor or not recipient: return jsonify({'error': 'Missing data'}), 400
    try:
        score = predictor.predict_score(donor, recipient)
        return jsonify({'compatibility_score': score})
    except Exception as e: return jsonify({'error': str(e)}), 500

@app.route('/predict-survival', methods=['POST'])
def predict_survival():
    data = request.json
    donor, recipient = data.get('donor'), data.get('recipient')
    comp_score = data.get('compatibility_score', 50)
    if not donor or not recipient: return jsonify({'error': 'Missing data'}), 400
    try:
        prob = survival_predictor.predict_survival(donor, recipient, comp_score)
        return jsonify({'survival_probability': prob})
    except Exception as e: return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5001, debug=True)
