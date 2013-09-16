var glsl = require('./glsl').parser;
var SymbolTable = require('./symbol_table');
var ast = require('./ast');
var escodegen = require('escodegen');

var yy = glsl.yy;
for (var key in ast)
  yy[key] = ast[key];

exports.parse = function(source) {
  yy.symbolTable = new SymbolTable();
  yy.loopLevel = 0;
  
  return glsl.parse(source);
};

exports.compile = function(source) {
  return escodegen.generate(exports.parse(source));
};

var fs = require('fs');
var source = fs.readFileSync('test.glsl', 'utf8');

console.log(exports.compile(source));