// ============================================================================
//  Simplified Primitive Sequence（原 KP Hydra.exe）
//  复原自 VB.NET 反编译产物。序列用纯括号串表示：每个 '(' 是一个元素，
//  嵌套深度就是元素的值 ——  "()" = [1]   "(())" = [1,2]   "((()))" = [1,2,3]
//
//  展开规则：向左找到末元素的父（它左边那个 '('），把「父 + 一个闭合」当作
//            片段复制 n+1 份：第 1 份替换掉原来的末元素，其余 n 份追加。
//
//  为便于与反编译代码逐行对照，这里保留了 VB 的 1-based Strings.Mid 语义。
// ============================================================================
using System;
using System.Text;

internal static class Program
{
    /// <summary>VB Strings.Mid(s, start, length)：start 是 1-based，越界返回空串。</summary>
    private static string Mid(string s, int start, int length)
    {
        if (start < 1) start = 1;
        int i = start - 1;
        if (i >= s.Length || length <= 0) return "";
        if (length > s.Length - i) length = s.Length - i;
        return s.Substring(i, length);
    }

    private static void Main()
    {
        Console.WriteLine("Ordinal Notation Protocol 2\r\nSimplified Primitive Sequence");
        while (true)
        {
            int mode = int.Parse(Console.ReadLine() ?? "0");

            if (mode == 1)                                   // limit
            {
                int n = int.Parse(Console.ReadLine() ?? "0");
                var sb = new StringBuilder();
                for (int i = 0; i <= n; i++) sb.Append('(');
                for (int j = 0; j <= n; j++) sb.Append(')');
                Console.WriteLine(sb.ToString());
            }
            else if (mode == 2)                              // type0
            {
                string s = Console.ReadLine() ?? "";
                if (s == "0")                       Console.WriteLine("1");
                else if (Mid(s, s.Length - 1, 1) == "(") Console.WriteLine("2");
                else                                 Console.WriteLine("3");
            }
            else if (mode == 3)                              // precursor
            {
                string s = Console.ReadLine() ?? "";
                Console.WriteLine(s == "()" ? "0" : Mid(s, 1, s.Length - 2));
            }
            else if (mode == 4)                              // expand
            {
                int n = int.Parse(Console.ReadLine() ?? "0");
                string s = Console.ReadLine() ?? "";
                Console.WriteLine(Ex(n, s));
            }
            else if (mode == 5)                              // compare0
            {
                string a = Console.ReadLine() ?? "";
                string b = Console.ReadLine() ?? "";
                Console.WriteLine(Function4(a, b) ? "2" : "1");
            }
        }
    }

    /// <summary>展开 n 段。</summary>
    private static string Ex(int n, string s)
    {
        int i1 = s.Length - 2;                       // 从倒数第二个字符起
        while (i1 > 0 && Mid(s, i1, 1) == ")") i1--; // 向左跳过闭合，落到最后一个 '('

        int i2 = i1, i3 = 1;                        // 括号配对，找出它的父 '('
        while (i3 > 0 && i2 > 1)
        {
            i2--;
            if (Mid(s, i2, 1) == ")") i3++;
            else                      i3--;
        }

        string seg = Mid(s, i2, i1 - i2) + ")";     // 父副本 + 闭合
        string r = Mid(s, 1, i2 - 1);               // 前缀
        for (int k = 0; k <= n; k++) r += seg;
        return r + Mid(s, i1 + 3, s.Length - i1 - 2);
    }

    /// <summary>比较：true 表示 a &lt; b。</summary>
    private static bool Function4(string a, string b)
    {
        int i = 2;                                  // 跳过第 1 个字符（恒为 '('）
        while (true)
        {
            if (i > b.Length) return false;
            if (i > a.Length) return true;
            if (Mid(a, i, 1) == "(" && Mid(b, i, 1) == ")") return false;
            if (Mid(b, i, 1) == "(" && Mid(a, i, 1) == ")") return true;
            i++;
        }
    }
}
