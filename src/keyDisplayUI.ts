import {FORWARD, BACKWARD, LEFT, RIGHT, SPACE, NEXT, PREVIOUS, X_BUTTON} from './constants';

export class KeyDisplayUI {
    map: Map<string, HTMLDivElement> = new Map();
    centerX = window.innerWidth / 2;
    centerY = window.innerHeight / 2;
    bottomOffset = window.innerHeight - 120;
    buttons: { key: string; textContent?: string; width?: string; top: number; left: number }[] = [
        { key: FORWARD, top: this.bottomOffset - 80, left: this.centerX - 10 },
        { key: LEFT, top: this.bottomOffset - 20, left: this.centerX - 80 },
        { key: BACKWARD, top: this.bottomOffset - 20, left: this.centerX - 10 },
        { key: RIGHT, top: this.bottomOffset - 20, left: this.centerX + 60 },
        { key: SPACE, textContent: 'jump', top: this.bottomOffset + 40, left: this.centerX - 80 },
        { key: PREVIOUS, top: this.centerY, left: 0.8 *  this.centerX },
        { key: NEXT, top: this.centerY, left: 1.2 *  this.centerX },
        { key: X_BUTTON, textContent: 'x', top: this.bottomOffset + 40, left: 20 },
    ];

    constructor(private readonly onLeftClick: () => void, private readonly onRightClick: () => void, private readonly onXClick: () => void) {
        this.createButtons();
        this.addClickEvents();
    }

    private createButtons(): void {
        this.buttons.forEach(({ key, textContent = key, width = (textContent === 'jump' ? '160px' : '20px'), top, left }) => {
            const button = document.createElement('div');
            button.textContent = textContent;
            button.className = 'button';
            button.style.color = '#000';
            button.style.fontWeight = '800';
            button.style.fontFamily = 'Arial, sans-serif';
            button.style.position = 'absolute';
            button.style.width = width;
            button.style.top = `${top}px`;
            button.style.left = `${left}px`;
            this.map.set(key, button);
            document.body.appendChild(button);
        });
    }

    private addClickEvents(): void {
        const leftButton = this.map.get(PREVIOUS);
        const rightButton = this.map.get(NEXT);
        const xButton = this.map.get(X_BUTTON);

        leftButton?.addEventListener('mousedown', this.onLeftClick);
        rightButton?.addEventListener('mousedown', this.onRightClick);
        xButton?.addEventListener('mousedown', this.onXClick);
    }
}
