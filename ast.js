var glsl = require('./glsl').parser;

// Throws errors with line number info
function error() {
    throw new SyntaxError(
        [].slice.call(arguments).join(' ') + 
        " on line " + (glsl.lexer.yylineno + 1) + "\n" + 
        glsl.lexer.showPosition()
    );
}

exports.error = error;

/*
 * A complete program source tree.
 */
function Program(body) {
    this.type = "Program";
    body = body || [];
    
    // add asm.js directive
    this.block = new BlockStatement(body);
    var header = [
      new ExpressionStatement(
        new Literal("use asm")
      ),
      new VariableDeclaration('int', [
        new VariableDeclarator('$$STACKTOP', new Literal(0))
      ])
    ];
    
    var heapTypes = {
      STACK_I: 'Int32Array',
      STACK_F: 'Float32Array'
    };
    
    for (var name in heapTypes) {
      header.push(
        new VariableDeclaration(null, [
          new VariableDeclarator('$$' + name, 
            new NewExpression(
              new MemberExpression(
                  new Identifier('stdlib'),
                  new Identifier(heapTypes[name])
              ),
              [new Identifier('stack')]
            )
          )
        ])
      );
    }
    
    this.block.body.unshift.apply(this.block.body, header);
    
    // export the main function from the wrapper
    this.block.addStatement(
      new ReturnStatement(
        new ObjectExpression(null, [
          new Property(
            new Identifier('main'),
            new Identifier('main')
          )
        ])
      )
    );
    
    // create wrapper function for asm.js
    this.body = [
      new VariableDeclaration(null, [
        new VariableDeclarator('gl', 
          new CallExpression(
            {
              type: 'FunctionExpression',
              id: null,
              body: this.block,
              params: [
                new Identifier('stdlib'),
                new Identifier('env'),
                new Identifier('stack')
              ]
            }, [
              new ObjectExpression(null, [
                new Property(
                  new Identifier('Math'),
                  new Identifier('Math')
                ),
                new Property(
                  new Identifier('Int32Array'),
                  new Identifier('Int32Array')
                ),
                new Property(
                  new Identifier('Float32Array'),
                  new Identifier('Float32Array')
                )
              ]),
              new ObjectExpression(),
              new NewExpression('ArrayBuffer', [new Literal(4096)])
            ]
          )
        )
      ])
    ];
}

Program.prototype.addStatement = function(statement) {
    this.block.push(statement);
}

exports.Program = Program;

/*
 * A block statement, i.e., a sequence of statements surrounded by braces.
 */
function BlockStatement(body) {
    this.type = "BlockStatement";
    this.body = body || [];
}

BlockStatement.prototype.addStatement = function(statement) {
    this.body.push(statement);
}

exports.BlockStatement = BlockStatement;

/*
 * An expression statement, i.e., a statement consisting of a single expression.
 */
function ExpressionStatement(expression) {
    this.type = "ExpressionStatement";
    this.expression = expression;
}

exports.ExpressionStatement = ExpressionStatement;

/*
 * An if statement
 * consequent and alternate are Statements
 */
function IfStatement(test, consequent, alternate) {
    this.type = "IfStatement";
    this.test = test;
    this.consequent = consequent;
    this.alternate = alternate;
    
    if (test.typeof !== 'bool' || test.isArray)
        error('boolean expression expected');
}

exports.IfStatement = IfStatement;

function BreakStatement() {
    this.type = "BreakStatement";
}

exports.BreakStatement = BreakStatement;

function ContinueStatement() {
    this.type = "ContinueStatement";
}

exports.ContinueStatement = ContinueStatement;

function ReturnStatement(arg) {
    this.type = "ReturnStatement";
    // this.argument = arg;
    
    if (arg.typeof == 'int') {
      
    }
    
    this.argument = arg;
}

exports.ReturnStatement = ReturnStatement;

function WhileStatement(test, body) {
    this.type = "WhileStatement";
    this.test = test;
    this.body = body;
    
    if (test.typeof !== 'bool' || test.isArray)
        error('boolean expression expected');
}

exports.WhileStatement = WhileStatement;

function DoWhileStatement(test, body) {
    this.type = "DoWhileStatement";
    this.test = test;
    this.body = body;
    
    if (test.typeof !== 'bool' || test.isArray)
        error('boolean expression expected');
}

exports.DoWhileStatement = DoWhileStatement;

/*
 * A for statement.
 *  init: VariableDeclaration | Expression
 *  test: Expression | null
 *  update: Expression | null
 *  body: Statement
 */
