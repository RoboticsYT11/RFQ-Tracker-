from fastapi import APIRouter, Depends, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from app.config.database import get_db_connection
from app.routers.auth import get_current_user
import json

router = APIRouter(prefix="/dashboard", tags=["dashboard"])
templates = Jinja2Templates(directory="app/templates")

@router.get("/", response_class=HTMLResponse)
async def dashboard(request: Request, user: dict = Depends(get_current_user)):
    conn = await get_db_connection()
    try:
        # Fetch stats
        total_rfqs = await conn.fetchval("SELECT COUNT(*) FROM rfqs")
        
        # Pending Quotes (Enquiry or Under Review)
        pending_quotes = await conn.fetchval("SELECT COUNT(*) FROM rfqs WHERE status IN ('Enquiry', 'Under Review')")
        
        # Won Month
        won_month = await conn.fetchval("""
            SELECT COUNT(*) FROM rfqs 
            WHERE status = 'Won' 
            AND date_part('month', updated_at) = date_part('month', CURRENT_DATE)
            AND date_part('year', updated_at) = date_part('year', CURRENT_DATE)
        """) or 0

        # Status Data for Chart
        status_counts = await conn.fetch("""
            SELECT status, COUNT(*) as count 
            FROM rfqs 
            GROUP BY status
        """)
        
        status_labels = [row['status'] for row in status_counts]
        status_data = [row['count'] for row in status_counts]
        
        # Simple Trend Data (Last 6 months)
        # Note: optimizing query for postgres
        trend_query = """
            SELECT to_char(rfq_received_date, 'Mon') as month, COUNT(*) as count
            FROM rfqs
            WHERE rfq_received_date > current_date - interval '6 months'
            GROUP BY to_char(rfq_received_date, 'Mon'), date_trunc('month', rfq_received_date)
            ORDER BY date_trunc('month', rfq_received_date)
        """
        trend_rows = await conn.fetch(trend_query)
        trend_labels = [row['month'] for row in trend_rows]
        trend_data = [row['count'] for row in trend_rows]

        return templates.TemplateResponse("dashboard.html", {
            "request": request,
            "user": user,
            "stats": {
                "total_rfqs": total_rfqs,
                "pending_quotes": pending_quotes,
                "won_month": won_month
            },
            "charts": {
                "status_labels": status_labels,
                "status_data": status_data,
                "trend_labels": trend_labels,
                "trend_data": trend_data
            }
        })
    finally:
        await conn.close()
