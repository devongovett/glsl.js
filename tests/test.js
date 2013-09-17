var glsl = require('../compiler');
var assert = require('assert');
var fs = require('fs');

function compare(a, b) {
    assert.equal(a.replace(/[\s\n\r]*/g, ''), b.replace(/[\s\n\r]*/g, ''));
}

describe('glsl', function() {
    
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
        compare(glsl.compile('void main() {}'), fs.readFileSync(__dirname + '/data/boilerplate.js', 'utf8'));
    });
    
});