function ForStatement(init, test, update, body) {
    this.type = "ForStatement";
    this.init = init;
    this.test = test;
    this.update = update
    this.body = body;
    
    if (test.typeof !== 'bool' || test.isArray)
        error('boolean expression expected');
}

exports.ForStatement = ForStatement;

function FunctionDeclaration(type, name, params, body) {
    this.type = "FunctionDeclaration";
    this.id = name ? new Identifier(name) : null;
    this.params = params || [];
    this.body = body;
    this.returnType = type;
    
    if (name == 'main') {
      if (type !== 'void')
        error('main function must return void');
        
      if (this.params.length !== 0)
        error('main function cannot accept any arguments');
    }
}

FunctionDeclaration.prototype = {
  equals: function(other) {
    if (!(other instanceof FunctionDeclaration))
        return false;
                        
    if (this.params.length !== other.params.length)
        return false;
        
    for (var i = 0; i < this.params.length; i++) {
        if (this.params[i].typeof !== other.params[i].typeof)
            return false;
    }
    
    return true;
  },
  
  setBody: function(body) {
    // generate asm.js type annotations
    var block = body.body;
    for (var i = 0; i < this.params.length; i++) {
      var expression = null;
      switch (this.params[i].typeof) {
        case 'int':
          expression = new BinaryExpression(this.params[i], '|', new Literal(0, 'int'));
          break;
        case 'float':
          expression = new UnaryExpression('+', this.params[i]);
          break;
      }
      
      if (expression) {
        block.unshift(
          new ExpressionStatement(
            new AssignmentExpression(
              this.params[i],
              '=',
              expression
            )
          )
        );
      }
    }
    
    this.body = body;
  }
};

exports.FunctionDeclaration = FunctionDeclaration;

// Not used in resulting AST, only internally
function StructureDeclaration(name, fields) {
    this.name = name;
    this.fields = fields || {};
}

exports.StructureDeclaration = StructureDeclaration;

/*
 * A set of variable declarations
 */
function VariableDeclaration(type, declarations) {
    this.type = "VariableDeclaration";
    this.kind = "var"; // TODO: use const
    this.declarations = declarations || [];
    this.typeof = type;
}

exports.VariableDeclaration = VariableDeclaration;

function VariableDeclarator(name, value, arraySize) {
    this.type = "VariableDeclarator";
    this.id = new Identifier(name);
    this.init = null;
    this.arraySize = arraySize || 0;
    this.isArray = this.arraySize > 0;
    this.typeof = null;
    
    // apply logic from AssignmentExpression if an initializer was given
    if (value != null) {
        if (value instanceof ArrayExpression)
            this.init = value.generateStack();
        else
            this.init = AssignmentExpression.create(new Identifier(name, value.typeof), '=', value).right;
    }
}

VariableDeclarator.defaults = {
    int: 0, float: 0.0, bool: false
};

VariableDeclarator.prototype.initDefault = function(type) {
    this.typeof = type;
    
    if (!this.init) {
        // mat3 -> [vec3(0.0), vec3(0.0), vec3(0.0)]
        // vec3 -> Float32Array(3);
        if (this.isArray) {
            var types = {
                float: 'Float32Array',
                int: 'Int32Array'
            };
            
            var arrayType = types[type] || 'Array';
            if (!arrayType)
                error('Unimplemented array declaration');
            
            this.init = new NewExpression(arrayType, [new Literal(this.arraySize)], type);
        } else if (/vec/.test(type)) {
            var count = Expression.prototype._types[type];
            var arg = new Literal(0, Expression.prototype._componentTypes[type])
            var args = [];
            for (var i = 0; i < count; i++)
                args.push(arg);
                
            this.init = new ArrayExpression(type, args).generateStack();
        } else if (type in VariableDeclarator.defaults) {    
            this.init = new Literal(VariableDeclarator.defaults[type], type);
        }
    }
}

exports.VariableDeclarator = VariableDeclarator;

