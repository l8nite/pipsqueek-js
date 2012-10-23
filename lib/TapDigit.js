/*
  Copyright (C) 2011 Ariya Hidayat <ariya.hidayat@gmail.com>
  Copyright (C) 2010 Ariya Hidayat <ariya.hidayat@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of the <organization> nor the
      names of its contributors may be used to endorse or promote products
      derived from this software without specific prior written permission.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

/*jslint sloppy: true */
/*global document:true,window:true */
var TapDigit;
TapDigit = TapDigit || {};

TapDigit.Token = {
    Operator: 'Operator',
    Identifier: 'Identifier',
    Number: 'Number'
};

TapDigit.Lexer = function () {
    var expression = '',
        length = 0,
        index = 0,
        marker = 0,
        T = TapDigit.Token;

    function peekNextChar() {
        var idx = index;
        return ((idx < length) ? expression.charAt(idx) : '\x00');
    }

    function getNextChar() {
        var ch = '\x00',
            idx = index;
        if (idx < length) {
            ch = expression.charAt(idx);
            index += 1;
        }
        return ch;
    }

    function isWhiteSpace(ch) {
        return (ch === '\u0009') || (ch === ' ') || (ch === '\u00A0');
    }

    function isLetter(ch) {
        return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z');
    }

    function isDecimalDigit(ch) {
        return (ch >= '0') && (ch <= '9');
    }

    function createToken(type, value) {
        return {
            type: type,
            value: value,
            start: marker,
            end: index - 1
        };
    }

    function skipSpaces() {
        var ch;

        while (index < length) {
            ch = peekNextChar();
            if (!isWhiteSpace(ch)) {
                break;
            }
            getNextChar();
        }
    }

    function scanOperator() {
        var ch = peekNextChar();
        if ('+-*/()^%=;,'.indexOf(ch) >= 0) {
            return createToken(T.Operator, getNextChar());
        }
        return undefined;
    }

    function isIdentifierStart(ch) {
        return (ch === '_') || isLetter(ch);
    }

    function isIdentifierPart(ch) {
        return isIdentifierStart(ch) || isDecimalDigit(ch);
    }

    function scanIdentifier() {
        var ch, id;

        ch = peekNextChar();
        if (!isIdentifierStart(ch)) {
            return undefined;
        }

        id = getNextChar();
        while (true) {
            ch = peekNextChar();
            if (!isIdentifierPart(ch)) {
                break;
            }
            id += getNextChar();
        }

        return createToken(T.Identifier, id);
    }

    function scanNumber() {
        var ch, number;

        ch = peekNextChar();
        if (!isDecimalDigit(ch) && (ch !== '.')) {
            return undefined;
        }

        number = '';
        if (ch !== '.') {
            number = getNextChar();
            while (true) {
                ch = peekNextChar();
                if (!isDecimalDigit(ch)) {
                    break;
                }
                number += getNextChar();
            }
        }

        if (ch === '.') {
            number += getNextChar();
            while (true) {
                ch = peekNextChar();
                if (!isDecimalDigit(ch)) {
                    break;
                }
                number += getNextChar();
            }
        }

        if (ch === 'e' || ch === 'E') {
            number += getNextChar();
            ch = peekNextChar();
            if (ch === '+' || ch === '-' || isDecimalDigit(ch)) {
                number += getNextChar();
                while (true) {
                    ch = peekNextChar();
                    if (!isDecimalDigit(ch)) {
                        break;
                    }
                    number += getNextChar();
                }
            } else {
                ch = 'character ' + ch;
                if (index >= length) {
                    ch = '<end>';
                }
                throw new SyntaxError('Unexpected ' + ch + ' after the exponent sign');
            }
        }

        if (number === '.') {
            throw new SyntaxError('Expecting decimal digits after the dot sign');
        }

        return createToken(T.Number, number);
    }

    function reset(str) {
        expression = str;
        length = str.length;
        index = 0;
    }

    function next() {
        var token;

        skipSpaces();
        if (index >= length) {
            return undefined;
        }

        marker = index;

        token = scanNumber();
        if (typeof token !== 'undefined') {
            return token;
        }

        token = scanOperator();
        if (typeof token !== 'undefined') {
            return token;
        }

        token = scanIdentifier();
        if (typeof token !== 'undefined') {
            return token;
        }


        throw new SyntaxError('Unknown token from character ' + peekNextChar());
    }

    function peek() {
        var token, idx;

        idx = index;
        try {
            token = next();
            delete token.start;
            delete token.end;
        } catch (e) {
            token = undefined;
        }
        index = idx;

        return token;
    }

    return {
        reset: reset,
        next: next,
        peek: peek
    };
};

