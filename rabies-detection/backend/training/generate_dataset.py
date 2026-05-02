"""
Synthetic Rabies Clinical Dataset Generator
Improved version with more realistic feature dependencies
"""

from __future__ import annotations

import math
import random
from pathlib import Path
from typing import Any, Dict, List

import numpy as np
import pandas as pd


SEED = 42
N_SAMPLES = 1000

SCRIPT_DIR = Path(__file__).resolve().parent
RAW_OUTPUT_PATH = (SCRIPT_DIR / ".." / "data" / "raw" / "rabies_dataset.csv").resolve()
PROCESSED_OUTPUT_PATH = (SCRIPT_DIR / ".." / "data" / "processed" / "rabies_v3.csv").resolve()

COLUMNS = [
    "patient_name",
    "age",
    "gender",
    "animal_bite",
    "animal_type",
    "bite_severity",
    "wound_location",
    "days_since_bite",
    "wound_washed",
    "pep_started",
    "vaccination_status",
    "fever",
    "tingling_at_wound",
    "hydrophobia",
    "confusion",
    "muscle_spasms",
    "paralysis",
    "target",
]


def set_seed(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)


def weighted_choice(options: List[Any], weights: List[float]) -> Any:
    return random.choices(options, weights=weights, k=1)[0]


def bernoulli(p: float) -> int:
    p = max(0.0, min(1.0, p))
    return int(random.random() < p)


def sigmoid(x: float) -> float:
    return 1.0 / (1.0 + math.exp(-x))


def sample_age() -> int:
    age_group = weighted_choice(
        ["child", "adult", "elderly"],
        [0.28, 0.57, 0.15],
    )
    if age_group == "child":
        return random.randint(5, 17)
    if age_group == "adult":
        return random.randint(18, 60)
    return random.randint(61, 80)


def sample_gender() -> str:
    return weighted_choice(["male", "female"], [0.53, 0.47])


def sample_animal_bite() -> int:
    return bernoulli(0.68)


def sample_animal_type() -> str:
    return weighted_choice(
        ["dog", "cat", "monkey", "bat", "wild_animal"],
        [0.56, 0.12, 0.14, 0.06, 0.12],
    )


def sample_bite_severity(animal_type: str, age: int) -> str:
    base = {
        "dog": [0.48, 0.34, 0.18],
        "cat": [0.58, 0.29, 0.13],
        "monkey": [0.34, 0.42, 0.24],
        "bat": [0.26, 0.42, 0.32],
        "wild_animal": [0.22, 0.38, 0.40],
    }[animal_type]

    mild, moderate, severe = base

    if age <= 12:
        severe += 0.06
        mild -= 0.03
        moderate -= 0.03

    mild = max(mild, 0.05)
    moderate = max(moderate, 0.05)
    severe = max(severe, 0.05)

    total = mild + moderate + severe
    return weighted_choice(
        ["Mild", "Moderate", "Severe"],
        [mild / total, moderate / total, severe / total],
    )


def sample_wound_location(severity: str, animal_type: str, age: int) -> str:
    weights = {
        "Mild": [0.72, 0.22, 0.06],
        "Moderate": [0.58, 0.24, 0.18],
        "Severe": [0.42, 0.24, 0.34],
    }[severity]

    limb, trunk, head_neck = weights

    if animal_type in {"bat", "wild_animal"}:
        head_neck += 0.05
        limb -= 0.03
        trunk -= 0.02

    if age <= 10:
        head_neck += 0.08
        limb -= 0.05
        trunk -= 0.03

    limb = max(limb, 0.05)
    trunk = max(trunk, 0.05)
    head_neck = max(head_neck, 0.05)

    total = limb + trunk + head_neck
    return weighted_choice(
        ["Limb", "Trunk", "Head/Neck"],
        [limb / total, trunk / total, head_neck / total],
    )


def sample_days_since_bite() -> int:
    bucket = weighted_choice(
        ["very_early", "early", "mid", "late"],
        [0.22, 0.36, 0.28, 0.14],
    )
    if bucket == "very_early":
        return random.randint(0, 2)
    if bucket == "early":
        return random.randint(3, 10)
    if bucket == "mid":
        return random.randint(11, 20)
    return random.randint(21, 30)


def sample_wound_washed(days_since_bite: int) -> int:
    if days_since_bite <= 2:
        return bernoulli(0.68)
    if days_since_bite <= 10:
        return bernoulli(0.55)
    return bernoulli(0.36)


def sample_pep_started(
    days_since_bite: int,
    severity: str,
    wound_location: str,
    wound_washed: int,
) -> int:
    p = 0.20

    if days_since_bite <= 2:
        p += 0.34
    elif days_since_bite <= 7:
        p += 0.22
    elif days_since_bite <= 14:
        p += 0.10

    if severity == "Severe":
        p += 0.12
    elif severity == "Moderate":
        p += 0.06

    if wound_location == "Head/Neck":
        p += 0.10

    if wound_washed == 1:
        p += 0.05

    return bernoulli(p)