function Expression() {}
Expression.prototype = {
    toConstant: function() {
        return null;
    },
    
    _types: {
        vec2:  2, vec3:  3, vec4:  4,
        ivec2: 2, ivec3: 3, ivec4: 4,
        bvec2: 2, bvec3: 3, bvec4: 4,
        mat2:  4, mat3:  9, mat4: 16,
        float: 1, int:   1, bool:  1
    },
    
    isVector: function() {
        return /vec/.test(this.typeof); // TODO: possibly dangerous e.g. struct types
    },
    
    isMatrix: function() {
        return /mat/.test(this.typeof);
    },
    
    isScalar: function() {
        return !this.isVector() && !this.isMatrix() && !this.isArray;// && this.typeof !== 'bool';
    },
    
    componentCount: function() {
        return this.arraySize || this._types[this.typeof];
    },
    
    _componentTypes: {
         vec2: 'float', vec3: 'float', vec4: 'float',
        ivec2: 'int',  ivec3: 'int',  ivec4: 'int',
        bvec2: 'bool', bvec3: 'bool', bvec4: 'bool',
         // mat2: 'vec2',  mat3: 'vec3',  mat4: 'vec4',
        float: 'float',  int: 'int',   bool: 'bool'
    },
    
    componentType: function() {
        return this.isArray ? this.typeof : this._componentTypes[this.typeof];
    },
    
    componentIndex: function(index) {
        return index == 0 ? this : new BinaryExpression(this, '+', new Literal(index, this.typeof));
    },
    
    getComponent: function(index) {
        if (this.isScalar())
            return this;
            
        var type = this.componentType();
        var stack = new Identifier('$$STACK_' + type[0].toUpperCase(), type);
        
        var ret = new MemberExpression(stack, this.componentIndex(index), true);
        ret.typeof = type;
        
        return ret;
    }
};

exports.Expression = Expression;

/*
 * Represents arrays, vectors, and matrices
 */
function ArrayExpression(type, elements) {
    this.type = "ArrayExpression";
    this.elements = elements || [];
    this.typeof = type;
}

ArrayExpression.prototype = new Expression;
ArrayExpression.prototype.getComponent = function(index) {
    return this.elements[index];
};

ArrayExpression.prototype.generateStack = function() {
    var list = [];
    var type = this.componentType();
    var stack = new Identifier('$$STACK_' + type[0].toUpperCase(), type);
    var stackTop = new UpdateExpression('++', new Identifier('$$STACKTOP'));
    
    for (var i = 0; i < this.elements.length; i++) {
        // $$STACK_T[$$STACKTOP++] = element
        list.push(new AssignmentExpression(
            new MemberExpression(
                stack,
                stackTop,
                true
            ),
            '=',
            this.elements[i]
        ));
    }
    
    list.push(new BinaryExpression(new Identifier('$$STACKTOP'), '-', new Literal(this.elements.length)));
    var ret = new SequenceExpression(list);
    ret.typeof = this.typeof;
    return ret;
};

exports.ArrayExpression = ArrayExpression;

function NewExpression(callee, arguments, type) {
    this.type = "NewExpression";
    this.callee = typeof callee == 'string' ? new Identifier(callee) : callee;
    this.arguments = arguments || [];
    this.typeof = type;
}

NewExpression.prototype = new Expression;
exports.NewExpression = NewExpression;

function ObjectExpression(type, properties) {
    this.type = "ObjectExpression";
    this.properties = properties || [];
    this.typeof = type;
}

ObjectExpression.prototype = new Expression;
exports.ObjectExpression = ObjectExpression;

function Property(key, value) {
    this.type = "Property";
    this.kind = "init";
    this.key = key;     // Literal | Identifier
    this.value = value; // Expression
}

exports.Property = Property;

function SequenceExpression(expressions) {
    this.type = "SequenceExpression";
    this.expressions = expressions || [];
    this.typeof = this.expressions.length ? this.expressions[this.expressions.length - 1].typeof : null;
}

SequenceExpression.prototype = new Expression;
exports.SequenceExpression = SequenceExpression;

// "-" | "+" | "!"
function UnaryExpression(operator, argument) {
    this.type = "UnaryExpression";
    this.operator = operator;
    this.argument = argument;
    this.typeof = argument.typeof;
}

UnaryExpression.create = function(operator, argument) {
    if (argument.isArray)
        error('Cannot apply operation', operator, 'to an array');
    
    var type = argument.componentType();
    if ((operator === '+' || operator === '-') && !(type === 'int' || type === 'float'))
        error('Cannot apply operation', operator, 'to argument of type', argument.typeof);
        
    if (operator === '!' && type !== 'bool')
        error('Cannot apply operation', operator, 'to argument of type', argument.typeof);
    
    if (argument.isVector()) {
        var count = argument.componentCount();
        var args = [];
        for (var i = 0; i < count; i++) {
            args.push(new UnaryExpression(operator, argument.getComponent(i)));
        }
        
        return new ArrayExpression(argument.typeof, args);
    }
    
    return new UnaryExpression(operator, argument);
}

UnaryExpression.prototype = new Expression;
UnaryExpression.prototype.toConstant = function() {
    var arg = this.argument.toConstant();
    if (arg == null)
        return null;
        
    return eval(this.operator + arg); // TODO: get rid of eval???
}