TapDigit.Parser = function () {

    var lexer = new TapDigit.Lexer(),
        T = TapDigit.Token;

    function matchOp(token, op) {
        return (typeof token !== 'undefined') &&
            token.type === T.Operator &&
            token.value === op;
    }

    // ArgumentList := Expression |
    //                 Expression ',' ArgumentList
    function parseArgumentList() {
        var token, expr, args = [];

        while (true) {
            expr = parseExpression();
            if (typeof expr === 'undefined') {
                // TODO maybe throw exception?
                break;
            }
            args.push(expr);
            token = lexer.peek();
            if (!matchOp(token, ',')) {
                break;
            }
            lexer.next();
        }

        return args;
    }

    // FunctionCall ::= Identifier '(' ')' ||
    //                  Identifier '(' ArgumentList ')'
    function parseFunctionCall(name) {
        var token, args = [];

        token = lexer.next();
        if (!matchOp(token, '(')) {
            throw new SyntaxError('Expecting ( in a function call "' + name + '"');
        }

        token = lexer.peek();
        if (!matchOp(token, ')')) {
            args = parseArgumentList();
        }

        token = lexer.next();
        if (!matchOp(token, ')')) {
            throw new SyntaxError('Expecting ) in a function call "' + name + '"');
        }

        return {
            'FunctionCall' : {
                'name': name,
                'args': args
            }
        };
    }

    // Primary ::= Identifier |
    //             Number |
    //             '(' Assignment ')' |
    //             FunctionCall
    function parsePrimary() {
        var token, expr;

        token = lexer.peek();

        if (typeof token === 'undefined') {
            throw new SyntaxError('Unexpected termination of expression');
        }

        if (token.type === T.Identifier) {
            token = lexer.next();
            if (matchOp(lexer.peek(), '(')) {
                return parseFunctionCall(token.value);
            } else {
                return {
                    'Identifier': token.value
                };
            }
        }

        if (token.type === T.Number) {
            token = lexer.next();
            return {
                'Number': token.value
            };
        }

        if (matchOp(token, '(')) {
            lexer.next();
            expr = parseAssignment();
            token = lexer.next();
            if (!matchOp(token, ')')) {
                throw new SyntaxError('Expecting )');
            }
            return {
                'Expression': expr
            };
        }

        throw new SyntaxError('Parse error, can not process token ' + token.value);
    }

    // Unary ::= Primary |
    //           '-' Unary
    function parseUnary() {
        var token, expr;

        token = lexer.peek();
        if (matchOp(token, '-') || matchOp(token, '+')) {
            token = lexer.next();
            expr = parseUnary();
            return {
                'Unary': {
                    operator: token.value,
                    expression: expr
                }
            };
        }

        return parsePrimary();
    }

    // Multiplicative ::= Unary |
    //                    Multiplicative '*' Unary |
    //                    Multiplicative '/' Unary
    function parseMultiplicative() {
        var token, left, right;

        left = parseUnary();
        token = lexer.peek();
        if (matchOp(token, '*') || matchOp(token, '/')) {
            token = lexer.next();
            right = parseMultiplicative();
            return {
                'Binary': {
                    operator: token.value,
                    left: left,
                    right: right
                }
            };
        }
        return left;
    }

    // Additive ::= Multiplicative |
    //              Additive '+' Multiplicative |
    //              Additive '-' Multiplicative
    function parseAdditive() {
        var token, left, right;

        left = parseMultiplicative();
        token = lexer.peek();
        if (matchOp(token, '+') || matchOp(token, '-')) {
            token = lexer.next();
            right = parseAdditive();
            return {
                'Binary': {
                    operator: token.value,
                    left: left,
                    right: right
                }
            };
        }
        return left;
    }

    // Assignment ::= Identifier '=' Assignment |
    //                Additive
    function parseAssignment() {
        var token, expr;

        expr = parseAdditive();

        if (typeof expr !== 'undefined' && expr.Identifier) {
            token = lexer.peek();
            if (matchOp(token, '=')) {
                lexer.next();
                return {
                    'Assignment': {
                        name: expr,
                        value: parseAssignment()
                    }
                };
            }
            return expr;
        }

        return expr;
    }

    // Expression ::= Assignment
    function parseExpression() {
        return parseAssignment();
    }

    function parse(expression) {
        var expr, token;

        lexer.reset(expression);
        expr = parseExpression();

        token = lexer.next();
        if (typeof token !== 'undefined') {
            throw new SyntaxError('Unexpected token ' + token.value);
        }

        return {
            'Expression': expr
        };
    }

    return {
        parse: parse
    };
};

