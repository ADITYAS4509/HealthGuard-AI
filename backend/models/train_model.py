import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score
import joblib
import os

# Load dataset
data_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'symptom_disease.csv')
data = pd.read_csv(data_path)

# Features and target
symptoms = ['fever', 'cough', 'headache', 'nausea', 'chest_pain', 'sweating', 'shortness_of_breath', 'fatigue', 'sore_throat', 'runny_nose']
X = data[symptoms]
y = data['disease']

# Split data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train model
model = DecisionTreeClassifier(random_state=42)
model.fit(X_train, y_train)

# Evaluate
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f"Model Accuracy: {accuracy}")

# Save model
model_path = os.path.join(os.path.dirname(__file__), 'disease_model.pkl')
joblib.dump(model, model_path)

# Save feature names
feature_path = os.path.join(os.path.dirname(__file__), 'features.pkl')
joblib.dump(symptoms, feature_path)

print("Model trained and saved.")