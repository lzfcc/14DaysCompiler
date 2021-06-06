public class NumberLiteral extends ASTLeaf {
    public NumberLiteral(Token t) { super(t); }
    public int value() throws ParseException { 
        return token().getNumber(); 
    }
}
