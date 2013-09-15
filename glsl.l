D           [0-9]
L           [a-zA-Z_]
H           [a-fA-F0-9]
E           [Ee][+-]?{D}+
O           [0-7]

%x COMMENT FIELDS

%%

"//"[^\n]*     /* ignore single line comments */

"/*"                { this.begin('COMMENT'); }
<COMMENT>"*/"       { this.popState(); }
<COMMENT>[\r\n]     /* ignore multiline comments */
<COMMENT>.          ;

"invariant"    { return 'INVARIANT'; }
"highp"        { return 'HIGH_PRECISION'; }
"mediump"      { return 'MEDIUM_PRECISION'; }
"lowp"         { return 'LOW_PRECISION'; }
"precision"    { return 'PRECISION'; }

"attribute" { return 'ATTRIBUTE'; }
"const"     { return 'CONST_TOK'; }
"uniform"   { return 'UNIFORM'; }
"varying"   { return 'VARYING'; }

"bool"      { return 'BOOL'; }
"float"     { return 'FLOAT'; }
"int"       { return 'INT'; }
"void"      { return 'VOID'; }

"true"      { yytext = true;  return 'BOOLCONSTANT'; }
"false"     { yytext = false; return 'BOOLCONSTANT'; }

"break"     { return 'BREAK'; }
"continue"  { return 'CONTINUE'; }
"do"        { return 'DO'; }
"while"     { return 'WHILE'; }
"for"       { return 'FOR'; }

"if"        { return 'IF'; }
"else"      { return 'ELSE'; }

"in"        { return 'IN_TOK'; }
"out"       { return 'OUT_TOK'; }
"inout"     { return 'INOUT_TOK'; }

"discard"   { return 'DISCARD'; }
"return"    { return 'RETURN'; }

"bvec2"     { return 'BVEC2'; }
"bvec3"     { return 'BVEC3'; }
"bvec4"     { return 'BVEC4'; }
"ivec2"     { return 'IVEC2'; }
"ivec3"     { return 'IVEC3'; }
"ivec4"     { return 'IVEC4'; }
"vec2"      { return 'VEC2'; }
"vec3"      { return 'VEC3'; }
"vec4"      { return 'VEC4'; }

"mat2"      { return 'MAT2'; }
"mat3"      { return 'MAT3'; }
"mat4"      { return 'MAT4'; }

"sampler2D"   { return 'SAMPLER2D'; }
"samplerCube" { return 'SAMPLERCUBE'; }

"struct"      { return 'STRUCT'; }

"asm"          { return reservedWord(); }

"class"        { return reservedWord(); }
"union"        { return reservedWord(); }
"enum"         { return reservedWord(); }
"typedef"      { return reservedWord(); }
"template"     { return reservedWord(); }
"this"         { return reservedWord(); }
"packed"       { return reservedWord(); }

"goto"         { return reservedWord(); }
"switch"       { return reservedWord(); }
"default"      { return reservedWord(); }

"inline"       { return reservedWord(); }
"noinline"     { return reservedWord(); }
"volatile"     { return reservedWord(); }
"public"       { return reservedWord(); }
"static"       { return reservedWord(); }
"extern"       { return reservedWord(); }
"external"     { return reservedWord(); }
"interface"    { return reservedWord(); }
"flat"         { return reservedWord(); }

"long"         { return reservedWord(); }
"short"        { return reservedWord(); }
"double"       { return reservedWord(); }
"half"         { return reservedWord(); }
"fixed"        { return reservedWord(); }
"unsigned"     { return reservedWord(); }
"superp"       { return reservedWord(); }

"input"        { return reservedWord(); }
"output"       { return reservedWord(); }

"hvec2"        { return reservedWord(); }
"hvec3"        { return reservedWord(); }
"hvec4"        { return reservedWord(); }
"dvec2"        { return reservedWord(); }
"dvec3"        { return reservedWord(); }
"dvec4"        { return reservedWord(); }
"fvec2"        { return reservedWord(); }
"fvec3"        { return reservedWord(); }
"fvec4"        { return reservedWord(); }

