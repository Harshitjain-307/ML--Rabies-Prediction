"""
Synthetic Rabies Clinical Dataset Generator
Generates 1000 patient records with realistic clinical features
"""

import numpy as np
import pandas as pd
import os

def generate_dataset(n=1000, seed=42):
    np.random.seed(seed)

    # Patient demographics
    patient_names = [f"Patient_{i}" for i in range(n)]
    ages = np.random.randint(5, 81, size=n)
    genders = np.random.choice(['male', 'female'], size=n, p=[0.52, 0.48])

    # Animal bite (70% chance of bite)
    animal_bite = np.random.choice([1, 0], size=n, p=[0.70, 0.30])

    # Animal type
    animal_types = []
    for bite in animal_bite:
        if bite == 1:
            animal_types.append(np.random.choice(
                ['dog', 'cat', 'monkey', 'bat', 'wild_animal'],
                p=[0.50, 0.20, 0.15, 0.05, 0.10]
            ))
        else:
            animal_types.append('none')

    # Bite severity
    bite_severities = []
    for bite in animal_bite:
        if bite == 1:
            bite_severities.append(np.random.choice(
                ['Mild', 'Moderate', 'Severe'], p=[0.40, 0.35, 0.25]
            ))
        else:
            bite_severities.append('None')

    # Wound location
    wound_locations = []
    for bite in animal_bite:
        if bite == 1:
            wound_locations.append(np.random.choice(
                ['Limb', 'Trunk', 'Head/Neck'], p=[0.60, 0.25, 0.15]
            ))
        else:
            wound_locations.append('None')

    # Days since bite
    days_since_bite = np.where(
        animal_bite == 1,
        np.random.randint(0, 31, size=n),
        0
    )

    # Wound washed (60% unwashed if bitten)
    wound_washed = np.where(
        animal_bite == 1,
        np.random.choice([0, 1], size=n, p=[0.60, 0.40]),
        0
    )

    # PEP started (80% not started)
    pep_started = np.where(
        animal_bite == 1,
        np.random.choice([0, 1], size=n, p=[0.80, 0.20]),
        0
    )

    # Vaccination status (70% unvaccinated)
    vaccination_status = np.random.choice([0, 1], size=n, p=[0.70, 0.30])

    # Clinical symptoms (binary)
    fever = np.random.choice([0, 1], size=n, p=[0.55, 0.45])
    tingling_at_wound = np.where(
        animal_bite == 1,
        np.random.choice([0, 1], size=n, p=[0.55, 0.45]),
        np.random.choice([0, 1], size=n, p=[0.90, 0.10])
    )
    hydrophobia = np.random.choice([0, 1], size=n, p=[0.85, 0.15])
    confusion = np.random.choice([0, 1], size=n, p=[0.75, 0.25])
    muscle_spasms = np.random.choice([0, 1], size=n, p=[0.80, 0.20])
    paralysis = np.random.choice([0, 1], size=n, p=[0.87, 0.13])

    # Compute risk score and target label
    bite_severity_arr = np.array(bite_severities)
    wound_location_arr = np.array(wound_locations)
    animal_type_arr = np.array(animal_types)

    risk_scores = np.zeros(n)
    for i in range(n):
        score = 0.0
        if animal_bite[i]:
            score += 0.4
            if bite_severity_arr[i] == 'Severe':
                score += 0.3
            if wound_location_arr[i] == 'Head/Neck':
                score += 0.3
            if animal_type_arr[i] in ['bat', 'wild_animal']:
                score += 0.2
            if not wound_washed[i]:
                score += 0.1
            if not pep_started[i] and days_since_bite[i] > 7:
                score += 0.3
        if hydrophobia[i]:
            score += 0.8
        if tingling_at_wound[i]:
            score += 0.3
        if confusion[i]:
            score += 0.2
        risk_scores[i] = score

    target = (risk_scores > 0.6).astype(int)

    df = pd.DataFrame({
        'patient_name': patient_names,
        'age': ages,
        'gender': genders,
        'animal_bite': animal_bite,
        'animal_type': animal_type_arr,
        'bite_severity': bite_severity_arr,
        'wound_location': wound_location_arr,
        'days_since_bite': days_since_bite,
        'wound_washed': wound_washed,
        'pep_started': pep_started,
        'vaccination_status': vaccination_status,
        'fever': fever,
        'tingling_at_wound': tingling_at_wound,
        'hydrophobia': hydrophobia,
        'confusion': confusion,
        'muscle_spasms': muscle_spasms,
        'paralysis': paralysis,
        'risk_score': risk_scores,
        'target': target
    })

    # Save raw
    raw_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'raw', 'rabies_dataset.csv')
    raw_path = os.path.normpath(raw_path)
    os.makedirs(os.path.dirname(raw_path), exist_ok=True)
    df.to_csv(raw_path, index=False)
    print(f"Raw dataset saved to: {raw_path}")

    # Save processed (drop risk_score, keep all other features)
    df_processed = df.drop(columns=['risk_score'])
    processed_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'processed', 'rabies_v3.csv')
    processed_path = os.path.normpath(processed_path)
    os.makedirs(os.path.dirname(processed_path), exist_ok=True)
    df_processed.to_csv(processed_path, index=False)
    print(f"Processed dataset saved to: {processed_path}")

    print(f"\nDataset Summary:")
    print(f"  Total records: {len(df)}")
    print(f"  High risk (target=1): {target.sum()} ({target.mean()*100:.1f}%)")
    print(f"  Low risk (target=0): {(target==0).sum()} ({(target==0).mean()*100:.1f}%)")
    print(f"  Animal bite cases: {animal_bite.sum()} ({animal_bite.mean()*100:.1f}%)")
    print(f"  Hydrophobia cases: {hydrophobia.sum()} ({hydrophobia.mean()*100:.1f}%)")

    return df_processed


if __name__ == '__main__':
    generate_dataset()
