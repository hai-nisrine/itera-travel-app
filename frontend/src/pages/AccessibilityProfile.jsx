import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageShell from '../components/PageShell.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export const OPTIONS = [
  { id: 'wheelchair', label: 'Wheelchair / Mobility accessible', desc: 'Ramps, step-free rooms, adapted vehicles' },
  { id: 'visual', label: 'Visual assistance / Audio guides', desc: 'Sighted guides, tactile & audio content' },
  { id: 'hearing', label: 'Deaf / Hard of hearing / Sign support', desc: 'Sign interpreters, captioned briefings' },
  { id: 'sensory', label: 'Neurodivergent / Sensory-friendly', desc: 'Quiet spaces, predictable pacing' },
  { id: 'helper', label: 'Trained personal helpers', desc: '1:1 or shared trained assistants' },
  { id: 'serviceAnimal', label:'Service Animal Support', desc:'Support and accommodation for trained service animals'},
  { id: 'medicalEquipment', label:'Medical Equipment & Storage', desc: 'Storage, charging, and refrigeration for medical equipment'}

]

export default function AccessibilityProfile() {
  const { user, saveProfile, loading } = useAuth()
  const navigate = useNavigate()
  const initial = user?.profile
  const [selected, setSelected] = useState(initial ? initial.selected : [])
  const [notes, setNotes] = useState(initial ? initial.notes : '')

  function toggle(id) {
    setSelected((sel) => (sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]))
  }

  async function handleSave() {
  const profile = {
    wheelchair_mobility_accessible: selected.includes('wheelchair'),
    visual_assistance: selected.includes('visual'),
    deaf_sign_support: selected.includes('hearing'),
    sensory_friendly: selected.includes('sensory'),
    trained_personal_assistant: selected.includes('helper'),
    service_animal_support: selected.includes('serviceAnimal'),
    medical_equipment_storage: selected.includes('medicalEquipment'),
    additional_info: notes
  }

  const res = await saveProfile(profile)

  if (res.ok) navigate('/dashboard')
}

  return (
    <PageShell>
      <div className="a11y-banner">
        <div className="inner">
          <h1>Set up your accessibility profile</h1>
          <p>Tell us what you need to travel comfortably. We'll use it to rank every trip you see.</p>
        </div>
      </div>

      <div className="a11y-body">
        <div className="card">
          <legend className="card-legend">Accommodation &amp; accessibility needs</legend>
          <p className="sub">Select all that apply. Only shared with organizers when you book.</p>

          {OPTIONS.map((opt) => (
            <div
              key={opt.id}
              className={'option' + (selected.includes(opt.id) ? ' checked' : '')}
              onClick={() => toggle(opt.id)}
            >
              <div className="checkbox">
                <svg viewBox="0 0 20 20">
                  <path d="M4 10l4 4 8-8" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <div className="label">{opt.label}</div>
                <div className="desc">{opt.desc}</div>
              </div>
            </div>
          ))}

          <div className="field" style={{ marginTop: 20 }}>
            <label>Additional info or notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Need step-free van transfers and ground-floor room with roll-in shower"
            />
          </div>

          <button className="save-btn" disabled={loading} onClick={handleSave}>
            {loading ? 'Saving…' : <>Save &amp; Explore Trips <span aria-hidden="true">→</span></>}
          </button>
        </div>

        <div className="brand-footer">
          <div className="wordmark">itera</div>
          <p>Itera: Find. Join. Explore. Accessible group travel across Morocco.</p>
          <p>Interactive prototype — all trips and data are simulated.</p>
        </div>
      </div>
    </PageShell>
  )
}
