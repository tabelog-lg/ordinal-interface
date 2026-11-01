// ============================================================================
//  Long Primitive Sequence System（原 LPrSS.exe）
//  复原自 VB.NET 反编译产物。与 Simplified Primitive Sequence 是同一套展开
//  规则，只是把 hydra 的括号串换成「逗号分隔整数」，因此元素值可以任意大
//  （这就是 "Long"）：limit(n) = "1,n+1"，空序列写作 "0"。
//
//  原程序把整数现成解析成数组再做 PrSS 展开（Function2 / Function4 / Function3），
//  只有 type0 和 precursor 直接按字符串处理。
// ============================================================================
using System;
using System.Collections.Generic;
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
        Console.WriteLine("Ordinal Notation Protocol 2");
        Console.WriteLine("Long Primitive Sequence System");
        while (true)
        {
            int mode = int.Parse(Console.ReadLine() ?? "0");

            if (mode == 1)                                   // limit
            {
                int n = int.Parse(Console.ReadLine() ?? "0");
                Console.WriteLine("1," + (n + 1));
            }
            else if (mode == 2)                              // type0
            {
                string s = Console.ReadLine() ?? "";
                if (s == "0")                        Console.WriteLine("1");
                else if (s == "1")                   Console.WriteLine("2");
                else if (Mid(s, s.Length - 1, 2) == ",1") Console.WriteLine("2");
                else                                 Console.WriteLine("3");
            }
            else if (mode == 3)                              // precursor
            {
                string s = Console.ReadLine() ?? "";
                Console.WriteLine(s == "1" ? "0" : Mid(s, 1, s.Length - 2));
            }
            else if (mode == 4)                              // expand
            {
                int n = int.Parse(Console.ReadLine() ?? "0");
                string s = Console.ReadLine() ?? "";
                Console.WriteLine(Function3(Function4(n, Function2(s))));
            }
            else if (mode == 5)                              // compare0
            {
                string a = Console.ReadLine() ?? "";
                string b = Console.ReadLine() ?? "";
                Console.WriteLine(Function5(Function2(a), Function2(b)) ? "2" : "1");
            }
        }
    }

    /// <summary>Function2：字符串 -> 数组（"0" 是空序列）。</summary>
    private static int[] Function2(string s)
    {
        if (s == "0") return new int[0];

        int count = 0;
        for (int i = 1; i <= s.Length; i++)
            if (Mid(s, i, 1) == ",") count++;

        int[] a = new int[count + 1];
        int start = 1, scan = 1;
        for (int k = 0; k < a.Length; k++)
        {
            while (!(s.Length < scan || Mid(s, scan, 1) == ",")) scan++;
            a[k] = int.Parse(Mid(s, start, scan - start));
            scan++;
            start = scan;
        }
        return a;
    }

    /// <summary>Function3：数组 -> 字符串（空序列输出 "0"）。</summary>
    private static string Function3(int[] a)
    {
        if (a.Length == 0) return "0";
        var sb = new StringBuilder();
        foreach (int v in a) sb.Append(v).Append(',');
        return Mid(sb.ToString(), 1, sb.Length - 1);
    }

    /// <summary>Function4：PrSS 展开 —— 向左找第一个小于末元素的作为父，
    /// 以它为界取段长 L，复制段并逐段累加 delta = 末元素 - 父 - 1。</summary>
    private static int[] Function4(int n, int[] b)
    {
        if (b.Length == 0) return b;

        int i = b.Length - 2;
        while (i >= 0 && b[i] >= b[b.Length - 1]) i--;
        if (i < 0) return b;        // 末元素已是最小值：原程序在此越界抛异常

        int delta = b[b.Length - 1] - b[i] - 1;
        int L = b.Length - i - 1;                       // 段长

        int[] r = new int[b.Length + L * n - 2 + 1];
        for (int k = 0; k <= b.Length - 2; k++) r[k] = b[k];
        for (int j = b.Length - 1; j <= r.Length - 1; j++) r[j] = r[j - L] + delta;
        return r;
    }

    /// <summary>Function5：字典序比较，true 表示 a &lt; b。</summary>
    private static bool Function5(int[] a, int[] b)
    {
        int i = 0;
        while (true)
        {
            if (b.Length == i) return false;
            if (a.Length == i) return true;
            if (a[i] < b[i])   return true;
            if (a[i] > b[i])   return false;
            i++;
        }
    }
}
