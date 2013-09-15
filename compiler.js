//import "glsl.js"
//import "symbol_table.js"
//import "ast.js"

var fs = require('fs');
var source = fs.readFileSync('test.glsl', 'utf8');

function error() {
    throw new SyntaxError(
        [].slice.call(arguments).join(' ') + 
        " on line " + (glsl.lexer.yylineno + 1) + "\n" + 
        glsl.lexer.showPosition()
    );
}

glsl.yy.symbolTable = new SymbolTable();
glsl.yy.loopLevel = 0;

var root = glsl.parse(source);
// console.log(require('util').inspect(root, false, 50));

console.log(require('escodegen').generate(root));