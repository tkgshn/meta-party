-- Play Token Airdrop Database Schema
-- Twitter OAuth Authentication & Token Distribution System

-- Users table for Twitter OAuth authentication and claim tracking
CREATE TABLE IF NOT EXISTS users (
    -- Primary key: Twitter user ID (sub claim from JWT)
    twitter_id TEXT PRIMARY KEY,
    
    -- Wallet information
    wallet_address TEXT UNIQUE NOT NULL,
    
    -- Twitter profile information (optional, for analytics)
    twitter_username TEXT,
    twitter_display_name TEXT,
    twitter_profile_image_url TEXT,
    
    -- Claim status tracking
    claimed_base BOOLEAN DEFAULT FALSE,
    claimed_bonus BOOLEAN DEFAULT FALSE,
    
    -- Volunteer status and whitelist management
    is_volunteer BOOLEAN DEFAULT FALSE,
    is_market_creator BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Optional: Email for notifications (if provided)
    email TEXT,
    
    -- Optional: Additional metadata as JSON
    metadata JSONB DEFAULT '{}',
    
    -- Constraints
    CONSTRAINT valid_wallet_address CHECK (wallet_address ~ '^0x[0-9a-fA-F]{40}$'),
    CONSTRAINT valid_twitter_id CHECK (length(twitter_id) > 0)
);

-- Distribution transactions table for audit trail
CREATE TABLE IF NOT EXISTS distribution_transactions (
    id SERIAL PRIMARY KEY,
    
    -- User reference
    twitter_id TEXT NOT NULL REFERENCES users(twitter_id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    
    -- Transaction details
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('base_airdrop', 'volunteer_bonus', 'custom')),
    amount_pt BIGINT NOT NULL CHECK (amount_pt > 0), -- Amount in wei (18 decimals)
    reason TEXT,
    
    -- Blockchain transaction info
    tx_hash TEXT,
    block_number BIGINT,
    gas_used BIGINT,
    
    -- Status tracking
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Additional metadata
    metadata JSONB DEFAULT '{}'
);

-- Market creators whitelist table (separate from users for flexibility)
CREATE TABLE IF NOT EXISTS market_creators (
    id SERIAL PRIMARY KEY,
    
    -- User reference
    twitter_id TEXT NOT NULL REFERENCES users(twitter_id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    
    -- Creator metadata
    creator_name TEXT,
    organization TEXT,
    bio TEXT,
    
    -- Permissions
    can_create_markets BOOLEAN DEFAULT TRUE,
    can_resolve_markets BOOLEAN DEFAULT TRUE,
    max_markets_per_month INTEGER DEFAULT 10,
    
    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'revoked')),
    
    -- Approval process
    approved_by TEXT, -- Admin who approved
    approved_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(twitter_id)
);

-- OAuth state table for security (CSRF protection)
CREATE TABLE IF NOT EXISTS oauth_states (
    state_token TEXT PRIMARY KEY,
    
    -- Session info
    session_id TEXT,
    ip_address INET,
    user_agent TEXT,
    
    -- Linking info (for existing wallet linking)
    linking_wallet_address TEXT,
    
    -- Expiration (states should expire quickly)
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure states don't live too long
    CONSTRAINT valid_expiration CHECK (expires_at > created_at)
);

