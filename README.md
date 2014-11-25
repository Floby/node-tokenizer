[![Build Status](https://travis-ci.org/Floby/node-tokenizer.png)](https://travis-ci.org/Floby/node-tokenizer)

# Synopsis
A wide purpose tokenizer for JavaScript. The interface follows more or less the WriteStream from [node.js](http://nodejs.org).

# Installation

    npm i tokenizer

## How to

* require the Tokenizer constructor

``` javascript
var Tokenizer = require('tokenizer');
```

* construct one (we'll see what the callback is used for)

``` javascript
var t = new Tokenizer(mycallback);
``` 

* add rules

``` javascript
t.addRule(/^my regex$/, 'type');
```

* add split

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

* write or pump to it

``` javascript
t.write(data);
// or
stream.pipe(t);
```

* listen for new tokens

``` javascript
t.on('token', function(token, type) {
    // do something useful
    // type is the type of the token (specified with addRule)
    // token is the actual matching string
})
// alternatively you can use the tokenizer as a readable stream.
```

* look out for the end

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

Have a look in the example folder

## Rules
rules are regular expressions associated with a type name.
The tokenizer tries to find the longest string matching one or more rules.
When several rules match the same string, priority is given to the rule
which was added first. (this may change)

Please note that your regular expressions should use ^ and $ in order
to test the whole string. If these are not used, you rule will match _every_
string that contains what you specified, this could be the whole file!

## To do
* a lot of optimisation
* being able to share rules across several tokenizers
    (although this can be achieved through inheritance)
* probably more hooks
* more checking

## License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2012 Florent Jaby

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
