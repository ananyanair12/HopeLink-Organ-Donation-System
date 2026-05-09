import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
import joblib
import os

def generate_synthetic_data(n_samples=1000):
    np.random.seed(42)
    
    data = []
    for _ in range(n_samples):
        blood_group_match = np.random.choice([0, 1], p=[0.3, 0.7])
        age_diff = np.random.randint(0, 50)
        ejection_frac_diff = np.random.uniform(0, 30)
        meld_score_diff = np.random.randint(0, 20)
        lung_cap_diff = np.random.uniform(0, 3)
        insulin_diff = np.random.uniform(0, 10)
        same_state = np.random.choice([0, 1], p=[0.6, 0.4])
        
        # Heuristic for ground truth (1 = Compatible, 0 = Not)
        # Higher score if blood match, same state, and low differences
        score = (
            (blood_group_match * 40) + 
            (same_state * 20) + 
            (max(0, 20 - age_diff/2)) + 
            (max(0, 10 - ejection_frac_diff/3)) + 
            (max(0, 10 - meld_score_diff))
        )
        
        is_compatible = 1 if score > 50 else 0
        
        data.append([
            blood_group_match, age_diff, ejection_frac_diff, 
            meld_score_diff, lung_cap_diff, insulin_diff, same_state, 
            is_compatible
        ])
        
    columns = [
        'blood_group_match', 'age_diff', 'ejection_frac_diff', 
        'meld_score_diff', 'lung_cap_diff', 'insulin_diff', 
        'same_state', 'target'
    ]
    return pd.DataFrame(data, columns=columns)

def train_model():
    print("Generating synthetic data...")
    df = generate_synthetic_data()
    
    X = df.drop('target', axis=1)
    y = df['target']
    
    print("Training Random Forest Classifier...")
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X, y)
    
    # Ensure directory exists
    os.makedirs('ml', exist_ok=True)
    
    model_path = os.path.join('ml', 'model.pkl')
    joblib.dump(model, model_path)
    print(f"Model saved to {model_path}")

if __name__ == "__main__":
    train_model()
