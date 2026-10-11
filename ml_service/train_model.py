import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score


# Load training data
data = pd.read_csv("skill_assessment_data.csv")


# Input features
X = data[
    [
        "technical_score",
        "communication_score",
        "problem_solving"
    ]
]


# Output
y = data["skill_level"]


# Convert Strong / Average / Weak into numbers
encoder = LabelEncoder()
y_encoded = encoder.fit_transform(y)


# Split the data
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y_encoded,
    test_size=0.2,
    random_state=42
)


# Create the ML model
model = RandomForestClassifier(
    n_estimators=100,
    random_state=42
)


# Train the model
model.fit(X_train, y_train)


# Test the model
predictions = model.predict(X_test)

accuracy = accuracy_score(
    y_test,
    predictions
)

print("Model accuracy:", accuracy)


# Save the trained model
joblib.dump(
    model,
    "skill_assessment_model.pkl"
)

joblib.dump(
    encoder,
    "label_encoder.pkl"
)

print("Model saved successfully.")