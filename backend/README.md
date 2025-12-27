# Jaga Billing API

A Python Flask backend for the Jaga Billing system to sync bill history across all devices.

## Endpoints

- `GET /api/health` - Health check
- `GET /api/bills` - Get all bills
- `POST /api/bills` - Save a new bill
- `POST /api/bills/sync` - Sync all bills
- `DELETE /api/bills/<number>` - Delete a bill by number

## Deployment to Render.com

1. Push this folder to a new GitHub repository
2. Go to https://render.com and sign up/login
3. Click "New" -> "Web Service"
4. Connect your GitHub repo
5. Render will auto-detect Python and deploy

## Local Development

```bash
pip install -r requirements.txt
python app.py
```

Server runs on http://localhost:5000
