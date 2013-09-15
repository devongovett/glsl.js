var glsl = require('./glsl');
var SymbolTable = require('./symbol_table');
var ast = require('./ast');
var escodegen = require('escodegen');

function error() {
    throw new SyntaxError(
        [].slice.call(arguments).join(' ') + 
        " on line " + (glsl.lexer.yylineno + 1) + "\n" + 
        glsl.lexer.showPosition()
    );
}

var parser = glsl.parser;

var yy = parser.yy;
yy.error = error;
yy.symbolTable = new SymbolTable();
yy.loopLevel = 0;
for (var key in ast) {
  yy[key] = ast[key];
}

yy.convertArg = function(type, arg) {
    switch (type) {
        case 'vec2':
        case 'vec3':
        case 'vec4':
        case 'mat2':
        case 'mat3':
        case 'mat4':
        case 'float':
            if (arg.typeof !== 'float' && arg.typeof !== 'int') {
                arg = new ast.UnaryExpression('+', arg);
            }
            
            arg.typeof = 'float';
            return arg;
            
        case 'ivec2':
        case 'ivec3':
        case 'ivec4':
        case 'int':
            if (arg.typeof !== 'int') {
                arg = new ast.BinaryExpression(arg, '|', new ast.Literal(0, arg.typeof));
                arg.typeof = 'int';
            }
            
            return arg;
            
        case 'bvec2':
        case 'bvec3':
        case 'bvec4':
        case 'bool':
            if (arg.typeof !== 'bool') {
                // arg = new yy.CallExpression('Boolean', false, [arg]);
                arg = new ast.UnaryExpression('!', new ast.UnaryExpression('!', arg));
                arg.typeof = 'bool';
            }
            
            return arg;
            
        default:
            error('unsupported construction');
    }
};

exports.parse = function(source) {
  return parser.parse(source);
};

exports.compile = function(source) {
  return escodegen.generate(exports.parse(source));
};

var fs = require('fs');
var source = fs.readFileSync('test.glsl', 'utf8');

console.log(exports.compile(source));