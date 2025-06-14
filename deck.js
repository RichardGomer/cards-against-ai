class Deck {
    constructor(cards = []) {
        this.cards = [...cards];
    }

    add(cards) {
        if (Array.isArray(cards)) {
            this.cards.push(...cards);
        } else {
            this.cards.push(cards);
        }
    }

    pop() {
        return this.cards.pop();
    }

    find(card) {
        const index = this.cards.indexOf(card);
        return index !== -1 ? this.cards[index] : undefined;
    }

    remove(card) {
        const index = this.cards.indexOf(card);
        if (index !== -1) {
            return this.cards.splice(index, 1)[0];
        }
        return undefined;
    }

    insert(index, card) {
        this.cards.splice(index, 0, card);
    }

    // Utility methods
    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    size() {
        return this.cards.length;
    }

    isEmpty() {
        return this.cards.length === 0;
    }

    clear() {
        this.cards = [];
    }
}

export default Deck;