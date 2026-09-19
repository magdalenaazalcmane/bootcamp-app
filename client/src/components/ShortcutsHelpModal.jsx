import { useModalA11y } from '../hooks/useModalA11y';
import { SHORTCUTS } from '../shortcuts';

function ShortcutsHelpModal({ onClose }) {
  const modalRef = useModalA11y(onClose);

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div
        className="modal"
        onMouseDown={(e) => e.stopPropagation()}
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-modal-title"
      >
        <h2 id="shortcuts-modal-title">Keyboard shortcuts</h2>
        <ul className="shortcuts-list">
          {SHORTCUTS.map((s) => (
            <li key={s.id}>
              <kbd>{s.label}</kbd>
              <span>{s.description}</span>
            </li>
          ))}
        </ul>
        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ShortcutsHelpModal;
