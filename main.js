#!/usr/bin/env node

import Deck from './deck.js';
import Vorpal from 'vorpal'; // Import vorpal for CLI interaction
import {generateCompletionJson} from './ollamaclient.js'; // Import ollama for AI interaction
import fs from 'fs';
import { whiteCards, blackCards } from './cah.js';
import { exit } from 'process';

const vorpal = Vorpal();

let bestmodel = 'qwen3:8b'; // Default to this model, if possible
let model = null;

let mydeck = null;

function init() {
    mydeck = new Deck([]);
}

function spinner(vorpal) {

    const spinnerChars = ['|', '/', '-', '\\'];
    let currentChar = 0;

    let start = new Date();
    const interval = setInterval(() => {
        let elapsed = new Date() - start;
        vorpal.ui.redraw(spinnerChars[currentChar] + " " + Math.floor(elapsed/1000));
        currentChar = (currentChar + 1) % spinnerChars.length;
    }, 100);

    return () => { 
        clearInterval(interval);
        vorpal.ui.redraw.clear();
    }
}

// Find a model to use
let models;
try {
    const { getModels } = await import('./ollamaclient.js');
    models = await getModels();
    if(models.indexOf(bestmodel) !== -1)
        model = bestmodel; // Use the best model if available
    else
        model = models[0]; // Default to the first model

    console.log('Using model:', model);

} catch (err) {
    this.log('Failed to retrieve models:', err.message || err);
    exit(1);
}




init();

function pick_card(cards, challenge) {

    // We load the prompt each time so that we can tweak it during the game
    const basepromptPath = 'baseprompt.txt';
    let baseprompt = fs.readFileSync(basepromptPath, 'utf8');
    let prompt = baseprompt.replace('{challenge}', challenge);
    const clist = cards.map((card, idx) => `${idx + 1}. ${card}`).join('\n');
    prompt = prompt.replace('{cards}', clist);

    // Use the ollama client to generate a completion based on the challenge
    return generateCompletionJson(model, prompt)
        .then(response => {
            console.log("Ran with model:", model);
            console.log('Response JSON:', response, typeof response);

            // Check if the response is valid and contains a card
            if (!response.card) {
                console.error('ollama did not pick a card', response);
                return null; // Handle invalid response gracefully
            }

            return response.card; // Return the card picked by the AI
        })
        .catch(error => {
            console.error('Error picking card:', error);
            return null; // Handle error gracefully
        });
}

function judge(submissions, blackCard) {
    // We load the prompt each time so that we can tweak it during the game
    const basepromptPath = 'judgeprompt.txt';
    let baseprompt = fs.readFileSync(basepromptPath, 'utf8');
    let prompt = baseprompt.replace('{prompt}', blackCard);  
    const clist = submissions.map((card, idx) => `${idx + 1}. ${card}`).join('\n');
    prompt = prompt.replace('{submissions}', clist);

    console.log("Prompt for judging:", prompt);
    
    // Use the ollama client to generate a completion based on the challenge
    return generateCompletionJson(model, prompt)
        .then(response => {
            console.log("Ran with model:", model);            
            console.log('Response JSON:', response);

            // Check if the response is valid and contains a card
            if (!response.winner) {
                console.error('ollama did not pick a winner', response);
                return null; // Handle invalid response gracefully
            }

            if(!response.quip) {
                response.quip = ""; // Default quip if not provided
            }

            return response; // Return the winning submission
        })
        .catch(error => {
            console.error('Error judging submissions:', error);
            return null; // Handle error gracefully
        });
}



vorpal
    .command('models', 'Lists available models and lets you select one.')
    .action(async function(args, callback) {
       
        let models;
        try {
            const { getModels } = await import('./ollamaclient.js');
            models = await getModels();
        } catch (err) {
            this.log('Failed to retrieve models:', err.message || err);
            callback();
            return;
        }

        this.log('Available models:', models);
        models.forEach((m, i) => this.log(`${i + 1}: ${m}`));

        this.prompt({
            type: 'input',
            name: 'choice',
            message: 'Enter the number of the model to use:',
            validate: input => {
                const idx = parseInt(input, 10);
                return idx >= 1 && idx <= models.length ? true : 'Invalid selection';
            }
        }, result => {
            const idx = parseInt(result.choice, 10) - 1;
            model = models[idx];
            this.log(`Model set to: ${model}`);
            
            //callback();
            vorpal.show();
        });
    });