def sample_vaccination_status(animal_bite: int, animal_type: str) -> int:
    p = 0.14 if animal_bite else 0.18
    if animal_type in {"dog", "cat"}:
        p += 0.02
    return bernoulli(p)


def exposure_risk_score(
    age: int,
    animal_bite: int,
    animal_type: str,
    severity: str,
    wound_location: str,
    days_since_bite: int,
    wound_washed: int,
    pep_started: int,
    vaccination_status: int,
) -> float:
    if animal_bite == 0:
        return -5.0

    score = -0.8

    score += {
        "dog": 0.80,
        "cat": 0.45,
        "monkey": 0.95,
        "bat": 1.15,
        "wild_animal": 1.10,
    }[animal_type]

    score += {
        "Mild": 0.30,
        "Moderate": 0.85,
        "Severe": 1.45,
    }[severity]

    score += {
        "Limb": 0.15,
        "Trunk": 0.45,
        "Head/Neck": 1.15,
    }[wound_location]

    if age <= 12:
        score += 0.25
    elif age >= 65:
        score += 0.18

    if days_since_bite >= 21:
        score += 0.55
    elif days_since_bite >= 11:
        score += 0.30
    elif days_since_bite <= 2:
        score -= 0.08

    if wound_washed == 1:
        score -= 0.65

    if pep_started == 1:
        score -= 1.25

    if vaccination_status == 1:
        score -= 0.95

    score += np.random.normal(0, 0.30)
    return score


def sample_symptoms(
    animal_bite: int,
    target: int,
    days_since_bite: int,
    severity: str,
    wound_location: str,
    pep_started: int,
    vaccination_status: int,
) -> Dict[str, int]:
    if animal_bite == 0:
        return {
            "fever": bernoulli(0.05),
            "tingling_at_wound": 0,
            "hydrophobia": 0,
            "confusion": 0,
            "muscle_spasms": 0,
            "paralysis": 0,
        }

    is_late = days_since_bite >= 10
    is_very_late = days_since_bite >= 18
    severe_case = severity == "Severe" or wound_location == "Head/Neck"
    protected = pep_started == 1 or vaccination_status == 1

    if target == 0:
        fever = bernoulli(0.10 if not protected else 0.05)
        tingling = bernoulli(0.07 if is_late else 0.03)
        hydrophobia = bernoulli(0.01 if is_very_late and not protected else 0.0)
        confusion = bernoulli(0.01 if is_very_late and not protected else 0.0)
        spasms = bernoulli(0.01 if is_very_late and not protected else 0.0)
        paralysis = bernoulli(0.005 if is_very_late and not protected else 0.0)
    else:
        fever = bernoulli(0.48 if is_late else 0.22)
        tingling = bernoulli(0.42 if is_late else 0.18)

        hydro_p = 0.05
        conf_p = 0.04
        spasm_p = 0.04
        para_p = 0.03

        if is_late:
            hydro_p += 0.18
            conf_p += 0.14
            spasm_p += 0.16
            para_p += 0.10

        if is_very_late:
            hydro_p += 0.18
            conf_p += 0.16
            spasm_p += 0.14
            para_p += 0.14

        if severe_case:
            hydro_p += 0.07
            conf_p += 0.07
            spasm_p += 0.06
            para_p += 0.05

        if protected:
            hydro_p -= 0.08
            conf_p -= 0.06
            spasm_p -= 0.06
            para_p -= 0.05

        hydrophobia = bernoulli(hydro_p)
        confusion = bernoulli(conf_p)
        spasms = bernoulli(spasm_p)
        paralysis = bernoulli(para_p)

    return {
        "fever": fever,
        "tingling_at_wound": tingling,
        "hydrophobia": hydrophobia,
        "confusion": confusion,
        "muscle_spasms": spasms,
        "paralysis": paralysis,
    }


def build_positive_label(
    risk_score: float,
    days_since_bite: int,
    hydrophobia: int,
    confusion: int,
    muscle_spasms: int,
    paralysis: int,
) -> int:
    symptom_boost = (
        1.10 * hydrophobia
        + 0.85 * confusion
        + 0.85 * muscle_spasms
        + 1.05 * paralysis
    )

    time_factor = 0.0
    if days_since_bite >= 18:
        time_factor += 0.22
    elif days_since_bite >= 10:
        time_factor += 0.10

    final_score = risk_score + symptom_boost + time_factor
    probability = sigmoid(final_score)
    return bernoulli(probability)


