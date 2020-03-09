# node-red-contrib-bert-tokenizer
Implement BERT tokenizer as a custom Node-RED custom node

## Installation
npm install node-red-contrib-bert-tokenizer

## Usage

The input payload is text (i.e. words, sentences, etc) to be converted into input feature for the BERT model. The input is tokenized and no longer than 126 tokens. Each name array in the output object has 128 numbers. See [BERT-Tokenizer](https://github.com/tedhtchang/bert-tokenizer) for an example output.

## Optional node property:
URL: vocabulary url must start with:
1. leave empty to load the default
2. http(s):// to fetch the model from web.
3. file:// to load the vocaburlary file on the server.
