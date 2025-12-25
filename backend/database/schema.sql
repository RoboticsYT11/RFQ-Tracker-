-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'sales', 'engineer', 'management')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RFQ Master table
CREATE TABLE IF NOT EXISTS rfqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rfq_number VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    company_name VARCHAR(255),
    rfq_received_date DATE NOT NULL,
    rfq_due_date DATE,
    product_project_name VARCHAR(500),
    rfq_category VARCHAR(50) CHECK (rfq_category IN ('Automation', 'Vision', 'Robotics', 'Electrical', 'Mechanical', 'Software', 'Other')),
    rfq_source VARCHAR(50) CHECK (rfq_source IN ('Email', 'Phone', 'Portal', 'Reference', 'Sales Team')),
    assigned_engineer_id UUID REFERENCES users(id),
    assigned_sales_person_id UUID REFERENCES users(id),
    priority VARCHAR(20) CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')) DEFAULT 'Medium',
    estimated_project_value DECIMAL(15, 2),
    currency VARCHAR(10) DEFAULT 'INR',
    expected_order_date DATE,
    status VARCHAR(50) CHECK (status IN ('Enquiry', 'Under Review', 'Quotation Sent', 'Negotiation', 'Won', 'Lost', 'On Hold')) DEFAULT 'Enquiry',
    reason_for_lost_on_hold TEXT,
    remarks_notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quotations table
CREATE TABLE IF NOT EXISTS quotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rfq_id UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
    quotation_number VARCHAR(50) UNIQUE NOT NULL,
    quotation_sent_date DATE NOT NULL,
    revision_number INTEGER DEFAULT 1,
    quoted_amount DECIMAL(15, 2) NOT NULL,
    material_cost DECIMAL(15, 2),
    engineering_cost DECIMAL(15, 2),
    software_cost DECIMAL(15, 2),
    installation_cost DECIMAL(15, 2),
    margin DECIMAL(15, 2),
    validity_date DATE,
    approval_status VARCHAR(50) CHECK (approval_status IN ('Pending', 'Approved', 'Rejected')) DEFAULT 'Pending',
    final_approved_amount DECIMAL(15, 2),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quotation documents table
CREATE TABLE IF NOT EXISTS quotation_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50),
    file_size INTEGER,
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Status change audit log
CREATE TABLE IF NOT EXISTS status_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rfq_id UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by UUID REFERENCES users(id),
    change_reason TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rfq_id UUID REFERENCES rfqs(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rfqs_status ON rfqs(status);
CREATE INDEX IF NOT EXISTS idx_rfqs_category ON rfqs(rfq_category);
CREATE INDEX IF NOT EXISTS idx_rfqs_assigned_engineer ON rfqs(assigned_engineer_id);
CREATE INDEX IF NOT EXISTS idx_rfqs_assigned_sales ON rfqs(assigned_sales_person_id);
CREATE INDEX IF NOT EXISTS idx_rfqs_rfq_number ON rfqs(rfq_number);
CREATE INDEX IF NOT EXISTS idx_rfqs_customer_name ON rfqs(customer_name);
CREATE INDEX IF NOT EXISTS idx_rfqs_received_date ON rfqs(rfq_received_date);
CREATE INDEX IF NOT EXISTS idx_rfqs_due_date ON rfqs(rfq_due_date);
CREATE INDEX IF NOT EXISTS idx_quotations_rfq_id ON quotations(rfq_id);
CREATE INDEX IF NOT EXISTS idx_quotations_number ON quotations(quotation_number);
CREATE INDEX IF NOT EXISTS idx_status_audit_rfq_id ON status_audit_log(rfq_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rfqs_updated_at BEFORE UPDATE ON rfqs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotations_updated_at BEFORE UPDATE ON quotations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate RFQ number
CREATE OR REPLACE FUNCTION generate_rfq_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    year_part TEXT;
    seq_num INTEGER;
BEGIN
    year_part := TO_CHAR(CURRENT_DATE, 'YYYY');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(rfq_number FROM 'RFQ-' || year_part || '-([0-9]+)') AS INTEGER)), 0) + 1
    INTO seq_num
    FROM rfqs
    WHERE rfq_number LIKE 'RFQ-' || year_part || '-%';
    
    new_number := 'RFQ-' || year_part || '-' || LPAD(seq_num::TEXT, 5, '0');
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to generate Quotation number
CREATE OR REPLACE FUNCTION generate_quotation_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    year_part TEXT;
    seq_num INTEGER;
BEGIN
    year_part := TO_CHAR(CURRENT_DATE, 'YYYY');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(quotation_number FROM 'QUO-' || year_part || '-([0-9]+)') AS INTEGER)), 0) + 1
    INTO seq_num
    FROM quotations
    WHERE quotation_number LIKE 'QUO-' || year_part || '-%';
    
    new_number := 'QUO-' || year_part || '-' || LPAD(seq_num::TEXT, 5, '0');
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;