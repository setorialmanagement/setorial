import { create } from 'zustand';
import { api } from '../services/api';

interface MascotOverride {
    enabled: boolean;
    mood: string | null;
}

interface ConfigState {
    mascotOverride: MascotOverride | null;
    loadMascotOverride: () => Promise<void>;
}

export const useConfigStore = create<ConfigState>((set) => ({
    mascotOverride: null,
    loadMascotOverride: async () => {
        try {
            const res = await api.get('/public/configs/mascot_mood_override');
            const payload = res.data?.value ?? null;
            if (!payload) {
                set({ mascotOverride: null });
                return;
            }
            let parsed = null;
            try {
                parsed = JSON.parse(payload);
            } catch (e) {
                parsed = null;
            }
            if (parsed && typeof parsed === 'object') {
                set({ mascotOverride: { enabled: !!parsed.enabled, mood: parsed.mood ?? null } });
            } else {
                set({ mascotOverride: null });
            }
        } catch (e) {
            // ignore network errors, keep previous state
        }
    },
}));
