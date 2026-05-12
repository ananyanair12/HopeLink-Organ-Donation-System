Place the following CSV files in this folder before running the training scripts.

-----------------------------------------------------------------------
FILE 1: heart_failure_clinical_records.csv
-----------------------------------------------------------------------
Source  : https://www.kaggle.com/datasets/andrewmvd/heart-failure-clinical-data
Download: Click "Download" on Kaggle → extract → copy heart_failure_clinical_records.csv here

Columns used by matching_model.py:
  - age               (patient age)
  - ejection_fraction (heart ejection fraction %)
  - DEATH_EVENT       (0 = survived, 1 = died — used as compatibility proxy)

-----------------------------------------------------------------------
FILE 2: indian_liver_patient.csv
-----------------------------------------------------------------------
Source  : https://www.kaggle.com/datasets/uciml/indian-liver-patient-records
Download: Click "Download" on Kaggle → extract → copy indian_liver_patient.csv here

Columns used by matching_model.py:
  - Age               (patient age)
  - Dataset           (1 = liver disease present, 2 = no disease — used as MELD proxy)

-----------------------------------------------------------------------
FILE 3: heart_failure_clinical_records.csv  (same file, reused)
-----------------------------------------------------------------------
Used again by survival_model.py for the survival outcome target (DEATH_EVENT).

-----------------------------------------------------------------------
NOTES
-----------------------------------------------------------------------
- Both datasets are free to download with a Kaggle account.
- Do NOT rename the files — the scripts expect these exact filenames.
- The ml/data/ folder is git-ignored. Do not commit raw CSVs.
