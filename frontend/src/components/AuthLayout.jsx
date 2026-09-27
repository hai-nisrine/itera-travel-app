export default function AuthLayout({ heroSide = 'right', children }) {
  const hero = (
    <div className={`hero-art ${heroSide === 'right' ? 'hero-city' : 'hero-desert'}`}>
      <div className="hero-caption">
        Your Adventure
        <br />
        Starts <span className="accent">Here</span>
      </div>
    </div>
  )
  const form = <div className="auth-form-wrap">{children}</div>

  return (
    <div className="auth">
      {heroSide === 'left' && hero}
      {form}
      {heroSide === 'right' && hero}
    </div>
  )
}
