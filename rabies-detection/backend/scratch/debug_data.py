import pandas as pd
from pathlib import Path

DATA_PATH = Path(r"c:\Users\hj307\OneDrive\Desktop\new research project\rabies-detection\backend\data\processed\rabies_v3.csv")
df = pd.read_csv(DATA_PATH)
print("--- Info ---")
print(df.info())
print("\n--- Value Counts Target ---")
print(df["target"].value_counts(dropna=False))
print("\n--- NaNs ---")
print(df.isna().sum())
