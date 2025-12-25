from fastapi import APIRouter, Depends, HTTPException, Request, Form, status
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from app.config.database import get_db_connection
from app.routers.auth import get_current_user
from typing import Optional
import json

router = APIRouter(prefix="/rfq", tags=["rfq"])
templates = Jinja2Templates(directory="app/templates")

@router.get("/", response_class=HTMLResponse)
async def list_rfqs(
    request: Request,
    page: int = 1,
    limit: int = 50,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    conn = await get_db_connection()
    try:
        offset = (page - 1) * limit
        
        # Base Query
        query = """
            SELECT 
                r.*,
                u1.full_name as assigned_engineer_name,
                u2.full_name as assigned_sales_person_name,
                u3.full_name as created_by_name,
                COUNT(q.id) as quotation_count
            FROM rfqs r
            LEFT JOIN users u1 ON r.assigned_engineer_id = u1.id
            LEFT JOIN users u2 ON r.assigned_sales_person_id = u2.id
            LEFT JOIN users u3 ON r.created_by = u3.id
            LEFT JOIN quotations q ON r.id = q.rfq_id
            WHERE 1=1
        """
        
        params = []
        param_count = 1
        
        # Role-based filtering
        if user['role'] == 'engineer':
            query += f" AND r.assigned_engineer_id = ${param_count}"
            params.append(user['id'])
            param_count += 1
        elif user['role'] == 'sales':
            query += f" AND (r.assigned_sales_person_id = ${param_count} OR r.created_by = ${param_count})"
            params.append(user['id'])
            param_count += 1
            
        # Filters
        if status:
            query += f" AND r.status = ${param_count}"
            params.append(status)
            param_count += 1
            
        if priority:
            query += f" AND r.priority = ${param_count}"
            params.append(priority)
            param_count += 1
            
        if search:
            query += f""" AND (
                r.rfq_number ILIKE ${param_count} OR
                r.customer_name ILIKE ${param_count} OR
                r.product_project_name ILIKE ${param_count} OR
                r.company_name ILIKE ${param_count}
            )"""
            params.append(f"%{search}%")
            param_count += 1
            
        query += " GROUP BY r.id, u1.full_name, u2.full_name, u3.full_name"
        query += " ORDER BY r.created_at DESC"
        query += f" LIMIT ${param_count} OFFSET ${param_count + 1}"
        params.extend([limit, offset])
        
        rfqs = await conn.fetch(query, *params)
        
        return templates.TemplateResponse("rfq/list.html", {
            "request": request, 
            "rfqs": rfqs,
            "user": user,
            "page": page,
            "status": status,
            "priority": priority,
            "search": search
        })
    finally:
        await conn.close()

@router.get("/new", response_class=HTMLResponse)
async def new_rfq_form(request: Request, user: dict = Depends(get_current_user)):
    conn = await get_db_connection()
    try:
        # Fetch engineers and sales people for dropdowns
        engineers = await conn.fetch("SELECT id, full_name FROM users WHERE role = 'engineer'")
        sales_people = await conn.fetch("SELECT id, full_name FROM users WHERE role = 'sales'")
        return templates.TemplateResponse("rfq/form.html", {
            "request": request,
            "user": user,
            "engineers": engineers,
            "sales_people": sales_people,
            "rfq": None
        })
    finally:
        await conn.close()

@router.post("/new")
async def create_rfq(
    request: Request,
    user: dict = Depends(get_current_user)
):
    form_data = await request.form()
    conn = await get_db_connection()
    try:
        # Generate RFQ Number (calling postgres function)
        rfq_num_row = await conn.fetchrow("SELECT generate_rfq_number() as rfq_number")
        rfq_number = rfq_num_row['rfq_number']
        
        # Insert Logic
        query = """
            INSERT INTO rfqs (
              rfq_number, customer_name, customer_contact_person, email, phone,
              company_name, rfq_received_date, rfq_due_date, product_project_name,
              rfq_category, rfq_source, assigned_engineer_id, assigned_sales_person_id,
              priority, estimated_project_value, currency, expected_order_date,
              status, remarks_notes, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
            RETURNING id
        """
        
        # Prepare values (handling None/Empty)
        values = [
            rfq_number,
            form_data.get('customer_name'),
            form_data.get('customer_contact_person'),
            form_data.get('email'),
            form_data.get('phone'),
            form_data.get('company_name'),
            datetime.strptime(form_data.get('rfq_received_date'), '%Y-%m-%d') if form_data.get('rfq_received_date') else None,
            datetime.strptime(form_data.get('rfq_due_date'), '%Y-%m-%d') if form_data.get('rfq_due_date') else None,
            form_data.get('product_project_name'),
            form_data.get('rfq_category'),
            form_data.get('rfq_source'),
            int(form_data.get('assigned_engineer_id')) if form_data.get('assigned_engineer_id') else None,
            int(form_data.get('assigned_sales_person_id')) if form_data.get('assigned_sales_person_id') else (user['id'] if user['role'] == 'sales' else None),
            form_data.get('priority', 'Medium'),
            float(form_data.get('estimated_project_value')) if form_data.get('estimated_project_value') else None,
            form_data.get('currency', 'INR'),
            datetime.strptime(form_data.get('expected_order_date'), '%Y-%m-%d') if form_data.get('expected_order_date') else None,
            'Enquiry', # Default Status
            form_data.get('remarks_notes'),
            user['id']
        ]
        
        result = await conn.fetchrow(query, *values)
        
        # Audit Log
        await conn.execute(
            "INSERT INTO status_audit_log (rfq_id, old_status, new_status, changed_by) VALUES ($1, NULL, $2, $3)",
            result['id'], 'Enquiry', user['id']
        )
        
        return RedirectResponse(url="/rfq", status_code=status.HTTP_303_SEE_OTHER)
        
    except Exception as e:
        # In production, show clean error page
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await conn.close()
from datetime import datetime
