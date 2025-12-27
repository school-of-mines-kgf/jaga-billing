from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os

app = Flask(__name__)
CORS(app)

# In-memory storage (Vercel serverless has no persistent file storage)
# We'll use environment variables or external storage for production
bills_data = {
    "bills": [],
    "lastBillNumber": 0
}

# Initialize with some default data
def get_initial_data():
    return {
        "lastBillNumber": 11,
        "bills": [
            {"billNumber": "11", "customerName": "gh", "customerPhone": "6555", "customerAddress": "jk", "billDate": "2025-12-26", "formattedDate": "26 December 2025", "items": [{"id": 1, "name": "milk", "qty": 1, "price": 5632, "courier": 123, "total": 5755}], "subtotal": 5755, "courierCharges": 123, "grandTotal": 5878, "createdAt": "2025-12-26T12:33:31.995Z"},
            {"billNumber": "10", "customerName": "Cloud Test 2", "customerPhone": "N/A", "customerAddress": "N/A", "billDate": "2025-12-26", "formattedDate": "26 December 2025", "items": [{"id": 1, "name": "Cloud Test Item", "qty": 1, "price": 999, "courier": 0, "total": 999}], "subtotal": 1099, "courierCharges": 0, "grandTotal": 1099, "createdAt": "2025-12-26T07:21:25.833Z"},
            {"billNumber": "9", "customerName": "Cloud Test 2", "customerPhone": "N/A", "customerAddress": "N/A", "billDate": "2025-12-26", "formattedDate": "26 December 2025", "items": [{"id": 1, "name": "Cloud Test Item", "qty": 1, "price": 999, "courier": 0, "total": 999}], "subtotal": 1099, "courierCharges": 0, "grandTotal": 1099, "createdAt": "2025-12-26T07:18:47.931Z"},
            {"billNumber": "8", "customerName": "Cloud Test Customer", "customerPhone": "N/A", "customerAddress": "N/A", "billDate": "2025-12-26", "formattedDate": "26 December 2025", "items": [{"id": 1, "name": "Cloud Test Item", "qty": 1, "price": 999, "courier": 0, "total": 999}], "subtotal": 999, "courierCharges": 0, "grandTotal": 999, "createdAt": "2025-12-26T07:17:40.360Z"},
            {"billNumber": "7", "customerName": "Test Customer", "customerPhone": "N/A", "customerAddress": "N/A", "billDate": "2025-12-26", "formattedDate": "26 December 2025", "items": [{"id": 1, "name": "Test Silk Saree", "qty": 2, "price": 500, "courier": 0, "total": 1000}], "subtotal": 1160, "courierCharges": 0, "grandTotal": 1160, "createdAt": "2025-12-26T07:15:09.081Z"},
            {"billNumber": "1", "customerName": "vishnu", "customerPhone": "963216321", "customerAddress": "btm", "billDate": "2025-12-25", "formattedDate": "25 December 2025", "items": [{"id": 1, "name": "silk", "qty": 1, "price": 350, "courier": 0, "total": 350}], "subtotal": 350, "courierCharges": 56, "grandTotal": 406, "createdAt": "2025-12-25T15:33:56.054Z"}
        ]
    }

bills_data = get_initial_data()

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "message": "Jaga Billing API"})

@app.route('/api/bills', methods=['GET'])
def get_bills():
    return jsonify({
        "success": True,
        "bills": bills_data["bills"],
        "lastBillNumber": bills_data["lastBillNumber"],
        "count": len(bills_data["bills"])
    })

@app.route('/api/bills', methods=['POST'])
def save_bill():
    bill = request.get_json()
    if not bill:
        return jsonify({"success": False, "error": "No data"}), 400
    
    bill_num = str(bill.get("billNumber", ""))
    existing = next((i for i, b in enumerate(bills_data["bills"]) if str(b.get("billNumber")) == bill_num), None)
    
    if existing is not None:
        bills_data["bills"][existing] = bill
    else:
        bills_data["bills"].insert(0, bill)
    
    bills_data["lastBillNumber"] = max(bills_data["lastBillNumber"], int(bill_num) if bill_num.isdigit() else 0)
    
    return jsonify({"success": True, "message": f"Bill #{bill_num} saved"})

@app.route('/api/bills/sync', methods=['POST'])
def sync_bills():
    data = request.get_json()
    if data:
        bills_data["bills"] = data.get("bills", [])
        bills_data["lastBillNumber"] = data.get("lastBillNumber", 0)
    return jsonify({"success": True, "message": "Synced"})

@app.route('/api/bills/<bill_number>', methods=['DELETE'])
def delete_bill(bill_number):
    original = len(bills_data["bills"])
    bills_data["bills"] = [b for b in bills_data["bills"] if str(b.get("billNumber")) != str(bill_number)]
    if len(bills_data["bills"]) == original:
        return jsonify({"success": False, "error": "Not found"}), 404
    return jsonify({"success": True, "message": f"Bill #{bill_number} deleted"})

@app.route('/')
def index():
    return jsonify({"name": "Jaga Billing API", "version": "1.0.0"})

# For Vercel
app = app
