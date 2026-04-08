export class SpoilerSystem {
    constructor() {
        this.angle = 0; 
        this.isOpen = false;
        this.pivotSpeed = 150; // Fast deployment
    }

    update(isButtonPressed, deltaTime) {
        this.isOpen = isButtonPressed;
        const target = this.isOpen ? 60 : 0;

        if (this.angle < target) {
            this.angle = Math.min(target, this.angle + this.pivotSpeed * deltaTime);
        } else if (this.angle > target) {
            this.angle = Math.max(target, this.angle - this.pivotSpeed * deltaTime);
        }
        return this.angle;
    }

    getDragEffect() {
        // Spoilers are huge air brakes; they should bleed speed effectively
        return (this.angle / 60) * 4.5; 
    }
}
