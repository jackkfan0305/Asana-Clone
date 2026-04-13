import { customFields } from '../../../data/seed';
import { Badge } from '../../common/Badge';

export function CustomFieldsPage() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ font: 'var(--font-h1)' }}>Custom Fields</h1>
        <button style={{ background: 'var(--color-primary)', color: '#fff', padding: '8px 16px', borderRadius: 'var(--radius-btn)', fontSize: 13 }}>
          + Create Field
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {customFields.map(field => (
          <div key={field.id} style={{
            background: 'var(--bg-card)', borderRadius: 'var(--radius-card)', padding: 16,
            border: '1px solid var(--border-default)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 500 }}>{field.name}</span>
                <span style={{ fontSize: 11, padding: '2px 8px', background: 'var(--bg-input)', borderRadius: 'var(--radius-pill)', color: 'var(--text-secondary)' }}>
                  {field.type}
                </span>
              </div>
              <button style={{ color: 'var(--text-secondary)', fontSize: 12 }}>⋯</button>
            </div>
            {field.options.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {field.options.map(opt => (
                  <Badge key={opt.id} label={opt.name} color={opt.color} size="sm" />
                ))}
              </div>
            )}
            {field.type === 'number' && <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Numeric value</span>}
            {field.type === 'date' && <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Date picker</span>}
            {field.type === 'people' && <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>People selector</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
