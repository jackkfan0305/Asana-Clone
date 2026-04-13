import { useState } from 'react';
import { currentUserId, users, organization, teams, teamMembers } from '../../../data/seed';
import { Avatar } from '../../common/Avatar';

type Tab = 'profile' | 'account' | 'notifications' | 'display' | 'apps';

const tabs: { key: Tab; label: string }[] = [
  { key: 'profile', label: 'Profile' },
  { key: 'account', label: 'Account' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'display', label: 'Display' },
  { key: 'apps', label: 'Apps' },
];

export function SettingsPage() {
  const [tab, setTab] = useState<Tab>('profile');
  const currentUser = users.find(u => u.id === currentUserId)!;
  const userTeams = teamMembers
    .filter(tm => tm.userId === currentUserId)
    .map(tm => teams.find(t => t.id === tm.teamId)!)
    .filter(Boolean);

  return (
    <div style={{ padding: '24px 32px', maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 20 }}>
        Settings
      </h1>

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 0, borderBottom: '1px solid var(--border-divider)', marginBottom: 24,
      }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: tab === t.key ? 500 : 400,
              color: tab === t.key ? 'var(--text-primary)' : 'var(--text-secondary)',
              borderBottom: tab === t.key ? '2px solid var(--color-accent)' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{
        fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 16,
        background: 'var(--bg-surface-overlay)', borderRadius: 'var(--radius-card)', padding: '8px 12px',
      }}>
        Settings changes are not persisted in this demo.
      </div>

      {tab === 'profile' && <ProfileSettings user={currentUser} userTeams={userTeams} />}
      {tab === 'account' && <AccountSettings user={currentUser} />}
      {tab === 'notifications' && <NotificationSettings />}
      {tab === 'display' && <DisplaySettings />}
      {tab === 'apps' && <AppsSettings />}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 12, marginTop: 20 }}>
      {children}
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '10px 0', borderBottom: '1px solid var(--border-divider)',
    }}>
      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}

function ToggleRow({ label, defaultOn = false }: { label: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '10px 0', borderBottom: '1px solid var(--border-divider)',
    }}>
      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
      <button
        onClick={() => setOn(v => !v)}
        style={{
          width: 36, height: 20, borderRadius: 10, position: 'relative',
          background: on ? 'var(--color-accent)' : 'var(--bg-input)',
          border: '1px solid var(--border-default)', cursor: 'pointer',
        }}
      >
        <div style={{
          width: 14, height: 14, borderRadius: '50%', background: '#fff',
          position: 'absolute', top: 2,
          left: on ? 18 : 2,
          transition: 'left 0.15s ease',
        }} />
      </button>
    </div>
  );
}

function ProfileSettings({ user, userTeams }: { user: typeof users[0]; userTeams: typeof teams }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <Avatar userId={user.id} size={64} />
        <div>
          <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-primary)' }}>{user.name}</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{user.role}</div>
        </div>
      </div>

      <SectionLabel>Personal Information</SectionLabel>
      <FieldRow label="Full name" value={user.name} />
      <FieldRow label="Email" value={user.email} />
      <FieldRow label="Role" value={user.role || 'Member'} />

      <SectionLabel>Teams</SectionLabel>
      {userTeams.map(team => (
        <div key={team.id} style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0',
          borderBottom: '1px solid var(--border-divider)',
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6, background: 'var(--color-accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 600, color: '#fff',
          }}>
            {team.name.charAt(0)}
          </div>
          <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{team.name}</span>
        </div>
      ))}
    </div>
  );
}

function AccountSettings({ user }: { user: typeof users[0] }) {
  return (
    <div>
      <SectionLabel>Account Details</SectionLabel>
      <FieldRow label="Email" value={user.email} />
      <FieldRow label="Organization" value={organization.name} />
      <FieldRow label="Account type" value="Premium" />

      <SectionLabel>Security</SectionLabel>
      <FieldRow label="Password" value="Last changed 30 days ago" />
      <FieldRow label="Two-factor authentication" value="Enabled" />
      <FieldRow label="Active sessions" value="1 session" />
    </div>
  );
}

function NotificationSettings() {
  return (
    <div>
      <SectionLabel>Activity Notifications</SectionLabel>
      <ToggleRow label="Task assigned to me" defaultOn />
      <ToggleRow label="Task completed" defaultOn />
      <ToggleRow label="Comments on tasks I follow" defaultOn />
      <ToggleRow label="Project status updates" defaultOn />
      <ToggleRow label="Mentions" defaultOn />

      <SectionLabel>Email Notifications</SectionLabel>
      <ToggleRow label="Daily summary email" defaultOn />
      <ToggleRow label="Weekly report" />
      <ToggleRow label="Marketing emails" />
    </div>
  );
}

function DisplaySettings() {
  return (
    <div>
      <SectionLabel>Theme</SectionLabel>
      <FieldRow label="Color theme" value="Dark" />
      <FieldRow label="Sidebar" value="Expanded" />

      <SectionLabel>Language & Region</SectionLabel>
      <FieldRow label="Language" value="English" />
      <FieldRow label="Date format" value="MM/DD/YYYY" />
      <FieldRow label="Time format" value="12-hour" />
      <FieldRow label="First day of week" value="Sunday" />
    </div>
  );
}

function AppsSettings() {
  const apps = [
    { name: 'Slack', status: 'Connected', icon: '#4A154B' },
    { name: 'Google Drive', status: 'Connected', icon: '#4285F4' },
    { name: 'GitHub', status: 'Not connected', icon: '#24292e' },
    { name: 'Figma', status: 'Not connected', icon: '#A259FF' },
  ];

  return (
    <div>
      <SectionLabel>Connected Apps</SectionLabel>
      {apps.map(app => (
        <div key={app.name} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '10px 0', borderBottom: '1px solid var(--border-divider)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 6, background: app.icon,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 600, color: '#fff',
            }}>
              {app.name.charAt(0)}
            </div>
            <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{app.name}</span>
          </div>
          <span style={{
            fontSize: 12,
            color: app.status === 'Connected' ? 'var(--color-success)' : 'var(--text-tertiary)',
          }}>
            {app.status}
          </span>
        </div>
      ))}
    </div>
  );
}
