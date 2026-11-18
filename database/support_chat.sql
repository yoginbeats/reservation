-- Optional Supabase tables for Superlines Customer Service & Feedback Chat
-- If not executed, the app automatically persists threads in data/support-messages.json

CREATE TABLE IF NOT EXISTS support_threads (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    category TEXT NOT NULL DEFAULT 'Customer Service',
    subject TEXT,
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'REPLIED', 'RESOLVED')),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    unread_by_admin BOOLEAN NOT NULL DEFAULT TRUE,
    unread_by_customer BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS support_messages (
    id TEXT PRIMARY KEY,
    thread_id TEXT NOT NULL REFERENCES support_threads(id) ON DELETE CASCADE,
    sender_role TEXT NOT NULL CHECK (sender_role IN ('CUSTOMER', 'ADMIN')),
    sender_name TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_threads_session_id ON support_threads(session_id);
CREATE INDEX IF NOT EXISTS idx_support_threads_updated_at ON support_threads(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_messages_thread_id ON support_messages(thread_id, created_at ASC);
