/**
 * 代表一个单词对象, token 的种类只用三种, 分别是number, string, identifier
 */
public abstract class Token {

	public static final Token EOF = new Token(-1) {

		public String name() {
			return "EOF";
		}
	};
	// 抽象类不能实例化。上面这种格式（new ClassName(){要重写的方法}）叫匿名内部类，实际上是实例化一个它的子类。

	// 换行
	public static final String EOL = "\\n";

	private int lineNumber;

	protected Token(int lineNumber) {
		this.lineNumber = lineNumber;
	}

	// 行号
	public int getLineNumber() {
		return lineNumber;
	}

	public boolean isIdentifier() {
		return false;
	}

	public boolean isNumber() {
		return false;
	}

	public boolean isString() {
		return false;
	}

	// 数字字面量
	public int getNumber() {
		throw new StoneException("not number token");
	}

	// 节点文本
	public String getText() {
		return "";
	}

	public abstract String name();

}