def generate_row(index: int) -> Dict[str, Any]:
    patient_name = f"Patient_{index}"
    age = sample_age()
    gender = sample_gender()
    animal_bite = sample_animal_bite()

    if animal_bite == 0:
        return {
            "patient_name": patient_name,
            "age": age,
            "gender": gender,
            "animal_bite": 0,
            "animal_type": "none",
            "bite_severity": "None",
            "wound_location": "None",
            "days_since_bite": 0,
            "wound_washed": 0,
            "pep_started": 0,
            "vaccination_status": bernoulli(0.18),
            "fever": bernoulli(0.05),
            "tingling_at_wound": 0,
            "hydrophobia": 0,
            "confusion": 0,
            "muscle_spasms": 0,
            "paralysis": 0,
            "target": 0,
        }

    animal_type = sample_animal_type()
    bite_severity = sample_bite_severity(animal_type, age)
    wound_location = sample_wound_location(bite_severity, animal_type, age)
    days_since_bite = sample_days_since_bite()
    wound_washed = sample_wound_washed(days_since_bite)
    pep_started = sample_pep_started(days_since_bite, bite_severity, wound_location, wound_washed)
    vaccination_status = sample_vaccination_status(animal_bite, animal_type)

    base_risk = exposure_risk_score(
        age=age,
        animal_bite=animal_bite,
        animal_type=animal_type,
        severity=bite_severity,
        wound_location=wound_location,
        days_since_bite=days_since_bite,
        wound_washed=wound_washed,
        pep_started=pep_started,
        vaccination_status=vaccination_status,
    )

    provisional_target = bernoulli(sigmoid(base_risk))

    symptoms = sample_symptoms(
        animal_bite=animal_bite,
        target=provisional_target,
        days_since_bite=days_since_bite,
        severity=bite_severity,
        wound_location=wound_location,
        pep_started=pep_started,
        vaccination_status=vaccination_status,
    )

    final_target = build_positive_label(
        risk_score=base_risk,
        days_since_bite=days_since_bite,
        hydrophobia=symptoms["hydrophobia"],
        confusion=symptoms["confusion"],
        muscle_spasms=symptoms["muscle_spasms"],
        paralysis=symptoms["paralysis"],
    )

    if pep_started == 1 and vaccination_status == 1 and final_target == 1:
        if random.random() < 0.45:
            final_target = 0

    return {
        "patient_name": patient_name,
        "age": age,
        "gender": gender,
        "animal_bite": animal_bite,
        "animal_type": animal_type,
        "bite_severity": bite_severity,
        "wound_location": wound_location,
        "days_since_bite": days_since_bite,
        "wound_washed": wound_washed,
        "pep_started": pep_started,
        "vaccination_status": vaccination_status,
        "fever": symptoms["fever"],
        "tingling_at_wound": symptoms["tingling_at_wound"],
        "hydrophobia": symptoms["hydrophobia"],
        "confusion": symptoms["confusion"],
        "muscle_spasms": symptoms["muscle_spasms"],
        "paralysis": symptoms["paralysis"],
        "target": final_target,
    }


def validate_generated_data(df: pd.DataFrame) -> None:
    assert list(df.columns) == COLUMNS, "Column mismatch"

    no_bite = df["animal_bite"] == 0
    assert (df.loc[no_bite, "animal_type"] == "none").all()
    assert (df.loc[no_bite, "bite_severity"] == "None").all()
    assert (df.loc[no_bite, "wound_location"] == "None").all()
    assert (df.loc[no_bite, "days_since_bite"] == 0).all()
    assert (df.loc[no_bite, "wound_washed"] == 0).all()
    assert (df.loc[no_bite, "pep_started"] == 0).all()
    assert (df.loc[no_bite, "tingling_at_wound"] == 0).all()
    assert (df.loc[no_bite, "hydrophobia"] == 0).all()
    assert (df.loc[no_bite, "confusion"] == 0).all()
    assert (df.loc[no_bite, "muscle_spasms"] == 0).all()
    assert (df.loc[no_bite, "paralysis"] == 0).all()
    assert (df.loc[no_bite, "target"] == 0).all()

    bite_rows = df["animal_bite"] == 1
    assert (df.loc[bite_rows, "animal_type"] != "none").all()
    assert (df.loc[bite_rows, "bite_severity"] != "None").all()
    assert (df.loc[bite_rows, "wound_location"] != "None").all()
    assert df["target"].isin([0, 1]).all()


def print_summary(df: pd.DataFrame) -> None:
    print("\nDataset Summary")
    print("=" * 60)
    print(f"Total records: {len(df)}")
    print(f"Positive target rate: {df['target'].mean() * 100:.2f}%")
    print(f"Animal bite cases: {df['animal_bite'].mean() * 100:.2f}%")

    print("\nAnimal type distribution:")
    print(df["animal_type"].value_counts(dropna=False))

    print("\nSeverity distribution:")
    print(df["bite_severity"].value_counts(dropna=False))

    print("\nWound location distribution:")
    print(df["wound_location"].value_counts(dropna=False))

    print("\nTarget by bite:")
    print(pd.crosstab(df["animal_bite"], df["target"], normalize="index"))


def generate_dataset(n: int = N_SAMPLES, seed: int = SEED) -> pd.DataFrame:
    set_seed(seed)

    rows = [generate_row(i) for i in range(n)]
    df = pd.DataFrame(rows, columns=COLUMNS)

    validate_generated_data(df)

    RAW_OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    PROCESSED_OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    df.to_csv(RAW_OUTPUT_PATH, index=False)
    df.to_csv(PROCESSED_OUTPUT_PATH, index=False)

    print(f"Raw dataset saved to: {RAW_OUTPUT_PATH}")
    print(f"Processed dataset saved to: {PROCESSED_OUTPUT_PATH}")

    print_summary(df)
    return df


if __name__ == "__main__":
    generate_dataset()