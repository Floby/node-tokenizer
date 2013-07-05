var EventEmitter = require('events').EventEmitter;
var util = require('util');
var assert = require('assert');
var Transform = require('stream').Transform;

function noop(){}

function Tokenizer (check_token_cb, options) {
    if(!(this instanceof Tokenizer)) {
      return new Tokenizer(check_token_cb);
    }

    Transform.call(this, options);
    this._readableState.objectMode = true;
    this._buffered = ""; // we buffer untokenized data between writes
    this._regexes = []; // should contain objects 
                        // with regex[RegExp] and type[String]
    this._ignored = {}; // a hash of ignored token types
                        // these will be parsed but not emitted
    this._checkToken = check_token_cb || noop;
}
util.inherits(Tokenizer, Transform);

Tokenizer.prototype._transform = function _transform(chunk, encoding, callback) {
  chunk = chunk.toString();
  var self = this;
  process.nextTick(function () {
    self._tokenize(chunk);
    callback();
  })
};

Tokenizer.prototype._tokenize = function _tokenize(data, nobuffer) {
    // in case we buffered data on previous writes
    data = this._buffered + data;
    // if we couldn't tokenize it last time, no need to retry
    var i = this._buffered.length;
    // the index at which unparsed data begins
    var last_tokenized = 0;
    var matching; // array of matching rules of the previous iteration

    while(i <= data.length) {
        // we take a little bit of the data an try to match it
        var buf = data.substring(last_tokenized, i);
        if(!buf.length) { ++i; continue; } // ignore ""
        // create a list of the rules matching this bit
        var m = this._regexes.filter(function(e) {
            return e.regex.test(buf);
        });
        // if no match now...
        if(!m.length) {
            // ... and no match during the last iteration
            if(!matching || !matching.length) {
                // something went wrong
                this.emit('error', new SyntaxError('could not parse '+JSON.stringify(buf)));
                this._tokenize = noop;
                return;
            }
            // if something was matching for the previous bit
            // this is our token
            else {
                var token = buf.substr(0, buf.length-1);
                this._gotToken(token, matching[0]);
                last_tokenized = --i; // adjust these values
                matching = null; // start matching something else
            }
        }
        // we got some matches
        // let's see if it still matches on the next iteration
        else {
            matching = m;
        }
        ++i;
    }
    // no other data is coming, we can emit what we have
    if(nobuffer) {
        // when no actual data was tokenized, matching is undefined
        if(matching) {
            this._gotToken(data.substr(last_tokenized), matching[0]);
        }
    }
    // buffer data for the next write
    else {
        this._buffered = data.substring(last_tokenized);
    }
};

Tokenizer.prototype._flush = function _flush(callback) {
  var self = this;
  process.nextTick(function () {
    self._tokenize('', true);
    callback();
  });
};

var Token = function String (content, type) {
  this.content = content;
  this.type = type;
  this.toString = function () {
    return this.content.toString();
  }
}
util.inherits(Token, String);
Token.prototype.valueOf = function valueOf() {
  return this.content;
};

Tokenizer.prototype._gotToken = function _gotToken(str, rule) {
    // notify the token checker
    var type = this._checkToken(str, rule) || rule.type;
    if(this._ignored[type]) return;
    var token = new Token(str, type);

    this.push(token);

    this.emit('token', token);
};

Tokenizer.prototype.addRule = function addRule(regex, type) {
    // this is useful for built-in rules
    if(!type) {
        return this.addRule(regex[0], regex[1]);
    }
    assert.ok((regex instanceof RegExp) || (typeof regex === 'function'));
    assert.equal(typeof type, 'string');
    this._regexes.push({regex:regex,type:type});
};

/**
 * set some tokens to be ignored. these won't be emitted
 */
Tokenizer.prototype.ignore = function ignore(ignored) {
    if(typeof ignore === 'array') {
        for (var i = 0; i < ignored.length; ++i) {
            this.ignore(ignored[i]);
        }
        return;
    }
    this._ignored[ignored] = true;
};

module.exports = Tokenizer;

// built-in rules
Tokenizer.whitespace    = [/^(\s)+$/, 'whitespace'];
Tokenizer.word          = [/^\w+$/, 'word'];
Tokenizer.number        = [/^\d+$/, 'number'];
