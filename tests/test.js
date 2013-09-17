var glsl = require('../compiler');
var assert = require('assert');
var fs = require('fs');

var BOILERPLATE = fs.readFileSync(__dirname + '/data/boilerplate.js', 'utf8');

function compare(a, b) {
    assert.equal(a.replace(/[\s\n\r]*/g, ''), b.replace(/[\s\n\r]*/g, ''));
}

function checkMain(a, b) {
    compare(a.split('\n').slice(5, -6).join('\n'), b);
}

describe('main function', function() {
    
    it('should throw an error without a main function', function() {
        assert.throws(function() {
            glsl.compile('');
        }, /Parse error/);
    });
    
    it('should throw an error if main function returns incorrect type', function() {
        assert.throws(function() {
            glsl.compile('int main() {}');
        }, /main function must return void/);
    });
    
    it('should throw an error if main function accepts arguments', function() {
        assert.throws(function() {
            glsl.compile('void main(int a) {}')
        }, /No main function found/);
    });
    
    it('should throw an error if main function doesn\'t have a body', function() {
        assert.throws(function() {
            glsl.compile('void main();');
        }, /No main function found/);
    });
    
    it('should generate asm.js boilerplate', function() {
        compare(glsl.compile('void main() {}'), BOILERPLATE);
    });
    
});

describe('variable declarations', function() {
    
    it('should default ints to 0', function() {
        checkMain(glsl.compile('void main() { int test; }'), 'function main() { var test = 0; }');
    });
    
    it('should default floats to 0.0', function() {
        checkMain(glsl.compile('void main() { float test; }'), 'function main() { var test = (0.0); }');
    });
    
    it('should default bools to 0 (false)', function() {
        checkMain(glsl.compile('void main() { bool test; }'), 'function main() { var test = 0; }');
    });
    
});