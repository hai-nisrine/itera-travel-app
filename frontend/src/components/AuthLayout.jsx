export default function AuthLayout({ heroSide = 'right', heroImage, children }) {
  const hero = (
    <div className={`hero-art ${heroImage ? '' : heroSide === 'right' ? 'hero-city' : 'hero-desert'}`}>
      {heroImage && <img className="hero-photo" src={heroImage} alt="" />}
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