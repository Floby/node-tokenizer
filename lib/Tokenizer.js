var EventEmitter = require('events').EventEmitter;
var sys = require('sys');
var assert = require('assert');

function noop(){}

function Tokenizer (check_token_cb) {
    EventEmitter.apply(this);
    this._buffered = ""; // we buffer untokenized data between writes
    this._regexes = []; // should contain objects 
                        // with regex[RegExp] and type[String]
    this._checkToken = check_token_cb || noop;
}
sys.inherits(Tokenizer, EventEmitter);

Tokenizer.prototype.write = function write(data, nobuffer) {
    assert.ok(typeof data == 'string');
    this._tokenize(data, nobuffer);
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
        if(!buf.length) {++i; debugger; continue} // ignore ""
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
        this._gotToken(data.substr(last_tokenized), matching[0]);
    }
    // buffer data for the next write
    else {
        this._buffered = data.substring(last_tokenized);
    }
};

Tokenizer.prototype.end = function end(data) {
    this.write(data || '', true);
    this.write = noop;
    this.emit('end');
};

Tokenizer.prototype._gotToken = function _gotToken(str, rule) {
    // notify the token checker
    var type = this._checkToken(str, rule) || rule.type;
    this.emit('data', str, type); // act like a readable stream
    this.emit('token', str, type);
};

Tokenizer.prototype.addRule = function addRule(regex, type) {
    // TODO: check types
    this._regexes.push({regex:regex,type:type});
};

module.exports = Tokenizer;
