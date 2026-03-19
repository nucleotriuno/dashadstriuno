import { NavLink } from 'react-router-dom';

interface Props {
  accountName: string | null;
}

const navItemStyle = (isActive: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '7px 12px',
  borderRadius: 7,
  fontFamily: 'var(--sans)',
  fontSize: 13,
  fontWeight: 500,
  color: isActive ? 'var(--text)' : 'var(--text-dim)',
  background: isActive ? 'var(--surface-alt)' : 'transparent',
  textDecoration: 'none',
  transition: 'all 0.15s',
});

export function Sidebar({ accountName }: Props) {
  return (
    <aside
      style={{
        width: 'var(--sidebar-w)',
        minWidth: 'var(--sidebar-w)',
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 12px',
        gap: 0,
        height: '100vh',
        position: 'sticky',
        top: 0,
      }}
    >
      {/* Logo / Brand */}
      <div style={{ marginBottom: 20, padding: '0 4px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 4,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              background: 'var(--accent-dim)',
              border: '1px solid var(--accent)',
              borderRadius: 7,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--mono)',
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--accent)',
            }}
          >
            B
          </div>
          <div>
            <div
              style={{
                fontFamily: 'var(--sans)',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text)',
                maxWidth: 150,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {accountName ?? '...'}
            </div>
            <div
              style={{
                fontFamily: 'var(--sans)',
                fontSize: 11,
                color: 'var(--text-muted)',
              }}
            >
              Meta Dashboard
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          borderTop: '1px solid var(--border)',
          margin: '0 -12px',
          marginBottom: 16,
        }}
      />

      {/* Nav section label */}
      <div
        style={{
          fontFamily: 'var(--sans)',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          padding: '0 12px',
          marginBottom: 6,
        }}
      >
        Relatórios
      </div>

      <NavLink to="/meta-ads" style={({ isActive }) => navItemStyle(isActive)}>
        <span style={{ fontSize: 14 }}>▶</span>
        Meta Ads
      </NavLink>

      <NavLink to="/financeiro" style={({ isActive }) => navItemStyle(isActive)}>
        <span style={{ fontSize: 14 }}>$</span>
        Financeiro
      </NavLink>

      {/* Bottom footer */}
      <div style={{ marginTop: 'auto' }}>
        <div style={{ borderTop: '1px solid var(--border)', margin: '0 -12px 12px' }} />
        <div
          style={{
            fontFamily: 'var(--sans)',
            fontSize: 10,
            color: 'var(--text-muted)',
            padding: '0 4px',
          }}
        >
          Meta Marketing API
        </div>
      </div>
    </aside>
  );
}
