import { saveAccessibilityProfile } from '../models/accessibilityModel.js';

export async function saveProfile(req, res) {
    try {
        const user_id = req.userId;

        const {
            wheelchair_mobility_accessible = false,
            visual_assistance = false,
            deaf_sign_support = false,
            sensory_friendly = false,
            trained_personal_assistant = false,
            service_animal_support = false,
            medical_equipment_storage = false,
            additional_info = null
        } = req.body;

        const profile = await saveAccessibilityProfile({
            user_id,
            wheelchair_mobility_accessible,
            visual_assistance,
            deaf_sign_support,
            sensory_friendly,
            trained_personal_assistant,
            service_animal_support,
            medical_equipment_storage,
            additional_info
        });

        res.status(200).json({ profile });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: 'Something went wrong while saving the accessibility profile.'
        });
    }
}