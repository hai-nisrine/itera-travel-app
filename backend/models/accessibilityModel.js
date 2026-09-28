import pool from '../config/db.js';

export async function saveAccessibilityProfile({
    user_id,
    wheelchair_mobility_accessible,
    visual_assistance,
    deaf_sign_support,
    sensory_friendly,
    trained_personal_assistant,
    service_animal_support,
    medical_equipment_storage,
    additional_info
}) {
    const result = await pool.query(
        `INSERT INTO accessibility_profiles (
            user_id,
            wheelchair_mobility_accessible,
            visual_assistance,
            deaf_sign_support,
            sensory_friendly,
            trained_personal_assistant,
            service_animal_support,
            medical_equipment_storage,
            additional_info
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        ON CONFLICT (user_id)
        DO UPDATE SET
            wheelchair_mobility_accessible = EXCLUDED.wheelchair_mobility_accessible,
            visual_assistance = EXCLUDED.visual_assistance,
            deaf_sign_support = EXCLUDED.deaf_sign_support,
            sensory_friendly = EXCLUDED.sensory_friendly,
            trained_personal_assistant = EXCLUDED.trained_personal_assistant,
            service_animal_support = EXCLUDED.service_animal_support,
            medical_equipment_storage = EXCLUDED.medical_equipment_storage,
            additional_info = EXCLUDED.additional_info
        RETURNING *`,
        [
            user_id,
            wheelchair_mobility_accessible,
            visual_assistance,
            deaf_sign_support,
            sensory_friendly,
            trained_personal_assistant,
            service_animal_support,
            medical_equipment_storage,
            additional_info
        ]
    );

    return result.rows[0];
}