-- Claim attempts table for rate limiting and security
CREATE TABLE IF NOT EXISTS claim_attempts (
    id SERIAL PRIMARY KEY,
    
    -- User identification
    twitter_id TEXT,
    wallet_address TEXT,
    ip_address INET NOT NULL,
    
    -- Attempt details
    attempt_type TEXT NOT NULL CHECK (attempt_type IN ('base_airdrop', 'volunteer_bonus')),
    success BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_agent TEXT,
    
    -- Index for rate limiting queries
    INDEX idx_claim_attempts_ip_time (ip_address, created_at),
    INDEX idx_claim_attempts_twitter_time (twitter_id, created_at),
    INDEX idx_claim_attempts_wallet_time (wallet_address, created_at)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_volunteer_status ON users(is_volunteer) WHERE is_volunteer = TRUE;
CREATE INDEX IF NOT EXISTS idx_users_market_creator_status ON users(is_market_creator) WHERE is_market_creator = TRUE;

CREATE INDEX IF NOT EXISTS idx_distribution_transactions_twitter_id ON distribution_transactions(twitter_id);
CREATE INDEX IF NOT EXISTS idx_distribution_transactions_wallet ON distribution_transactions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_distribution_transactions_type ON distribution_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_distribution_transactions_status ON distribution_transactions(status);
CREATE INDEX IF NOT EXISTS idx_distribution_transactions_created_at ON distribution_transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_market_creators_wallet ON market_creators(wallet_address);
CREATE INDEX IF NOT EXISTS idx_market_creators_status ON market_creators(status);

CREATE INDEX IF NOT EXISTS idx_oauth_states_expires_at ON oauth_states(expires_at);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_distribution_transactions_updated_at ON distribution_transactions;
CREATE TRIGGER update_distribution_transactions_updated_at
    BEFORE UPDATE ON distribution_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_market_creators_updated_at ON market_creators;
CREATE TRIGGER update_market_creators_updated_at
    BEFORE UPDATE ON market_creators
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Clean up expired OAuth states (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_states()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM oauth_states WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Sample data insertion functions for testing
CREATE OR REPLACE FUNCTION create_test_user(
    p_twitter_id TEXT,
    p_wallet_address TEXT,
    p_is_volunteer BOOLEAN DEFAULT FALSE
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO users (
        twitter_id,
        wallet_address,
        twitter_username,
        twitter_display_name,
        is_volunteer,
        metadata
    ) VALUES (
        p_twitter_id,
        p_wallet_address,
        'test_' || p_twitter_id,
        'Test User ' || p_twitter_id,
        p_is_volunteer,
        jsonb_build_object(
            'test_user', true,
            'created_by', 'create_test_user_function'
        )
    )
    ON CONFLICT (twitter_id) DO UPDATE SET
        wallet_address = EXCLUDED.wallet_address,
        is_volunteer = EXCLUDED.is_volunteer,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Security: Row Level Security (RLS) policies
-- Note: Enable RLS when implementing multi-tenancy or additional security

-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE distribution_transactions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE market_creators ENABLE ROW LEVEL SECURITY;

-- Example policy (uncomment when needed):
-- CREATE POLICY user_access_own_data ON users
--     FOR ALL
--     TO authenticated_users
--     USING (twitter_id = current_setting('app.current_twitter_id', true));

-- Views for common queries
CREATE OR REPLACE VIEW user_claim_status AS
SELECT 
    u.twitter_id,
    u.wallet_address,
    u.twitter_username,
    u.claimed_base,
    u.claimed_bonus,
    u.is_volunteer,
    u.is_market_creator,
    u.created_at,
    CASE 
        WHEN u.claimed_base AND u.claimed_bonus THEN 'fully_claimed'
        WHEN u.claimed_base THEN 'base_claimed'
        ELSE 'unclaimed'
    END as claim_status,
    COALESCE(
        SUM(dt.amount_pt) FILTER (WHERE dt.status = 'confirmed'),
        0
    ) as total_pt_received
FROM users u
LEFT JOIN distribution_transactions dt ON u.twitter_id = dt.twitter_id
GROUP BY u.twitter_id, u.wallet_address, u.twitter_username, 
         u.claimed_base, u.claimed_bonus, u.is_volunteer, 
         u.is_market_creator, u.created_at;

-- Analytics view
CREATE OR REPLACE VIEW airdrop_analytics AS
SELECT 
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE claimed_base = true) as base_claimed_count,
    COUNT(*) FILTER (WHERE claimed_bonus = true) as bonus_claimed_count,
    COUNT(*) FILTER (WHERE is_volunteer = true) as volunteer_count,
    COUNT(*) FILTER (WHERE is_market_creator = true) as market_creator_count,
    COALESCE(SUM(dt.amount_pt) FILTER (WHERE dt.status = 'confirmed'), 0) as total_pt_distributed,
    AVG(EXTRACT(EPOCH FROM (NOW() - u.created_at))/3600)::INTEGER as avg_hours_since_signup
FROM users u
LEFT JOIN distribution_transactions dt ON u.twitter_id = dt.twitter_id;

-- Grant permissions (adjust as needed for your application user)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO app_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO app_user;

-- Example usage and testing queries:
/*
-- Insert test users
SELECT create_test_user('twitter_user_1', '0x1234567890123456789012345678901234567890', false);
SELECT create_test_user('twitter_user_2', '0x2345678901234567890123456789012345678901', true);

-- Check claim status
SELECT * FROM user_claim_status;

-- Check analytics
SELECT * FROM airdrop_analytics;

-- Record a distribution transaction
INSERT INTO distribution_transactions (
    twitter_id, wallet_address, transaction_type, amount_pt, reason, tx_hash, status
) VALUES (
    'twitter_user_1', '0x1234567890123456789012345678901234567890', 
    'base_airdrop', 1000000000000000000000, 'Base airdrop claim', 
    '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890', 'confirmed'
);

-- Update user claim status
UPDATE users SET claimed_base = true WHERE twitter_id = 'twitter_user_1';

-- Clean up expired OAuth states
SELECT cleanup_expired_oauth_states();
*/