exports.UnaryExpression = UnaryExpression;

/*
 * "==" | "!=" | "<" | "<=" | ">" | ">=" | "+" | "-" | "*" | "/"
 */
function BinaryExpression(left, operator, right) {
    this.type = "BinaryExpression";
    this.left = left
    this.operator = operator;
    this.right = right;
    
    this.typeof = operator in BinaryExpression.boolTypes ? 'bool' : left.typeof;
    if (left.typeof !== right.typeof)
        error('Left and right arguments are of differing types');
        
    if (left.isArray || right.isArray)
        error('Cannot apply operation', operator, 'to an array');
}

BinaryExpression.create = function(left, operator, right) {
    if (left.isVector() || right.isVector()) {
        if (operator in BinaryExpression.scalarTypes)
            error('Cannot apply operation', operator, 'to a non-scalar');
        
        if (left.isVector() && right.isVector() && left.typeof !== right.typeof)
            error('vector types do not match');
            
        var count = Math.max(left.componentCount(), right.componentCount());
        var args = [];
        for (var i = 0; i < count; i++) {
            args.push(new BinaryExpression(left.getComponent(i), operator, right.getComponent(i)));
        }
        
        if (operator in BinaryExpression.boolTypes) {
            var left = new LogicalExpression(args[0], '&&', args[1]);
            for (var i = 2; i < count; i++) {
                left = new LogicalExpression(left, '&&', args[i]);
            }
            
            return left;
        } else {
            var type = left.isVector() ? left.typeof : right.typeof;
            return new ArrayExpression(type, args);
        }
    }
    
    return new BinaryExpression(left, operator, right);
}

BinaryExpression.boolTypes = {
    '===': true, '!==': true, '<': true, '<=': true, '>': true, '>=': true
};

BinaryExpression.scalarTypes = {
    '<': true, '<=': true, '>': true, '>=': true
};

BinaryExpression.prototype = new Expression;
BinaryExpression.prototype.toConstant = function() {
    var left = this.left.toConstant();
    var right = this.right.toConstant();
    if (left == null || right == null)
        return null;
        
    return eval(left + this.operator + right); // TODO: get rid of eval???
}

exports.BinaryExpression = BinaryExpression;

/*
 * "=" | "+=" | "-=" | "*=" | "/="
 */
function AssignmentExpression(left, operator, right) {
    this.type = "AssignmentExpression";
    this.left = left
    this.operator = operator;
    this.right = right;
    
    this.typeof = left.typeof;
    if (left.typeof !== right.typeof)
        error('Left and right arguments are of differing types');
        
    if (left.isArray || right.isArray)
        error('Cannot apply operation', operator, 'to an array');
        
    if (!(left instanceof Identifier || left instanceof MemberExpression))
        error('Cannot assign to a non-identifier');
}

AssignmentExpression.prototype = new Expression;
AssignmentExpression.create = function(left, operator, right) {
    if (right.isScalar())
        return new AssignmentExpression(left, operator, right);
        
    if (left.typeof !== right.typeof)
        error('Left and right arguments are of differing types');
        
    var count = left.componentCount();
    var args = [];
    var offsets = {};
    for (var i = 0; i < count; i++) {
      if (left instanceof Swizzle) {    
          if (offsets[left.offsets[i]])
              error('Cannot assign to swizzle with duplicate components');
  
          offsets[left.offsets[i]] = true;
      }
      args.push(new AssignmentExpression(left.getComponent(i), operator, right.getComponent(i)));
    }

    args.push(left.componentIndex(0));
    return new SequenceExpression(args);
}

exports.AssignmentExpression = AssignmentExpression;

// "++" | "--"
function UpdateExpression(operator, argument, prefix) {
    this.type = "UpdateExpression";
    this.operator = operator;
    this.prefix = !!prefix;
    this.argument = argument;
    
    this.typeof = argument.typeof;
    if (argument.componentType() === 'bool')
        error('Cannot update argument of type', argument.typeof);
        
    if (argument.isArray)
        error('Cannot apply operation', operator, 'to an array');
        
    if (!(argument instanceof Identifier || argument instanceof MemberExpression))
        error('Cannot update a non-identifier');
}

UpdateExpression.prototype = new Expression;
UpdateExpression.create = function(operator, argument, prefix) {
    if (argument.isVector()) {
        var count = argument.componentCount();
        var args = [];
        for (var i = 0; i < count; i++) {
            args.push(new UpdateExpression(operator, argument.getComponent(i), prefix));
        }
        
        return new ArrayExpression(argument.typeof, args);
    }
    
    return new UpdateExpression(operator, argument, prefix);
}