vorpal
    .command('add <card>', 'Adds a card to the hand.')
    .action(function(args, callback) {
        if (!mydeck) {
            this.log('Deck not initialized.');
            callback();
            return;
        }
        mydeck.cards.push(args.card);
        this.log(`Card "${args.card}" added to the hand.`);
        callback();
    });

vorpal
    .command('deal', 'Replaces the hand with 10 random cards from the white collection.')
    .action(function(args, callback) {
        if (!mydeck) {
            this.log('Deck not initialized.');
            callback();
            return;
        }
        // Pick 10 random cards from whiteCards (allowing duplicates if not enough unique cards)
        const shuffled = whiteCards.slice().sort(() => 0.5 - Math.random());
        mydeck.clear();
        mydeck.add(shuffled.slice(0, 10));
        this.log('Dealt 10 new cards to your hand.');
        callback();
    });

    vorpal
        .command('black', 'Pops the next card off the black deck and displays it.')
        .action(async function(args, callback) {
            if (!blackCards || blackCards.length === 0) {
                this.log('No black cards available.');
                callback();
                return;
            }

            // Remove and show the first black card
            const card = blackCards.shift();

            this.log(`Black card: ${card}`);

            setTimeout(() => {
                vorpal.ui.input(`play "${card}"`);
            }, 100);

            callback();
        });

vorpal
    .command('play <challenge>', 'Picks a card from the hand using the challenge, removes it, and prints it.')
    .action(async function(args, callback) {
        if (mydeck.cards.length === 0) {
            this.log('No cards in hand to play.');
            callback();
            return;
        }

        // Show a throbber while we wait for the AI to pick a card
        this.log("Waiting for AI...");
        var done = spinner(vorpal);

        // Pass the challenge argument to pick_card
        let picked = await pick_card(mydeck.cards, args.challenge);

        done(); // Stop the spinner

        if (!picked) {
            this.log(' + FAILED: No suitable card found.');
            callback();
            return;
        }

        if(typeof picked !== 'object') {
            picked = [picked];
        }

        // First we check if the picked cards are in the hand
        let passed = true;
        for (const card of picked) {
            if (typeof mydeck.find(card) == 'undefined') {
                this.log(` + FAILED: Card "${card}" not found in hand.`);
                passed = false;;
            }
        }

        // Then we remove the picked cards from the hand
        if(passed) {
            picked.forEach(card => {
                mydeck.remove(card);
                this.log(" + PLAY " + card);
            });
        }
        
        callback();
    });

    vorpal
        .command('judge <blackCard>', 'Judge submissions for a black card. Enter each submission line by line, type "done" to finish.')
        .action(async function(args, callback) {
            const submissions = [];
            const promptForSubmission = () => {
                this.prompt({
                    type: 'input',
                    name: 'submission',
                    message: 'Enter submission (or "done" to finish):'
                }, async result => {

                    console.log("Received submission:", result);

                    let card = result.submission;

                    if(card.trim() == "") {
                        promptForSubmission();
                    } else if (card.trim().toLowerCase() === 'done') {
                        this.log('Submissions collected:', submissions);
                        this.log("Waiting for AI to judge...");

                        var stopSpinner = spinner(vorpal);

                        let { winner, quip } = await judge(submissions, args.blackCard);

                        stopSpinner(); // Stop the spinner

                        console.log(`The winner is... \"${winner}\"`);
                        console.log(`\" ${quip} \"`);

                        //callback();
                        vorpal.show(); // Show the prompt again
                    } else {
                        submissions.push(card);
                        promptForSubmission();
                    }
                });
            };
            this.log(`Judging for black card: "${args.blackCard}"`);
            promptForSubmission();
        });

vorpal
    .command('list', 'Lists all cards in the hand.')
    .action(function(args, callback) {
        if (!mydeck || mydeck.cards.length === 0) {
            this.log('No cards in hand.');
        } else {
            this.log('Cards in hand:');
            mydeck.cards.forEach((card, idx) => {
                this.log(`${idx + 1}: ${card}`);
            });
        }
        callback();
    });

vorpal
    .command('clear', 'Clears all cards from the hand.')
    .action(function(args, callback) {
        init
        this.log('Hand has been cleared.');
        callback();
    });


vorpal
    .catch('[words...]', 'Handles unknown commands.')
    .action(function(args, callback) {
        this.log(`Unknown command: ${args.words[0]}`);
        callback();
    });

vorpal
    .delimiter('> ')
    .show();

console.log('Welcome to the interactive CLI. Type "exit" to quit or "help" for help.');
