/**
 * Cards Against Humanity Decks
 */
import fs from 'fs';

let whiteCards = fs.readFileSync('whiteCards.txt', 'utf8').split('\n').filter(line => line.trim() !== '');
let blackCards = fs.readFileSync('blackCards.txt', 'utf8').split('\n').filter(line => line.trim() !== '');

// Trim trailing whitespace and periods from each card
const trimCard = card => card.trim().replace(/\.+$/, '');
whiteCards = whiteCards.map(trimCard);
blackCards = blackCards.map(trimCard);

// Randomize the order of the cards
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
shuffle(whiteCards);
shuffle(blackCards);

export { whiteCards, blackCards };