exports.UpdateExpression = UpdateExpression;

// "||" | "&&"
function LogicalExpression(left, operator, right) {
    this.type = "LogicalExpression";
    this.left = left
    this.operator = operator;
    this.right = right;
    this.typeof = 'bool';
    
    if (left.typeof !== 'bool' || right.typeof !== 'bool')
        error('Logical expression requires boolean arguments');
        
    if (left.isArray || right.isArray)
        error('Cannot apply operation', operator, 'to an array');
}

LogicalExpression.prototype = new Expression;
exports.LogicalExpression = Expression;

function ConditionalExpression(test, consequent, alternate) {
    this.type = "ConditionalExpression";
    this.test = test;
    this.alternate = alternate;
    this.consequent = consequent;
    
    this.typeof = consequent.typeof;
    if (consequent.typeof !== alternate.typeof)
        error('Consequent and alternate must return the same types');
        
    if (test.typeof !== 'bool' || test.isArray)
        error('boolean expression required');
}

ConditionalExpression.prototype = new Expression;
exports.ConditionalExpression = ConditionalExpression;

function CallExpression(callee, arguments) {
    this.type = "CallExpression";
    this.callee = typeof callee === 'string' ? new Identifier(callee) : callee;
    this.arguments = arguments || [];
    this.isConstructor = false;
    this.typeof = null;
}

CallExpression.prototype = new Expression;
CallExpression.prototype.addArgument = function(arg) {
    if (arg instanceof ArrayExpression)
        arg = arg.generateStack();
        
    this.arguments.push(arg);
}

exports.CallExpression = CallExpression;

/*
 * A member expression.
 * If computed === true, the node corresponds to a computed e1[e2] expression and property 
 * is an Expression. If computed === false, the node corresponds to a static e1.x expression 
 * and property is an Identifier.
 */
function MemberExpression(object, property, computed) {
    this.type = "MemberExpression";
    this.object = object;
    this.property = property;
    this.computed = computed || false;
    this.typeof = object.typeof;
}

MemberExpression.prototype = new Expression;
exports.MemberExpression = MemberExpression;

function Identifier(name, type, arraySize) {
    this.type = "Identifier";
    this.name = name;
    this.typeof = type;
    this.arraySize = arraySize || 0;
    this.isArray = this.arraySize > 0;
}

Identifier.prototype = new Expression;
exports.Identifier = Identifier;

function Literal(value, type) {
    this.type = "Literal";
    this.value = value;
    this.typeof = type;
    
    // TODO: improve. this is the only way we have right now to 
    // generate floating point literals via escodegen
    if (type === 'float' && String(value).indexOf('.') === -1) {
        this.verbatim = String(value) + '.0';
    }
    
    // Make booleans into integers (for asm.js)
    if (type === 'bool') {
        this.value = +value;
    }
}

Literal.prototype = new Expression;
Literal.prototype.toConstant = function() {
    return this.value;
}

exports.Literal = Literal;

// only used internally, not part of the resulting AST
function Swizzle(vector, offsets) {
    this.vector = vector;
    this.offsets = offsets;
    this.typeof = offsets.length === 1 ? vector.componentType() : vector.typeof.slice(0, -1) + offsets.length;
}

Swizzle.prototype = new Expression;
Swizzle.prototype.componentIndex = function(index) {
    return this.vector.componentIndex(this.offsets[index]);
}

Swizzle.prototype.getComponent = function(index) {
  return this.vector.getComponent(this.offsets[index]);
}

exports.Swizzle = Swizzle;

// Helper function used to convert types
function convertArg(type, arg) {
    switch (type) {
        case 'vec2':
        case 'vec3':
        case 'vec4':
        case 'mat2':
        case 'mat3':
        case 'mat4':
        case 'float':
            if (arg.typeof !== 'float') {
                arg = new UnaryExpression('+', arg);
            }
            
            arg.typeof = 'float';
            return arg;
            
        case 'ivec2':
        case 'ivec3':
        case 'ivec4':
        case 'int':
            if (arg.typeof !== 'int') {
                arg = new BinaryExpression(arg, '|', new Literal(0, arg.typeof));
                arg.typeof = 'int';
            }
            
            return arg;
            
        case 'bvec2':
        case 'bvec3':
        case 'bvec4':
        case 'bool':
            if (arg.typeof !== 'bool') {
                arg = new UnaryExpression('!', new UnaryExpression('!', arg));
                arg.typeof = 'bool';
            }
            
            return arg;
            
        default:
            error('unsupported construction');
    }
}

exports.convertArg = convertArg;