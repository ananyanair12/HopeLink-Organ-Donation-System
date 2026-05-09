import joblib
import numpy as np
import os

class MatchPredictor:
    def __init__(self, model_path='ml/model.pkl'):
        if not os.path.exists(model_path):
            # Fallback if path is different (e.g. running from within ml folder)
            model_path = 'model.pkl'
        
        self.model = joblib.load(model_path)

    def predict_score(self, donor, recipient):
        # Calculate features
        blood_group_match = 1 if donor.get('blood_group') == recipient.get('blood_group') else 0
        age_diff = abs(int(donor.get('age', 0)) - int(recipient.get('age', 0)))
        
        # Organ specific diffs
        # We use default 0 if field is missing for specific organ types
        ejection_frac_diff = abs(float(donor.get('ejection_frac') or 0) - float(recipient.get('ejection_frac') or 0))
        meld_score_diff = abs(int(donor.get('meld_score') or 0) - int(recipient.get('meld_score') or 0))
        lung_cap_diff = abs(float(donor.get('total_lung_cap') or 0) - float(recipient.get('total_lung_cap') or 0))
        insulin_diff = abs(float(donor.get('insulin_levels') or 0) - float(recipient.get('insulin_levels') or 0))
        
        same_state = 1 if donor.get('state') == recipient.get('state') else 0
        
        features = np.array([[
            blood_group_match, age_diff, ejection_frac_diff, 
            meld_score_diff, lung_cap_diff, insulin_diff, same_state
        ]])
        
        # Get probability of being "Compatible" (class 1)
        proba = self.model.predict_proba(features)[0][1]
        
        # Return as percentage
        return round(proba * 100, 2)
