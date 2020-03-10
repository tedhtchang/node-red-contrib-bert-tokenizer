import {BertTokenizer} from 'bert-tokenizer';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import Url from 'url';

/**
 * Represent Node-Red's runtime
 */
type NodeRed = {
  nodes: NodeRedNodes;
};

/**
 * Represent Node-Red's nodes
 */
type NodeRedNodes = {
  // tslint:disable-next-line:no-any
  createNode(node: any, props: NodeRedProperties): void;
  // tslint:disable-next-line:no-any
  registerType(type: string, ctor: any): void;
};

/**
 * Represent Node-Red's configuration for a custom node
 * For this case, it's the configuration for bert-tokenizer node
 */
type NodeRedProperties = {
  url: string;
};

/**
 * Represent Node-Red's message that passes to a node
 */
type NodeRedReceivedMessage = {
  payload: string;
};

type NodeRedSendMessage = {
  payload: namedArrayMap;
};

type namedArrayMap = {
  inputIds: number[],
  segmentIds: number[],
  inputMask: number[]
}

// Module for a Node-Red custom node
export = function (RED: NodeRed) {
  class BertTokensNode{
    private on: (event: string, fn: (msg: NodeRedReceivedMessage) => void) => void;
    private send: (msg: NodeRedSendMessage) => void;
    private error: (error: string, msg?: NodeRedReceivedMessage) => void;

    bertTokenizer: BertTokenizer;
    private _localPath: string = "node_modules/node-red-contrib-bert-tokenizer/node_modules/bert-tokenizer/assets/vocab.json";;
    // private msg: NodeRedSendMessage;

    constructor (config: NodeRedProperties){
      this.loadVocabulary(config.url);
      RED.nodes.createNode(this, config);
      this.on('input', (msg: NodeRedReceivedMessage) => {
        this.handleRequest(msg.payload);
      });
    }


    /*
    * Fetches the vocabulary file from 'url' and saved locally under 'dir'
    */
    async fetchVocab(url: string, dir: string){
      const target = path.join(dir, 'vocab.json');
      const res = await fetch(url);
      const fileStream = fs.createWriteStream(target);
      return new Promise((resolve, reject) => {
        res.body.pipe(fileStream);
        res.body.on("error", (err :Error)=>{
          reject(err);
        });
        fileStream.on("finish", ()=>{
          resolve();
        })
      });
    }

    async loadVocabulary(vocabUrl: string){
      if (vocabUrl != "") {
        const url = Url.parse(vocabUrl, false, true);
        try {
          // fetch vocab from http url and save as ./vocab.json
          if (url.protocol === "http:" || url.protocol === "https:") {
            await this.fetchVocab(vocabUrl, __dirname);
            this.localPath = path.join(__dirname, 'vocab.json');
            console.log(`Downloaded custom vocabulary file from ${vocabUrl}.`);
          // fetch from a local file
          } else if (url.protocol === "file:") {
            if (fs.existsSync(Url.fileURLToPath(vocabUrl))){
              this.localPath = url.path
              console.log(`Found vocabulary ${url.path}.`);
            }else{
              throw `${url.path} file does not exist. Try use a absolute path.`
            }
          }
          // catch any thing else from url input.
          else {
            throw `Unsupported url format ${vocabUrl}. The url should start with file://, http:// or, https://.`;
          }
        }catch(err){
          // if fail to load from http or file use the default vocab instead.
          this.error(`${err} Using default vocabulary ${this.localPath} instead.`);
        }
      }
      // Load the default vocab if url is not specified.
      this.bertTokenizer = (vocabUrl === "")? new BertTokenizer() : new BertTokenizer(this.localPath, true)
      console.log("Vocabulary Loaded.");
    }

    set localPath(url: string) {
      this._localPath = url;
    }

    get localPath(){
      return this._localPath;
    }
    handleRequest(text: string) {
      const results = this.bertTokenizer.convertSingleExample(text);
      console.log(results);
        this.send({payload: results});
    }
  }
  RED.nodes.registerType("bert-tokenizer", BertTokensNode);
};



