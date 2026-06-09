CREATE TABLE IF NOT EXISTS user_permissions (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    resource_path VARCHAR(255),
    grants TEXT[],
    denies TEXT[]
);