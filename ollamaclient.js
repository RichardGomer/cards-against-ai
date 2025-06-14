/**
 * Simple client for the Ollama REST API using fetch.
 * Adjust the baseURL as needed.
 */

const baseURL = 'http://localhost:11434/api'; // Change if your Ollama server runs elsewhere

async function ollamaRequest(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' },
    };
    if (body) options.body = JSON.stringify(body);

    //console.log(options);

    const response = await fetch(`${baseURL}${endpoint}`, options);
    if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    var txt = await response.text();
    return txt;
}

// Example: Get available models
async function getModels() {
    var res = await ollamaRequest('/tags');
    //console.log('Available models:', res);

    // Parse the response as JSON
    let models = [];
    try {
        models = JSON.parse(res).models;
    } catch (e) {
        console.error('Failed to parse models response:', e);
        throw new Error('Invalid response from Ollama API');
    }

    //console.log('Parsed models:', models, typeof models);

    var list = [];
    for (const model of models) {
        if (model.name && model.name !== 'default') {
            list.push(model.name);
        }
    }

    if (!list || !Array.isArray(list) || list.length === 0) {
        throw 'No models found.';
    }
    
    return list;
}

// Example: Generate a completion
async function generateCompletion(model, prompt) {
    let raw = ollamaRequest('/generate', 'POST', { model, prompt});

    // The response is a stream of JSON lines, we need to process it
    let output = '';
    const lines = (await raw).split('\n');
    for (const line of lines) {
        if (line.trim() === '') continue;
        try {
            const obj = JSON.parse(line);
            if (obj.response) output += obj.response;
        } catch (e) {
            // Ignore lines that are not valid JSON
        }
    }

    return output;
}

// Export functions for use elsewhere
export { getModels, generateCompletion };