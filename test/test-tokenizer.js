var tokenizer = require('../');
var domain = require('domain');

Function.prototype.withDomain = function(withStack) {
  var fn = this;
  return function(test) {
    var d = domain.create();
    d.on('error', function(e) {
      test.fail('test failed with ' + e.message);
      if(withStack) {
        console.error(e.stack)
      }
      test.done();
    });
    d.run(fn.bind(this, test));
  }
}

exports['test empty'] = function(test) {
  var t = tokenizer();
  t.on('data', test.fail.bind(test, "No data should be emitted"));
  t.on('end', test.done.bind(test));
  t.end('');
}.withDomain();

exports['test emits error when no rules'] = function (test) {
  var t = tokenizer();
  test.expect(1);
  t.on('error', function (err) {
    test.ok(err instanceof SyntaxError, "We should get a syntax error");
    test.done();
  });
  t.end('Hello World!');
}.withDomain()

exports['calling toString on tokens'] = function (test) {
  var t = tokenizer();
  t.addRule('number');
  t.addRule('whitespace');
  test.expect(3 * 2);
  t.on('data', function(token, type) {
    test.doesNotThrow(function () {
      token.toString();
    });
    test.equal(token.content, token.toString());
  });
  t.on('end', test.done.bind(test));
  t.end('8 10');
}

exports['test ignore tokens'] = function(test) {
  var t = tokenizer();
  t.addRule('whitespace');
  t.ignore('whitespace');
  test.expect(0);
  t.on('data', test.fail.bind(test, "We should not get any data"));
  t.on('end', test.done.bind(test));
  t.end(' \n\r\t');
}.withDomain();

exports['test ignore array of tokens'] = function(test) {
  var t = tokenizer();
  t.addRule('whitespace');
  t.addRule('number');
  t.ignore(['whitespace', 'number']);
  test.expect(0);
  t.on('data', test.fail.bind(test, "We should not get any data"));
  t.on('end', test.done.bind(test));
  t.end('8 67\n45\t10000');
}.withDomain();


exports['add built-in rules by name'] = function (test) {
  var t = tokenizer();
  test.expect(1);
  t.on('token', function(token, type) {
    test.equal('whitespace', type);
    test.done();
  });
  t.addRule('whitespace');
  t.end(' ');
}

exports['call addRule with no arguments throws'] = function (test) {
  var t = tokenizer();
  test.throws(function () {
    t.addRule();
  });
  test.done();
}

exports['test numbers'] = function(test) {
  var numbers = [8, 1000, 34.5];
  var t = tokenizer();
  t.addRule('number');
  t.addRule(/^\d+\.$/, 'maybe-float');
  t.addRule('whitespace');
  t.ignore('whitespace');
  test.expect(3 * 2);
  t.on('data', function(token) {
    test.equal('number', token.type);
    test.equal(token , numbers.shift(), "We should get the values we input");
  });
  t.on('end', test.done.bind(test));
  t.end(numbers.join(' '));
}.withDomain();


exports['test comma separated numbers'] = function(test) {
  var numbers = [8, 1000, 34.5];
  var t = tokenizer();
  t.addRule('number');
  t.addRule(/^\d+\.$/, 'maybe-float');
  t.addRule('whitespace');
  t.addRule(/^,$/, 'comma');
  t.ignore('whitespace');
  t.ignore('comma');
  test.expect(3 * 2);
  t.on('data', function(token) {
    test.equal('number', token.type);
    test.equal(token , numbers.shift(), "We should get the values we input");
  });
  t.on('end', test.done.bind(test));
  t.end(numbers.join(','));
}.withDomain();

exports['test citation'] = function(test) {
  var string = "Hello, \" [ {height: 8}]";
  var t = tokenizer();
  t.addRule(/^"([^"]|\\")*"$/, 'string');
  t.addRule(/^"([^"]|\\")*$/, 'maybe-string'); // same as above without the ending "
  t.addRule('whitespace');
  t.ignore('whitespace');
  test.expect(1 * 2);
  t.on('data', function(token) {
    test.equal('string', token.type);
    test.equal(token , JSON.stringify(string), "We should get the values we input");
  });
  t.on('end', test.done.bind(test));
  t.end(JSON.stringify(string));
}.withDomain();

exports['test pipe separated citations'] = function(test) {
  var strings = ["Hello, \" [ {height: 8}]", "haha 안녕,; :! {fdf} ' \' \"", "HE|Y"];
  var t = tokenizer();
  t.addRule(/^"([^"]|\\")*"$/, 'string');
  t.addRule(/^"([^"]|\\")*$/, 'maybe-string'); // same as above without the ending "
  t.addRule(/^\|$/, 'pipe');
  t.addRule('whitespace');
  t.ignore('whitespace');
  t.ignore('pipe');
  test.expect(3 * 2);
  t.on('data', function(token) {
    test.equal('string', token.type);
    test.equal(token , JSON.stringify(strings.shift()), "We should get the values we input");
  });
  t.on('end', test.done.bind(test));
  t.end(strings.map(JSON.stringify).join('|'));
}.withDomain();

exports['words in two chunks'] = function(test) {
  var strings = ["Hello", "World"];
  var t = tokenizer();
  t.addRule('word');
  t.addRule('whitespace');
  t.ignore('whitespace');
  test.expect(2 * 2);
  t.on('data', function(token) {
    test.equal('word', token.type);
    test.equal(token , strings.shift(), "We should get the values we input");
  });
  t.on('end', test.done.bind(test));
  t.write('Hell');
  t.end('o World');
}.withDomain();

exports['verify regex priority order and that longest matches first'] = function(test) {
  //Test case built for a tokenizer I was building that was supposed to parse SLIM template code but was not working.
  var t = tokenizer(undefined, {split: /^\r?\n+$/});
  t.addRule(/^([a-zA-Z0-9\-_]+\s*=\s*)(["'])(\\\2|[^"']+)*?\2$/, 'tKeyValue');  // name='value'
  t.addRule(/^[a-zA-Z0-9\-_]+$/, 'tIdentifier');                                // name
  t.addRule(/^[#][a-zA-Z0-9\-_]+$/, 'tIdName');                                 // #name
  t.addRule(/^\.[a-zA-Z0-9\-_]+$/, 'tClassName');                               // .name
  t.addRule('whitespace');
  t.ignore('whitespace');

  var expectations = ['tIdentifier', 'tIdName', 'tClassName', 'tKeyValue', 'tKeyValue'];

  t.on('data', function(token) {
    var e = expectations.shift();

    test.equal(e, token.type);
  });
  
  t.on('end', test.done.bind(test));
  t.write('tag#id.class var1 = \'value1\' var2 = \'value2\'');
  t.end();
}.withDomain();