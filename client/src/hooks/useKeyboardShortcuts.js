import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { SHORTCUTS, GOTO_KEY_MAP } from '../shortcuts';

const GOTO_TIMEOUT_MS = 900;

function isTypingTarget(el) {
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}

// Installs the app's global keyboard shortcuts (see shortcuts.js). Does
// nothing while an input/textarea/select/contenteditable is focused, so
// normal typing is never hijacked.
export function useKeyboardShortcuts({ onOpenSearch, onOpenHelp }) {
  const navigate = useNavigate();
  const awaitingGotoRef = useRef(false);
  const gotoTimeoutRef = useRef(null);

  useEffect(() => {
    function clearGoto() {
      awaitingGotoRef.current = false;
      clearTimeout(gotoTimeoutRef.current);
    }

    function handleKeyDown(e) {
      if (isTypingTarget(e.target)) return;

      const isMod = e.metaKey || e.ctrlKey;

      if (isMod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        clearGoto();
        onOpenSearch();
        return;
      }

      if (isMod || e.altKey) return;

      if (e.key === '?') {
        e.preventDefault();
        clearGoto();
        onOpenHelp();
        return;
      }

      if (awaitingGotoRef.current) {
        clearGoto();
        const shortcutId = GOTO_KEY_MAP[e.key.toLowerCase()];
        const shortcut = SHORTCUTS.find((s) => s.id === shortcutId);
        if (shortcut?.path) {
          e.preventDefault();
          navigate(shortcut.path);
        }
        return;
      }

      if (e.key.toLowerCase() === 'g') {
        awaitingGotoRef.current = true;
        gotoTimeoutRef.current = setTimeout(clearGoto, GOTO_TIMEOUT_MS);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(gotoTimeoutRef.current);
    };
  }, [navigate, onOpenSearch, onOpenHelp]);
}
