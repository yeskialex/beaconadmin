-- Create community_notices table
CREATE TABLE IF NOT EXISTS community_notices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    is_urgent BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by_admin_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_community_notices_community_id ON community_notices(community_id);
CREATE INDEX idx_community_notices_created_at ON community_notices(created_at DESC);
CREATE INDEX idx_community_notices_expires_at ON community_notices(expires_at) WHERE expires_at IS NOT NULL;

-- Enable RLS
ALTER TABLE community_notices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admin users can view notices" ON community_notices
    FOR SELECT USING (true);

CREATE POLICY "Admin users can create notices" ON community_notices
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin users can update notices" ON community_notices
    FOR UPDATE USING (true);

CREATE POLICY "Admin users can delete notices" ON community_notices
    FOR DELETE USING (true);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at trigger
CREATE TRIGGER update_community_notices_updated_at
    BEFORE UPDATE ON community_notices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();