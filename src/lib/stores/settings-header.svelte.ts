import type { Snippet } from "svelte";

class SettingsHeaderStore {
    #actions = $state<Snippet | null>(null);

    get actions() {
        return this.#actions;
    }

    setActions(snippet: Snippet | null) {
        this.#actions = snippet;
    }

    clearActions() {
        this.#actions = null;
    }
}

export const settingsHeaderStore = new SettingsHeaderStore();
