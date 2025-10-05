import { ref, watch, type Ref } from 'vue';
import { useDebounceFn } from '@vueuse/core';

const AUTOSAVE_DELAY_MS = 30000; // 30 seconds
const DRAFT_EXPIRY_DAYS = 7;

export function useAutoSave<T>(key: string, data: Ref<T>) {
  const lastSaved = ref<Date | null>(null);
  const hasDraft = ref(false);

  const draftKey = `draft_${key}`;
  const timestampKey = `draft_${key}_timestamp`;

  function saveDraft() {
    try {
      const now = new Date();
      localStorage.setItem(draftKey, JSON.stringify(data.value));
      localStorage.setItem(timestampKey, now.toISOString());
      lastSaved.value = now;
    } catch (err) {
      console.error('Auto-save failed:', err);
    }
  }

  const debouncedSave = useDebounceFn(saveDraft, AUTOSAVE_DELAY_MS);

  function loadDraft(): T | null {
    const draft = localStorage.getItem(draftKey);
    const timestamp = localStorage.getItem(timestampKey);

    if (!draft || !timestamp) return null;

    const savedDate = new Date(timestamp);
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() - DRAFT_EXPIRY_DAYS);

    if (savedDate < expiryDate) {
      clearDraft();
      return null;
    }

    hasDraft.value = true;
    lastSaved.value = savedDate;
    return JSON.parse(draft);
  }

  function clearDraft() {
    localStorage.removeItem(draftKey);
    localStorage.removeItem(timestampKey);
    hasDraft.value = false;
    lastSaved.value = null;
  }

  // Watch for changes and auto-save
  watch(data, () => {
    debouncedSave();
  }, { deep: true });

  return {
    lastSaved,
    hasDraft,
    loadDraft,
    clearDraft,
    saveDraft
  };
}
