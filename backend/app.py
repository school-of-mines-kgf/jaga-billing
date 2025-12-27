from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Database file path
DATABASE_FILE = 'bills_database.json'

def load_database():
    """Load the database from JSON file"""
    if os.path.exists(DATABASE_FILE):
        try:
            with open(DATABASE_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return {"bills": [], "lastBillNumber": 0}
    return {"bills": [], "lastBillNumber": 0}

def save_database(data):
    """Save the database to JSON file"""
    try:
        with open(DATABASE_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return True
    except IOError:
        return False

# Initialize database with existing data if available
def init_database():
    """Initialize database from existing database.json if present"""
    if not os.path.exists(DATABASE_FILE):
        # Try to load from original database.json
        if os.path.exists('database.json'):
            try:
                with open('database.json', 'r', encoding='utf-8') as f:
                    data = json.load(f)
                save_database(data)
                print(f"✅ Initialized with {len(data.get('bills', []))} existing bills")
            except:
                save_database({"bills": [], "lastBillNumber": 0})
        else:
            save_database({"bills": [], "lastBillNumber": 0})

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "ok",
        "message": "Jaga Billing API is running",
        "timestamp": datetime.now().isoformat()
    })

# Get all bills
@app.route('/api/bills', methods=['GET'])
def get_bills():
    """Get all bills from database"""
    try:
        data = load_database()
        return jsonify({
            "success": True,
            "bills": data.get("bills", []),
            "lastBillNumber": data.get("lastBillNumber", 0),
            "count": len(data.get("bills", []))
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# Save a new bill
@app.route('/api/bills', methods=['POST'])
def save_bill():
    """Save a new bill to database"""
    try:
        bill_data = request.get_json()
        
        if not bill_data:
            return jsonify({
                "success": False,
                "error": "No bill data provided"
            }), 400
        
        data = load_database()
        bills = data.get("bills", [])
        
        # Check if bill already exists
        bill_number = str(bill_data.get("billNumber", ""))
        existing_index = None
        for i, bill in enumerate(bills):
            if str(bill.get("billNumber", "")) == bill_number:
                existing_index = i
                break
        
        if existing_index is not None:
            # Update existing bill
            bills[existing_index] = bill_data
        else:
            # Add new bill at the beginning
            bills.insert(0, bill_data)
        
        # Update last bill number
        current_bill_num = int(bill_data.get("billNumber", 0))
        last_bill_num = data.get("lastBillNumber", 0)
        data["lastBillNumber"] = max(current_bill_num, last_bill_num)
        data["bills"] = bills
        
        if save_database(data):
            return jsonify({
                "success": True,
                "message": f"Bill #{bill_number} saved successfully",
                "totalBills": len(bills)
            })
        else:
            return jsonify({
                "success": False,
                "error": "Failed to save to database"
            }), 500
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# Save all bills (bulk save/sync)
@app.route('/api/bills/sync', methods=['POST'])
def sync_bills():
    """Sync all bills - replaces entire database"""
    try:
        sync_data = request.get_json()
        
        if not sync_data:
            return jsonify({
                "success": False,
                "error": "No sync data provided"
            }), 400
        
        bills = sync_data.get("bills", [])
        last_bill_number = sync_data.get("lastBillNumber", 0)
        
        data = {
            "bills": bills,
            "lastBillNumber": last_bill_number
        }
        
        if save_database(data):
            return jsonify({
                "success": True,
                "message": f"Synced {len(bills)} bills successfully",
                "totalBills": len(bills)
            })
        else:
            return jsonify({
                "success": False,
                "error": "Failed to sync database"
            }), 500
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# Delete a bill
@app.route('/api/bills/<bill_number>', methods=['DELETE'])
def delete_bill(bill_number):
    """Delete a bill by bill number"""
    try:
        data = load_database()
        bills = data.get("bills", [])
        
        # Find and remove the bill
        original_length = len(bills)
        bills = [b for b in bills if str(b.get("billNumber", "")) != str(bill_number)]
        
        if len(bills) == original_length:
            return jsonify({
                "success": False,
                "error": f"Bill #{bill_number} not found"
            }), 404
        
        data["bills"] = bills
        
        if save_database(data):
            return jsonify({
                "success": True,
                "message": f"Bill #{bill_number} deleted successfully",
                "totalBills": len(bills)
            })
        else:
            return jsonify({
                "success": False,
                "error": "Failed to save database"
            }), 500
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# Serve static files (for local development)
@app.route('/')
def index():
    """Root endpoint"""
    return jsonify({
        "name": "Jaga Billing API",
        "version": "1.0.0",
        "endpoints": {
            "GET /api/health": "Health check",
            "GET /api/bills": "Get all bills",
            "POST /api/bills": "Save a new bill",
            "POST /api/bills/sync": "Sync all bills",
            "DELETE /api/bills/<number>": "Delete a bill"
        }
    })

if __name__ == '__main__':
    init_database()
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
