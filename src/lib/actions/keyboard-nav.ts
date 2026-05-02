export function keyboardList(node: HTMLElement, options = { selector: '[role="button"][tabindex="0"], a[tabindex="0"], button[tabindex="0"]' }) {
    const handleKeyDown = (e: KeyboardEvent) => {
        const items = Array.from(node.querySelectorAll(options.selector)) as HTMLElement[];
        const currentIndex = items.indexOf(document.activeElement as HTMLElement);

        if (e.key === "ArrowDown" || e.key === "ArrowRight") {
            e.preventDefault();
            const nextIndex = (currentIndex + 1) % items.length;
            items[nextIndex]?.focus();
        } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
            e.preventDefault();
            const prevIndex = (currentIndex - 1 + items.length) % items.length;
            items[prevIndex]?.focus();
        } else if (e.key === "Enter" && currentIndex !== -1) {
            items[currentIndex].click();
        }
    };

    node.addEventListener("keydown", handleKeyDown);

    return {
        destroy() {
            node.removeEventListener("keydown", handleKeyDown);
        }
    };
}

export function keyboardForm(node: HTMLElement) {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Enter") {
            const target = e.target as HTMLElement;
            if (target.tagName === "INPUT" || target.tagName === "SELECT") {
                e.preventDefault();
                const formElements = Array.from(node.querySelectorAll('input, select, button:not([type="button"])')) as HTMLElement[];
                const index = formElements.indexOf(target);
                if (index > -1 && index < formElements.length - 1) {
                    formElements[index + 1].focus();
                } else if (index === formElements.length - 1) {
                    // Se for o último elemento (geralmente o botão de salvar), clica nele
                    formElements[index].click();
                }
            }
        }
    };

    node.addEventListener("keydown", handleKeyDown);

    return {
        destroy() {
            node.removeEventListener("keydown", handleKeyDown);
        }
    };
}
