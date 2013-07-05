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

exports['test ignore tokens'] = function(test) {
  var t = tokenizer();
  t.addRule(/^(\s)+$/, 'whitespace');
  t.ignore('whitespace');
  test.expect(0);
  t.on('data', test.fail.bind(test, "We should not get any data"));
  t.on('end', test.done.bind(test));
  t.end(' \n\r\t');
}.withDomain();

exports['test numbers'] = function(test) {
  var numbers = [8, 1000, 34.5];
  var t = tokenizer();
  t.addRule(/^\d+(\.\d+)?$/, 'number');
  t.addRule(/^\d+\.$/, 'maybe-float');
  t.addRule(/^(\s)+$/, 'whitespace');
  t.ignore('whitespace');
  test.expect(3 * 2);
  t.on('data', function(token, type) {
    test.equal('number', type);
    test.equal(token , numbers.shift(), "We should get the values we input");
  });
  t.on('end', test.done.bind(test));
  t.end(numbers.join(' '));
}.withDomain();

exports['test comma separated numbers'] = function(test) {
  var numbers = [8, 1000, 34.5];
  var t = tokenizer();
  t.addRule(/^\d+(\.\d+)?$/, 'number');
  t.addRule(/^\d+\.$/, 'maybe-float');
  t.addRule(/^(\s)+$/, 'whitespace');
  t.addRule(/^,$/, 'comma');
  t.ignore('whitespace');
  t.ignore('comma');
  test.expect(3 * 2);
  t.on('data', function(token, type) {
    test.equal('number', type);
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
  t.addRule(/^(\s)+$/, 'whitespace');
  t.ignore('whitespace');
  test.expect(1 * 2);
  t.on('data', function(token, type) {
    test.equal('string', type);
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
  t.addRule(/^(\s)+$/, 'whitespace');
  t.ignore('whitespace');
  t.ignore('pipe');
  test.expect(3 * 2);
  t.on('data', function(token, type) {
    test.equal('string', type);
    test.equal(token , JSON.stringify(strings.shift()), "We should get the values we input");
  });
  t.on('end', test.done.bind(test));
  t.end(strings.map(JSON.stringify).join('|'));
}.withDomain();
