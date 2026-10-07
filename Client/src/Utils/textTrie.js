// High-performance Trie for in-document vocabulary & word prefix completion
export class DocumentTrie {
  constructor() {
    this.root = {};
  }

  insert(word) {
    if (!word || typeof word !== 'string') return;
    const clean = word.toLowerCase().trim();
    if (clean.length < 3) return;

    let node = this.root;
    for (let i = 0; i < clean.length; i++) {
      const char = clean[i];
      if (!node[char]) {
        node[char] = {};
      }
      node = node[char];
    }
    node.isWord = true;
    node.originalWord = clean;
  }

  // Populate Trie from full document text
  buildFromText(text) {
    this.root = {};
    if (!text || typeof text !== 'string') return;
    const words = text.match(/[a-zA-Z]{3,}/g) || [];
    for (const w of words) {
      this.insert(w);
    }
  }

  // Find remaining suffix completion for a given prefix
  // e.g. prefix "or" -> returns "der", prefix "collab" -> returns "orators"
  findCompletion(prefix) {
    if (!prefix || prefix.length < 2) return null;
    const clean = prefix.toLowerCase();

    let node = this.root;
    for (let i = 0; i < clean.length; i++) {
      const char = clean[i];
      if (!node[char]) {
        return null; // No word in document starts with this prefix
      }
      node = node[char];
    }

    // Traverse down to find the most direct complete word
    const bestWord = this._findShortestWord(node);
    if (!bestWord) return null;

    // Return only the remaining suffix
    if (bestWord.length > clean.length && bestWord.startsWith(clean)) {
      return bestWord.slice(clean.length);
    }
    return null;
  }

  _findShortestWord(node) {
    let queue = [node];
    while (queue.length > 0) {
      const current = queue.shift();
      if (current.isWord && current.originalWord) {
        return current.originalWord;
      }
      for (const key of Object.keys(current)) {
        if (key !== 'isWord' && key !== 'originalWord') {
          queue.push(current[key]);
        }
      }
    }
    return null;
  }
}
