import os
import json

# Ensure directories exist
os.makedirs("src/data", exist_ok=True)
os.makedirs("public/data", exist_ok=True)

# We will read or embed the CSV data
print("Script directory initialized")
