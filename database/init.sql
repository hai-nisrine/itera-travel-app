CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(30),
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE accessibility_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL,

    wheelchair_mobility_accessible BOOLEAN DEFAULT FALSE,
    visual_assistance BOOLEAN DEFAULT FALSE,
    deaf_sign_support BOOLEAN DEFAULT FALSE,
    sensory_friendly BOOLEAN DEFAULT FALSE,
    trained_personal_assistant BOOLEAN DEFAULT FALSE,
    service_animal_support BOOLEAN DEFAULT FALSE,
    medical_equipment_storage BOOLEAN DEFAULT FALSE,

    additional_info TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);