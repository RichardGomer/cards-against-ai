Cards against AI
================

An experiment in whether LLMs can play cards against humanity.

This tool (which requires a local ollama server) makes it easy to have an LLM play CAH.

Playing
-------

You can add cards to the LLM's hand with `add "card text"` - add them as they're dealt to the LLM.

Ask the LLM to play a white card in response to a black card with `play "black card text"`

The model (should) pick one or more black cards to play and remove them from its hand.

When it is the LLM's turn to judge a round, run `judge "black card text"` and enter each white card when prompted.


Prompts
-------

The play prompt is stored in baseprompt.txt, and the judging prompt in judgeprompt.txt. Prompts can be modified with restarting the software.


Testing
-------

For testing, the libraries of black and white cards from CAH Family Edition are included.

Run `deal` to pick ten random white cards for the LLM's hand, and then `black` to suggest a random black card.


Models
------

Use `models` to select from ollama's available models. Models need to return reasonably good JSON. qwen3:8b seems to work well, so the software will use
that by default, if it's available.
