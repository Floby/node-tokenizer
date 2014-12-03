[![Build Status](https://travis-ci.org/Floby/node-tokenizer.png)](https://travis-ci.org/Floby/node-tokenizer)

# Synopsis
A wide purpose tokenizer for JavaScript that tokenizes based on rules established using Regular Expressions. The interface conforms to the WriteStream from [node.js](http://nodejs.org).

# Installation

    npm i tokenizer

## How to

**Requiring**

``` javascript
var Tokenizer = require('tokenizer');
```

**Construction**

``` javascript
var t = new Tokenizer(mycallback, options);
``` 

**Setting Options**

Options is an object passed to the constructor function and can contain the following properties (defaults shown inline):

    {
      stepSize: 0, // For large streams, the maximum size that will be tokenized at a time. This must be larger than the largest expected token.
      split: undefined // See explanation in 'Splitting into Smaller Pieces'
    }

**Adding Rules**

``` javascript
t.addRule(/^my regex$/, 'type');
```

**Splitting into Smaller Pieces**

By default, tokenizer attempts to find the longest match in the input stream. This can be a large performance hit for big files. If you are certain that your tokens will never cross a certain type of string boundary (like ',' or \n) you can specify
to split your input by that before tokenization which could improve performance dramatically.

``` javascript
// Break CSV into subportions and tokenize each subportion separately but in order of original input
t = new Tokenizer(undefined, {
  split: ','
}); 
```

``` javascript
// Break file up by lines and tokenize each line separately.
t = new Tokenizer(undefined, {
  split: /\r?\n/
});
```

**Writing/Piping**

``` javascript
t.write(data);
// or
stream.pipe(t);
```

**Listen for tokens**

``` javascript
t.on('token', function(token, type) {
    // do something useful
    // type is the type of the token (specified with addRule)
    // token is the actual matching string
});
// alternatively you can use the tokenizer as a readable stream.
```

**Listening for completion**

``` javascript
t.on('end', callback);
```

the optional callback argument for the constructor is a function that will
be called for each token in order to specify a different type by returning
a string. The parameters passed to the function are token(the token that we found)
and match, an object like this 

``` javascript
{
    regex: /whatever/ // the regex that matched the token
    type: 'type' // the type of the token
}
```

##Examples

Take a look a the [examples](https://github.com/Floby/node-tokenizer/tree/master/examples) folder.

## Rules

Rules are regular expressions associated with a type name.

The tokenizer tries to find the longest string matching one or more rules.
When several rules match the same string, priority is given to the rule
which was added first.

Note: normally your regular expressions should use ^ and $ in order
to test the whole string. If these are not used, you rule will match _every_
string that contains what you specified, this could be the whole file!

## To do

* Continued optimisation
* Rule sharing across several tokenizers (although this can be achieved through inheritance)
* Need more hooks
* Increase test coverage

## Testing

Testing is provided via the 

## License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2012 Florent Jaby

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
