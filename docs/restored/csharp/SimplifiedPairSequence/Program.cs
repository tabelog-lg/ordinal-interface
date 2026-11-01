// ============================================================================
//  Simplified Pair Sequence（原 PSS Hydra.exe）
//  复原自 VB.NET 反编译产物。序列写成 "0(1(2()))" 这种嵌套串：每个元素是一个
//  十进制数后跟 '('，闭合括号统一堆在末尾 —— limit(n) = "0(1(2(...n())))"。
//
//  展开分两种情形：
//    * 末元素值 > 0：向左扫，用括号深度计数找到「值 >= 末元素」的祖先作为父，
//      把「父元素 + 其后内容」复制 n+1 份，再补上末尾的闭合括号；
//    * 末元素值 == 0：按括号配对直接找父，片段末尾补一个 ')'。
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

    /// <summary>VB Strings.Asc(单字符)：这里只用来判断「是不是数字」（&gt; 45）。</summary>
    private static int Asc(string c) { return c.Length == 0 ? 0 : c[0]; }

    private static void Main()
    {
        Console.WriteLine("Ordinal Notation Protocol 2\r\nSimplified Pair Sequence");
        while (true)
        {
            int mode = int.Parse(Console.ReadLine() ?? "0");

            if (mode == 1)                                   // limit
            {
                int n = int.Parse(Console.ReadLine() ?? "0");
                var sb = new StringBuilder();
                for (int i = 0; i <= n; i++) sb.Append(i).Append('(');
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
                Console.WriteLine(s == "0()" ? "0" : Mid(s, 1, s.Length - 3));
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
        int i1 = s.Length - 2;
        while (i1 > 0 && Mid(s, i1, 1) == ")") i1--;        // 跳过尾部闭合，落到最后一个 '('
        int i7 = i1;

        i1--;                                                // 再跳过末元素的数字
        while (i1 > 0 && Asc(Mid(s, i1, 1)) > 45) i1--;
        i1++;

        int v = int.Parse(Mid(s, i1, i7 - i1));              // 末元素的值
        int i2 = i1;                                         // 末元素数字的起始位置

        if (v > 0)
        {
            int i4 = 0, i5 = 0;                              // i4 = 候选父的值，i5 = 括号深度
            while (i5 <= i4 && i1 > 1)
            {
                i1--;
                string c = Mid(s, i1, 1);
                if (c == "(")
                {
                    i5++;
                    if (i5 > i4)
                    {
                        int i6 = i1;
                        i1--;
                        while (i1 > 0 && Asc(Mid(s, i1, 1)) > 45) i1--;
                        i1++;
                        i4 = int.Parse(Mid(s, i1, i6 - i1));
                        i4 = (i4 < v) ? 0 : i5;              // 值不够大就继续往左找
                    }
                }
                else if (c == ")")
                {
                    i5--;
                }
            }

            string seg = Mid(s, i1, i2 - i1);                // 从父开始、到末元素之前
            var r = new StringBuilder(Mid(s, 1, i1 - 1));
            for (int k = 0; k <= n; k++) r.Append(seg);
            string tail = Mid(s, s.Length - i5 + 1, i5);     // 末尾的 i5 个闭合
            for (int k = 1; k <= n; k++) r.Append(tail);
            r.Append(Mid(s, i7 + 2, s.Length - i7 - 1));
            return r.ToString();
        }
        else
        {
            int t = 1;                                       // 按括号配对找父
            while (t > 0 && i1 > 0)
            {
                i1--;
                string c = Mid(s, i1, 1);
                if (c == "(")      t--;
                else if (c == ")") t++;
            }
            i1--;
            while (i1 > 0 && Asc(Mid(s, i1, 1)) > 45) i1--;
            i1++;

            string seg = Mid(s, i1, i2 - i1) + ")";
            var r = new StringBuilder(Mid(s, 1, i1 - 1));
            for (int k = 0; k <= n; k++) r.Append(seg);
            r.Append(Mid(s, i7 + 3, s.Length - i7 - 2));
            return r.ToString();
        }
    }

    /// <summary>比较：逐个元素比数值，true 表示 a &lt; b。</summary>
    private static bool Function4(string a, string b)
    {
        int i = 3;                                           // 跳过首元素 "0("
        while (true)
        {
            if (i > b.Length) return false;
            if (i > a.Length) return true;

            if (Mid(a, i, 1) == ")")                         // a 这一位已经结束
            {
                if (Mid(b, i, 1) == ")") { i++; continue; }
                return true;
            }
            if (Mid(b, i, 1) == ")") return false;

            int k = i;                                       // 两边都还是数字：各读一个元素值
            while (k <= a.Length && Mid(a, k, 1) != "(") k++;
            int va = int.Parse(Mid(a, i, k - i));
            k = i;
            while (i <= b.Length && Mid(b, i, 1) != "(") i++;
            int vb = int.Parse(Mid(b, k, i - k));

            if (va < vb) return true;
            if (va > vb) return false;
            i++;
        }
    }
}
