import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { 
  Hierarchy, 
  UserAdd, 
  ExportCurve, 
  Share, 
  Personalcard, 
  FolderCloud, 
  ArrowRight, 
  SecurityCard, 
  Global, 
  Heart,
  Diagram
} from 'iconsax-react'

export default function Landing() {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', color: '#0A1628', fontFamily: "'Inter', sans-serif" }}>
      {/* Top Navbar */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100, backgroundColor: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(16px)', borderBottom: '1px solid #E2E8F0', padding: '0 32px', height: 72,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <div style={{
            width: 42, height: 42, borderRadius: 12, backgroundColor: '#E0F9FA',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
            boxShadow: '0 4px 14px rgba(6, 200, 213, 0.2)', border: '1px solid #BCEEFE'
          }}>
            🌳
          </div>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 900, fontSize: 22, color: '#0A1628', letterSpacing: '-0.02em' }}>
            KinTree
          </span>
        </div>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <a href="#features" style={{ color: '#475569', fontWeight: 600, fontSize: 14, textDecoration: 'none', transition: 'color 0.2s' }}>Features</a>
          <a href="#how-it-works" style={{ color: '#475569', fontWeight: 600, fontSize: 14, textDecoration: 'none', transition: 'color 0.2s' }}>How it Works</a>
          <a href="#export-share" style={{ color: '#475569', fontWeight: 600, fontSize: 14, textDecoration: 'none', transition: 'color 0.2s' }}>Share & Export</a>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {user ? (
            <Link to="/" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px', borderRadius: 999,
              backgroundColor: '#06C8D5', color: '#ffffff', fontWeight: 700, fontSize: 14,
              textDecoration: 'none', boxShadow: '0 4px 14px rgba(6, 200, 213, 0.35)', transition: 'transform 0.2s'
            }}>
              Go to Dashboard <ArrowRight size={16} />
            </Link>
          ) : (
            <>
              <Link to="/login" style={{
                color: '#0A1628', fontWeight: 700, fontSize: 14, textDecoration: 'none', padding: '10px 18px'
              }}>
                Sign In
              </Link>
              <Link to="/login" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px', borderRadius: 999,
                backgroundColor: '#0A1628', color: '#ffffff', fontWeight: 700, fontSize: 14,
                textDecoration: 'none', boxShadow: '0 4px 14px rgba(10, 22, 40, 0.2)'
              }}>
                Get Started Free <ArrowRight size={16} color="#06C8D5" />
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ padding: '80px 24px 60px', maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 999,
          backgroundColor: '#E0F9FA', color: '#0891B2', fontWeight: 700, fontSize: 13, marginBottom: 24,
          border: '1px solid #BCEEFE'
        }}>
          <span>🌳 Modern Family Tree Builder</span>
          <span style={{ color: '#06C8D5' }}>•</span>
          <span>Automatic Layout Engine</span>
        </div>

        <h1 style={{
          fontFamily: "'DM Sans', sans-serif", fontWeight: 900, fontSize: 'clamp(40px, 6vw, 64px)',
          lineHeight: 1.1, color: '#0A1628', letterSpacing: '-0.03em', maxWidth: 900, margin: '0 auto 24px'
        }}>
          Preserve Your Family Legacy with Interactive Visual Lineage
        </h1>

        <p style={{
          fontSize: 'clamp(16px, 2vw, 20px)', color: '#475569', lineHeight: 1.6, maxWidth: 720,
          margin: '0 auto 36px', fontWeight: 400
        }}>
          Build, explore, and share detailed multi-generational family trees. Feature-packed with automatic Dagre layout positioning, tribe metadata, rich personal profiles, and instant share links.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 60 }}>
          <Link to={user ? '/' : '/login'} style={{
            display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 36px', borderRadius: 999,
            backgroundColor: '#06C8D5', color: '#ffffff', fontWeight: 800, fontSize: 16,
            textDecoration: 'none', boxShadow: '0 8px 24px rgba(6, 200, 213, 0.4)', transition: 'transform 0.2s'
          }}>
            {user ? 'Open Dashboard' : 'Build Your Tree Free'} <ArrowRight size={20} />
          </Link>
          <a href="#features" style={{
            display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 32px', borderRadius: 999,
            backgroundColor: '#ffffff', color: '#0A1628', fontWeight: 700, fontSize: 16,
            textDecoration: 'none', border: '1px solid #CBD5E1', boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>
            Explore Features
          </a>
        </div>

        {/* Hero Screenshot / Mockup */}
        <div style={{
          position: 'relative', borderRadius: 24, overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(10, 22, 40, 0.25)', border: '4px solid #ffffff',
          backgroundColor: '#ffffff'
        }}>
          <img 
            src="/hero_mockup.jpg" 
            alt="KinTree Interactive Canvas Preview" 
            style={{ width: '100%', height: 'auto', display: 'block', maxHeight: 640, objectFit: 'cover' }}
          />
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 120,
            background: 'linear-gradient(to top, rgba(248, 250, 252, 1), rgba(248, 250, 252, 0))'
          }} />
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section id="features" style={{ padding: '80px 24px', backgroundColor: '#ffffff', borderTop: '1px solid #E2E8F0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 900, fontSize: 36, color: '#0A1628', marginBottom: 16 }}>
              Everything You Need to Map Family History
            </h2>
            <p style={{ fontSize: 18, color: '#64748B', maxWidth: 640, margin: '0 auto' }}>
              Built with cutting-edge graph layout algorithms and intuitive profile drawers so every relationship is easy to visualize.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 32 }}>
            {/* Feature 1 */}
            <div style={{
              backgroundColor: '#F8FAFC', padding: 32, borderRadius: 20, border: '1px solid #E2E8F0',
              transition: 'transform 0.3s ease, boxShadow 0.3s ease'
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14, backgroundColor: '#E0F9FA',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20
              }}>
                <Diagram size={28} color="#06C8D5" variant="Bold" />
              </div>
              <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 800, fontSize: 20, color: '#0A1628', marginBottom: 10 }}>
                Smart Auto-Layout Algorithm
              </h3>
              <p style={{ color: '#64748B', fontSize: 15, lineHeight: 1.6, margin: 0 }}>
                Powered by Dagre graph positioning for clean, automatic multi-generational rows with seamless parent, child, spouse, and sibling connections.
              </p>
            </div>

            {/* Feature 2 */}
            <div style={{
              backgroundColor: '#F8FAFC', padding: 32, borderRadius: 20, border: '1px solid #E2E8F0',
              transition: 'transform 0.3s ease, boxShadow 0.3s ease'
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14, backgroundColor: '#FEF3C7',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20
              }}>
                <Personalcard size={28} color="#D97706" variant="Bold" />
              </div>
              <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 800, fontSize: 20, color: '#0A1628', marginBottom: 10 }}>
                Rich Personal Profiles & Badges
              </h3>
              <p style={{ color: '#64748B', fontSize: 15, lineHeight: 1.6, margin: 0 }}>
                Store detailed biography, Maiden names, Occupation/Title, Location, Tribe, Birth & Death dates, and custom avatars for every family member.
              </p>
            </div>

            {/* Feature 3 */}
            <div style={{
              backgroundColor: '#F8FAFC', padding: 32, borderRadius: 20, border: '1px solid #E2E8F0',
              transition: 'transform 0.3s ease, boxShadow 0.3s ease'
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14, backgroundColor: '#ECFDF5',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20
              }}>
                <Share size={28} color="#10B981" variant="Bold" />
              </div>
              <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 800, fontSize: 20, color: '#0A1628', marginBottom: 10 }}>
                Instant Public Share Links
              </h3>
              <p style={{ color: '#64748B', fontSize: 15, lineHeight: 1.6, margin: 0 }}>
                Share your interactive family tree with relatives anywhere in the world using read-only share links — complete with search and profile drawers.
              </p>
            </div>

            {/* Feature 4 */}
            <div style={{
              backgroundColor: '#F8FAFC', padding: 32, borderRadius: 20, border: '1px solid #E2E8F0',
              transition: 'transform 0.3s ease, boxShadow 0.3s ease'
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14, backgroundColor: '#EEF2FF',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20
              }}>
                <ExportCurve size={28} color="#6366F1" variant="Bold" />
              </div>
              <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 800, fontSize: 20, color: '#0A1628', marginBottom: 10 }}>
                GEDCOM & JSON Export/Import
              </h3>
              <p style={{ color: '#64748B', fontSize: 15, lineHeight: 1.6, margin: 0 }}>
                Full data portability! Export your trees to standard GEDCOM or JSON backups, or import existing files with instant custom tree naming popups.
              </p>
            </div>

            {/* Feature 5 */}
            <div style={{
              backgroundColor: '#F8FAFC', padding: 32, borderRadius: 20, border: '1px solid #E2E8F0',
              transition: 'transform 0.3s ease, boxShadow 0.3s ease'
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14, backgroundColor: '#FDF2F8',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20
              }}>
                <UserAdd size={28} color="#DB2777" variant="Bold" />
              </div>
              <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 800, fontSize: 20, color: '#0A1628', marginBottom: 10 }}>
                Single-Click Relative Linking
              </h3>
              <p style={{ color: '#64748B', fontSize: 15, lineHeight: 1.6, margin: 0 }}>
                Add parents, children, spouses, or siblings directly from any node card with intuitive connection handles and modal dialogs.
              </p>
            </div>

            {/* Feature 6 */}
            <div style={{
              backgroundColor: '#F8FAFC', padding: 32, borderRadius: 20, border: '1px solid #E2E8F0',
              transition: 'transform 0.3s ease, boxShadow 0.3s ease'
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14, backgroundColor: '#FFF7ED',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20
              }}>
                <SecurityCard size={28} color="#EA580C" variant="Bold" />
              </div>
              <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 800, fontSize: 20, color: '#0A1628', marginBottom: 10 }}>
                Secure Cloud Storage
              </h3>
              <p style={{ color: '#64748B', fontSize: 15, lineHeight: 1.6, margin: 0 }}>
                Your data is safely synced to Row-Level-Secured database infrastructure with photo upload support and real-time canvas updates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" style={{ padding: '80px 24px', backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 900, fontSize: 36, color: '#0A1628', marginBottom: 16 }}>
              How KinTree Works in 3 Simple Steps
            </h2>
            <p style={{ fontSize: 18, color: '#64748B', maxWidth: 600, margin: '0 auto' }}>
              Building your family tree has never been easier or more visual.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 40, textAlign: 'left' }}>
            <div style={{ backgroundColor: '#ffffff', padding: 32, borderRadius: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #E2E8F0' }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 900, fontSize: 44, color: '#06C8D5', marginBottom: 16 }}>01</div>
              <h4 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 800, fontSize: 20, color: '#0A1628', marginBottom: 12 }}>
                Create or Import Tree
              </h4>
              <p style={{ color: '#64748B', fontSize: 15, lineHeight: 1.6, margin: 0 }}>
                Start a fresh tree with your custom family name or import an existing GEDCOM / JSON file with automatic name detection.
              </p>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: 32, borderRadius: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #E2E8F0' }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 900, fontSize: 44, color: '#06C8D5', marginBottom: 16 }}>02</div>
              <h4 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 800, fontSize: 20, color: '#0A1628', marginBottom: 12 }}>
                Connect Relatives & Metadata
              </h4>
              <p style={{ color: '#64748B', fontSize: 15, lineHeight: 1.6, margin: 0 }}>
                Add members, attach photos, fill in occupations, locations, and tribe badges. Let Dagre auto-layout organize your tree structure.
              </p>
            </div>

            <div style={{ backgroundColor: '#ffffff', padding: 32, borderRadius: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.04)', border: '1px solid #E2E8F0' }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 900, fontSize: 44, color: '#06C8D5', marginBottom: 16 }}>03</div>
              <h4 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 800, fontSize: 20, color: '#0A1628', marginBottom: 12 }}>
                Share & Export Lineage
              </h4>
              <p style={{ color: '#64748B', fontSize: 15, lineHeight: 1.6, margin: 0 }}>
                Generate read-only share links for family members or export full offline backups in seconds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Banner */}
      <section id="export-share" style={{ padding: '80px 24px', backgroundColor: '#0A1628', color: '#ffffff', textAlign: 'center' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>🌳</div>
          <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 900, fontSize: 38, marginBottom: 20, letterSpacing: '-0.02em' }}>
            Start Mapping Your Family Tree Today
          </h2>
          <p style={{ fontSize: 18, color: '#94A3B8', marginBottom: 36, lineHeight: 1.6 }}>
            Free, fast, and interactive. Document your roots and pass down your lineage for generations to come.
          </p>
          <Link to={user ? '/' : '/login'} style={{
            display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 40px', borderRadius: 999,
            backgroundColor: '#06C8D5', color: '#ffffff', fontWeight: 800, fontSize: 16,
            textDecoration: 'none', boxShadow: '0 8px 24px rgba(6, 200, 213, 0.35)'
          }}>
            {user ? 'Go to Your Dashboard' : 'Get Started Now'} <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#070F1C', borderTop: '1px solid #1E293B', padding: '32px 24px',
        color: '#64748B', fontSize: 14, textAlign: 'center'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>🌳</span>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 800, color: '#ffffff' }}>KinTree</span>
            <span>© {new Date().getFullYear()} KinTree App. All rights reserved.</span>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            <a href="#features" style={{ color: '#94A3B8', textDecoration: 'none' }}>Features</a>
            <a href="#how-it-works" style={{ color: '#94A3B8', textDecoration: 'none' }}>How it Works</a>
            <Link to="/login" style={{ color: '#06C8D5', textDecoration: 'none', fontWeight: 600 }}>Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
