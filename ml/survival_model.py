import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression
import joblib
import os

def generate_survival_data(n_samples=1000):
    np.random.seed(99)
    
    data = []
    organ_map = {'Heart': 0, 'Liver': 1, 'Lungs': 2, 'Pancreas': 3}
    
    for _ in range(n_samples):
        recipient_age = np.random.randint(18, 75)
        donor_age = np.random.randint(18, 75)
        organ_type = np.random.choice(['Heart', 'Liver', 'Lungs', 'Pancreas'])
        ejection_frac = np.random.uniform(30, 70)
        meld_score = np.random.randint(6, 40)
        compatibility_score = np.random.uniform(0, 100)
        same_state = np.random.choice([0, 1])
        
        # Heuristic for success
        # Success is higher if:
        # - Compatibility is high
        # - Ages are young
        # - Meld score is low (for liver)
        # - Ejection fraction is high (for heart)
        
        base_prob = (compatibility_score / 100.0) * 0.6
        age_penalty = (recipient_age + donor_age) / 200.0 * 0.2
        state_bonus = 0.1 if same_state == 1 else 0
        
        final_prob = base_prob - age_penalty + state_bonus + 0.3
        final_prob = max(0.1, min(0.95, final_prob))
        
        success = 1 if np.random.random() < final_prob else 0
        
        data.append([
            recipient_age, donor_age, organ_map[organ_type],
            ejection_frac, meld_score, compatibility_score, 
            same_state, success
        ])
        
    columns = [
        'recipient_age', 'donor_age', 'organ_type', 
        'ejection_frac', 'meld_score', 'compatibility_score', 
        'same_state', 'target'
    ]
    return pd.DataFrame(data, columns=columns)

def train_survival_model():
    print("Generating survival synthetic data...")
    df = generate_survival_data()
    
    X = df.drop('target', axis=1)
    y = df['target']
    
    print("Training Logistic Regression Model for Survival...")
    model = LogisticRegression(max_iter=1000)
    model.fit(X, y)
    
    os.makedirs('ml', exist_ok=True)
    model_path = os.path.join('ml', 'survival_model.pkl')
    joblib.dump(model, model_path)
    print(f"Survival model saved to {model_path}")

if __name__ == "__main__":
    train_survival_model()