TapDigit.Constants = {
    pi: 3.1415926535897932384,
    phi: 1.6180339887498948482
};

TapDigit.Functions = {
    abs: Math.abs,
    acos: Math.acos,
    asin: Math.asin,
    atan: Math.atan,
    ceil: Math.ceil,
    cos: Math.cos,
    exp: Math.exp,
    floor: Math.floor,
    ln: Math.ln,
    pow: Math.pow,
    random: Math.random,
    sin: Math.sin,
    sqrt: Math.sqrt,
    tan: Math.tan
};

TapDigit.Context = function () {
    var storage = {};

    this.get = function (identifier) {
        return storage[identifier];
    };

    this.set = function (identifier, value) {
        storage[identifier] = value;
    };

    this.has = function (identifier) {
        return storage.hasOwnProperty(identifier);
    };
};

TapDigit.Evaluator = function (ctx) {

    var parser = new TapDigit.Parser(),
        context = (arguments.length < 1) ? new TapDigit.Context() : ctx;

    function exec(node) {
        var left, right, expr, args, i;

        if (node.hasOwnProperty('Expression')) {
            return exec(node.Expression);
        }

        if (node.hasOwnProperty('Number')) {
            return parseFloat(node.Number);
        }

        if (node.hasOwnProperty('Binary')) {
            node = node.Binary;
            left = exec(node.left);
            right = exec(node.right);
            switch (node.operator) {
            case '+':
                return left + right;
            case '-':
                return left - right;
            case '*':
                return left * right;
            case '/':
                return left / right;
            default:
                throw new SyntaxError('Unknown operator ' + node.operator);
            }
        }

        if (node.hasOwnProperty('Unary')) {
            node = node.Unary;
            expr = exec(node.expression);
            switch (node.operator) {
            case '+':
                return expr;
            case '-':
                return -expr;
            default:
                throw new SyntaxError('Unknown operator ' + node.operator);
            }
        }

        if (node.hasOwnProperty('Identifier')) {
            if (TapDigit.Constants.hasOwnProperty(node.Identifier)) {
                return TapDigit.Constants[node.Identifier];
            }
            if (context.has(node.Identifier)) {
                return context.get(node.Identifier);
            }
            throw new SyntaxError('Unknown identifier');
        }

        if (node.hasOwnProperty('Assignment')) {
            right = exec(node.Assignment.value);
            context.set(node.Assignment.name.Identifier, right);
            return right;
        }

        if (node.hasOwnProperty('FunctionCall')) {
            expr = node.FunctionCall;
            if (TapDigit.Functions.hasOwnProperty(expr.name)) {
                args = [];
                for (i = 0; i < expr.args.length; i += 1) {
                    args.push(exec(expr.args[i]));
                }
                return TapDigit.Functions[expr.name].apply(null, args);
            }
            throw new SyntaxError('Unknown function ' + expr.name);
        }

        throw new SyntaxError('Unknown syntax node');
    }

    function evaluate(expr) {
        var tree = parser.parse(expr);
        var result = exec(tree);
        context.set('_', result);
        return result;
    }

    return {
        evaluate: evaluate
    };
};

module.exports = TapDigit;
