var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    assert = require('assert'),
    Transform = require('stream').Transform;

function noop(){}

function Tokenizer (check_token_cb, options) {
  if(!(this instanceof Tokenizer)) {
    return new Tokenizer(check_token_cb, options);
  }

  this.options = options || {};
  this.options.stepSize = this.options.hasOwnProperty('stepSize') ? this.options.stepSize : 0;

  Transform.call(this, options);

  this._readableState.objectMode = true;
  this._buffered = '';  // we buffer untokenized data between writes
  this._regexes = [];   // should contain objects with regex[RegExp] and type[String]
  this._ignored = {};   // a hash of ignored token types these will be parsed but not emitted
  this._checkToken = check_token_cb || noop;
}

util.inherits(Tokenizer, Transform);

Tokenizer.prototype._transform = function _transform(chunk, encoding, callback) {
  chunk = chunk.toString();
  var self = this;

  process.nextTick(function () {
    try {
      var index = 0,
          step = self.options.stepSize;

      if (self.options.stepSize > 0)
      {
        while (index < chunk.length) {
          self._tokenize(chunk.substr(index, step));
          index += step;
        }
      }
      else self._tokenize(chunk);

      callback();
    } catch(e) {
      callback(e, chunk);
    }
  })
};

Tokenizer.prototype._getMatchingRule = function _getMatchingRule(str) {
  for (var i = 0; i < this._regexes.length; i++)
    if(str.search(this._regexes[i].regex) == 0)
      return this._regexes[i];

  return null;
};

Tokenizer.prototype._firstMatchLength = function(str, regex) {
  for (var i = 1; i < str.length; i++)
    if (regex.test(str.substr(0, i)))
      return i;
  return -1;
}

Tokenizer.prototype._tokenize = function _tokenize(data, endofstream) {
  // Did we buffered data on previous writes?
  data = this._buffered + data;
  this._buffered = '';

  while (data && data.length)
  {
    var rule = undefined,
        str = undefined,
        ix = -1;

    if (this.options.split) {
      while ((ix = data.search(this.options.split)) == 0)
      {
        var len = this._firstMatchLength(data, this.options.split);
        this.emit('split', data.substr(0, len));

        data = data.substr(len);
      }

      str = ix != -1 ? data.substr(0, ix) : data;
      data = ix != -1 ? data.substr(ix) : undefined;
    }
    else {
      str = data;
      data = undefined;
    }

    for (var i = str.length; i > 0; i--)
      if (rule = this._getMatchingRule(str.substr(0, i))) break;

    if (!rule) throw new SyntaxError('No rules found to match any part of \'' + str.toString() + '\'');
    else if (i == str.length && !endofstream && (!data || !data.length)) {
      this._buffered = str;
      return;
    }

    data = str.substr(i) + (data || '');  
    str = str.substr(0, i);

    this._gotToken(str, rule);
  } // while
};

Tokenizer.prototype._flush = function _flush(callback) {
  var self = this;

  process.nextTick(function () {
    try {
      self._tokenize('', true);
      callback();
    } catch(e) {
      callback(e);
    }
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
  var type = rule.type || this._checkToken(str, rule);
  if(this._ignored[type]) return;
  var token = new Token(str, type);

  this.push(token);

  this.emit('token', token, type);
};

Tokenizer.prototype.addRule = function addRule(regex, type) {
  // this is useful for built-in rules
  if(!type) {
    if(Array.isArray(regex)) {
      return this.addRule(regex[0], regex[1]);
    }
    else if(regex) {
      return this.addRule(Tokenizer[regex]);
    }
    else {
      throw new Error('No parameters specified');
    }
  }
  assert.ok((regex instanceof RegExp) || (typeof regex === 'function'));
  assert.equal(typeof type, 'string');
  this._regexes.push({regex:regex,type:type});
};

/**
 * set some tokens to be ignored. these won't be emitted
 */
Tokenizer.prototype.ignore = function ignore(ignored) {
  if(ignored instanceof Array)
    return ignored.forEach(this.ignore.bind(this));
  this._ignored[ignored] = true;
};

module.exports = Tokenizer;

// built-in rules
Tokenizer.whitespace    = [/^(\s)+$/, 'whitespace'];
Tokenizer.word          = [/^\w+$/, 'word'];
Tokenizer.number        = [/^\d+(\.\d+)?$/, 'number'];