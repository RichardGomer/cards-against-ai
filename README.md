Cards against AI
================

An experiment in whether LLMs can play cards against humanity.

This tool (which requires a local ollama server) makes it easy to have an LLM play CAH.

You can add cards to the LLM's hand with `add "card text"`

Then ask it to play in response to a black card with `play "black card text"`

The model (should) pick one or more black cards to play and remove them from its hand.

The prompt is stored in baseprompt.txt and can be edited without restarting the program.

Judging isn't implemented yet.


Testing
-------

For testing, the libraries of black and white cards from CAH Family Edition are included.

Run `deal` to pick ten random white cards for the LLM's hand, and then `black` to suggest a random black card.


Models
------

Use `models` to select from ollama's available models. Models need to return reasonably good JSON.
