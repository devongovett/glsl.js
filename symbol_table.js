var ast = require('./ast');

function SymbolTable() {
    this.stack = [];
    this.pushScope(); // add global scope
}

function Scope() {}     // an actual JS function scope
function SubScope() {}  // a block scope within a JS scope

SymbolTable.prototype = {
    pushScope: function(isSubScope) {
        var scope = isSubScope ? new SubScope() : new Scope();
        this.stack.push(scope);
    },
    
    popScope: function() {
        this.stack.pop();
    },
    
    checkGlobal: function(msg) {
        if (this.stack.length > 1)
            ast.error(msg, "only allowed in global scope");
    },
    
    add: function(symbol) {
        var scope = this.stack[this.stack.length - 1];
        var name = symbol.id ? symbol.id.name : symbol.name;
        
        if (!scope[name]) {
            scope[name] = [];
        } else if (symbol instanceof ast.FunctionDeclaration) {
            for (var i = 0; i < scope[name].length; i++) {
                if (scope[name][i].equals(symbol)) {
                    if (symbol.returnType !== scope[name][i].returnType)
                        ast.error('Overloaded functions must have the same return type');
                        
                    if (scope[name][i].body)
                        ast.error("Function", name, "already has a body");
                            
                    symbol.id = scope[name][i].id;
                    scope[name][i] = symbol;
                    return symbol;
                }
            }
            
            // generate a mangled name using the '$' character since
            // it is not allowed in GLSL but is in JS
            symbol.id.name += '$' + scope[name].length;
        } else {            
            ast.error("Redeclaration of identifier", name);
        }
        
        if (scope instanceof SubScope) {
            // find closest function scope
            var count = 0;
            for (var i = this.stack.length - 2; i >= 0; i--) {
                var cur = this.stack[i];
                if (cur[name]) count++;
                if (cur instanceof Scope) break;
            }
            
            if (count > 0) {
                symbol.id.name += '$' + count;
            }
        }
        
        if (symbol instanceof ast.VariableDeclarator && this.stack[0][name]) { // TODO: function params
            var list = this.stack[0][name];
            for (var i = 0; i < list.length; i++) {
                if (list[i] instanceof ast.FunctionDeclaration) {
                    symbol.id.name += '$';
                    break;
                }
            }
        }
        
        scope[name].push(symbol);
        return symbol;
    },
    
    findVariable: function(name) {
        for (var i = this.stack.length - 1; i >= 0; i--) {
            var scope = this.stack[i];
            if (scope[name]) {
                for (var i = 0; i < scope[name].length; i++) {
                    if (scope[name][i] instanceof ast.VariableDeclarator || scope[name][i] instanceof ast.Identifier)
                        return scope[name][i];
                }
                
                return scope[name][0];
            }
        }
        
        return null;
    },
    
    findFunction: function(fn) {
        // functions can only be declared in the global scope
        var list = this.stack[0][fn.callee.name];
        
        if (list) {
            for (var i = 0; i < list.length; i++) {
                if (!(list[i] instanceof ast.FunctionDeclaration)) continue;
                if (list[i].params.length !== fn.arguments.length) continue;
                for (var j = 0; j < list[i].params.length; j++) {
                    if (list[i].params[j].typeof !== fn.arguments[j].typeof) break;
                }
                
                if (j === list[i].params.length)
                    return list[i];
            }
        }
        
        return null;
    },
    
    findType: function(name) {
        for (var i = this.stack.length - 1; i >= 0; i--) {
            var scope = this.stack[i];
            if (scope[name]) {
                for (var i = 0; i < scope[name].length; i++) {
                    if (scope[name][i] instanceof ast.StructureDeclaration)
                        return scope[name][i];
                }
                
                return null;
            }
        }
        
        return null;
    }
};

module.exports = SymbolTable;