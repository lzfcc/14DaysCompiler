//import org.junit.Test;
import java.io.StringReader;

public class LexerTest extends BasicTest {

//	@Test
	public void test_lexer() throws ParseException {
		StringReader stringReader = new StringReader(lexer);
		Lexer lexer = new Lexer(stringReader);

		for (Token token; (token = lexer.read()) != Token.EOF;) {
			System.out.println(token.name() + " => " + token.getText());
		}
	}
	
	
	public static void main(String[] args)
	{
		System.out.println(args); //[ljava.lang.string;@139a55  “[”代表数组， “l”代表long , "@139a55"代表哈希值
		System.out.println(args.length);  //默认长度为0
		
		try {
			LexerTest test = new LexerTest();
			test.test_lexer();	
		} catch (ParseException e) {
			
		} 
	} 
}