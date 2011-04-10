# Synopsis
A wide purpose tokenizer for JavaScript. The interface follow more or less
the WriteStream from [node.js](http://nodejs.org).

## How to
* require the Tokenizer constructor
    var Tokenizer = require('tokenizer');
* construct one (we'll see what the callback is used for)
    var t = new Tokenizer(mycallback);
* add rules
    t.addRule(/myawesome regex/, 'type');
* write or pump to it
    t.write(data);
    // or
    stream.pipe(t);
* listen for new tokens
    t.on('token', function(token, type) {
        // do something useful
        // type is the type of the token (specified with addRule)
        // token is the actual matching string
    })
    // alternatively you can listen on the 'data' event
* look out for the end
    t.on('end', callback);

the optional callback argument for the constructor is a function that will
be called for each token in order to specify a different type by returning
a string. The parameters passed to the function are token(the token that we found)
and match, an object like this 
    {
        regex: /whatever/ // the regex that matched the token
        type: 'type' // the type of the token
    }

Have a look in the example folder

## Rules
rules are regular expressions associated with a type name.
The tokenizer tries to find the longest string matching one or more rules.
When several rules match the same string, priority is given to the rule
which was added first. (this may change)

## To do
* a lot of optimisation
* being able to share rules across several tokenizer 
    (although this can be achieved with inheritance)
* probably more hooks
* more checking