"sampler1D"             { return reservedWord(); }
"sampler3D"             { return reservedWord(); }
"sampler1DShadow"       { return reservedWord(); }
"sampler2DShadow"       { return reservedWord(); }
"sampler3DRect"         { return reservedWord(); }
"sampler2DRectShadow"   { return reservedWord(); }

"sizeof"       { return reservedWord(); }
"cast"         { return reservedWord(); }

"namespace"    { return reservedWord(); }
"using"        { return reservedWord(); }

{L}({L}|{D})*       {
   return yy.symbolTable.findType(yytext) ? 'TYPE_NAME' : 'IDENTIFIER';
}

{D}+{E}           { yytext = parseFloat(yytext); return 'FLOATCONSTANT'; }
{D}+"."{D}*({E})? { yytext = parseFloat(yytext); return 'FLOATCONSTANT'; }
"."{D}+({E})?     { yytext = parseFloat(yytext); return 'FLOATCONSTANT'; }

"0"[xX]{H}+    { yytext = parseInt(yytext.slice(2), 16); return 'INTCONSTANT'; }
"0"{O}+        { yytext = parseInt(yytext, 8); return 'INTCONSTANT'; }
"0"{D}+        { error("Invalid Octal number."); return 0; }
{D}+           { yytext = parseInt(yytext); return 'INTCONSTANT'; }

"+="        { return 'ADD_ASSIGN'; }
"-="        { return 'SUB_ASSIGN'; }
"*="        { return 'MUL_ASSIGN'; }
"/="        { return 'DIV_ASSIGN'; }
"%="        { return 'MOD_ASSIGN'; }
"<<="       { return 'LEFT_ASSIGN'; }
">>="       { return 'RIGHT_ASSIGN'; }
"&="        { return 'AND_ASSIGN'; }
"^="        { return 'XOR_ASSIGN'; }
"|="        { return 'OR_ASSIGN'; }

"++"        { return 'INC_OP'; }
"--"        { return 'DEC_OP'; }
"<="        { return 'LE_OP'; }
">="        { return 'GE_OP'; }
"=="        { return 'EQ_OP'; }
"!="        { return 'NE_OP'; }
"&&"        { return 'AND_OP'; }
"||"        { return 'OR_OP'; }
"^^"        { return 'XOR_OP'; }
"<<"        { return 'LEFT_OP'; }
">>"        { return 'RIGHT_OP'; }

";"         { return 'SEMICOLON'; }
("{"|"<%")  { return 'LEFT_BRACE'; }
("}"|"%>")  { return 'RIGHT_BRACE'; }
","         { return 'COMMA'; }
":"         { return 'COLON'; }
"="         { return 'EQUAL'; }
"("         { return 'LEFT_PAREN'; }
")"         { return 'RIGHT_PAREN'; }
("["|"<:")  { return 'LEFT_BRACKET'; }
("]"|":>")  { return 'RIGHT_BRACKET'; }
"."         { this.begin('FIELDS'); return 'DOT'; }
"!"         { return 'BANG'; }
"-"         { return 'DASH'; }
"~"         { return 'TILDE'; }
"+"         { return 'PLUS'; }
"*"         { return 'STAR'; }
"/"         { return 'SLASH'; }
"%"         { return 'PERCENT'; }
"<"         { return 'LEFT_ANGLE'; }
">"         { return 'RIGHT_ANGLE'; }
"|"         { return 'VERTICAL_BAR'; }
"^"         { return 'CARET'; }
"&"         { return 'AMPERSAND'; }
"?"         { return 'QUESTION'; }

<FIELDS>{L}({L}|{D})* { 
    this.begin('INITIAL');
    return 'FIELD_SELECTION';
}
<FIELDS>[ \t\v\f\r] {}

[ \t\v\n\f\r]   {  }
<*><<EOF>>      { return 'EOF'; }
<*>.            { error("Unknown char " + yytext); return 0; }

%%

function reservedWord() {
    error("Illegal use of reserved word " + yytext);
}