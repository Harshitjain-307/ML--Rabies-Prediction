# 🧬 RabiesAI — Clinical Risk Intelligence Platform

> Research-grade clinical decision support for rabies risk assessment powered by XGBoost ML.

---

## 🗂️ Project Structure

```
rabies-detection/
├── backend/
│   ├── data/raw/              ← Synthetic clinical dataset (1000 records)
│   ├── data/processed/        ← Preprocessed dataset (rabies_v3.csv)
│   ├── models/                ← Trained XGBoost model (rabies_model.pkl)
│   ├── training/
│   │   ├── generate_dataset.py
│   │   └── train_model.py
│   ├── app/                   ← FastAPI backend
│   └── requirements.txt
├── frontend/                  ← React + TypeScript + Vite + TailwindCSS
│   └── src/
│       ├── pages/             ← 5 pages
│       └── components/        ← Chatbot
└── README.md
```

---

## 🚀 How to Run

### 1. Generate Dataset
```powershell
cd rabies-detection
python backend/training/generate_dataset.py
```

### 2. Train Model
```powershell
python backend/training/train_model.py
```

### 3. Start Backend
```powershell
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 4. Start Frontend
```powershell
cd frontend
npm install
npm run dev
```

### 5. Open Browser
Visit: http://localhost:5173

---

## 🤖 Model Performance
| Metric    | Value     |
|-----------|-----------|
| Accuracy  | ≥ 93%     |
| AUROC     | ≥ 0.95    |
| Algorithm | XGBoost   |
| Features  | 17        |
| Records   | 1,000     |

---

## 💬 AI Chatbot
The built-in **RabiesAI Assistant** answers clinical questions about:
- PEP protocols and vaccine schedules
- Wound care and first aid
- Symptom progression and recognition
- Animal risk classification
- Patient-specific next steps (context-aware after assessment)

---

## ⚠️ Disclaimer
This tool is for **research and clinical education only**. It is not a substitute for professional medical diagnosis or treatment.
