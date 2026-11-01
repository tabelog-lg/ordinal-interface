''==============================================================================
''  Omega2Notation —— 一个最小的 ONP2「序数记号」示例插件
''
''  它实现 ω² 以下的序数，内部用一对整数 (A, B) 表示 ω·A + B：
''      A = 0, B = 0   →  0
''      A = 0, B > 0   →  有限数 B
''      A > 0          →  ω·A + B
''      A = -1         →  本系统的最大序数 Limit，也就是 ω²
''
''  表达式写法（全部 ASCII，避免控制台编码问题）：
''      "0" / "5" / "12"     有限数
''      "w"                  ω
''      "w*3"                ω·3
''      "w*3+7"              ω·3 + 7
''      "w+7"                ω + 7
''      "Limit"              ω²（最大序数）
''
''  基本列的定义：
''      Limit  (ω²)   的第 n 项 = ω·n
''      ω·A    (A>0)  的第 n 项 = ω·(A-1) + n
''      有限数没有基本列（界面也不会对它发命令 1 / 4）
''
''  启动后先输出两行（握手串 + 记号名称），然后逐行读命令、逐行回结果。
''  注意每条命令必须恰好输出一行，并及时 flush。
''==============================================================================

Option Strict On
Option Explicit On

Imports System
Imports System.Text

Module Program

    '——————————————————————————————————————————————————————————
    '  序数的内部表示
    '——————————————————————————————————————————————————————————

    Private Const LIMIT_A As Long = -1   ' A = -1 表示 Limit（ω²）

    Private Structure Ord
        Public A As Long
        Public B As Long

        Public Sub New(a As Long, b As Long)
            Me.A = a
            Me.B = b
        End Sub
    End Structure

    Private Function MakeLimit() As Ord
        Return New Ord(LIMIT_A, 0)
    End Function

    '——————————————————————————————————————————————————————————
    '  表达式 ↔ 内部表示
    '——————————————————————————————————————————————————————————

    Private Function Parse(s As String) As Ord
        If s Is Nothing Then Return New Ord(0, 0)
        s = s.Trim()

        If s = "Limit" Then Return MakeLimit()

        If s.StartsWith("w", StringComparison.Ordinal) Then
            ' 形如 "w"、"w+b"、"w*a"、"w*a+b"
            Dim a As Long = 1
            Dim b As Long = 0
            Dim rest As String = s.Substring(1)

            If rest.StartsWith("*", StringComparison.Ordinal) Then
                rest = rest.Substring(1)
                Dim plus As Integer = rest.IndexOf("+"c)
                If plus >= 0 Then
                    a = Long.Parse(rest.Substring(0, plus))
                    b = Long.Parse(rest.Substring(plus + 1))
                Else
                    a = Long.Parse(rest)
                End If
            ElseIf rest.StartsWith("+", StringComparison.Ordinal) Then
                b = Long.Parse(rest.Substring(1))
            ElseIf rest.Length > 0 Then
                ' 兼容 "w2" 这种写法：直接把数字当成 ω 的系数
                Dim plus As Integer = rest.IndexOf("+"c)
                If plus >= 0 Then
                    a = Long.Parse(rest.Substring(0, plus))
                    b = Long.Parse(rest.Substring(plus + 1))
                Else
                    a = Long.Parse(rest)
                End If
            End If

            If a <= 0 Then a = 1
            Return New Ord(a, b)
        End If

        ' 纯数字：有限数
        Dim n As Long
        If Long.TryParse(s, n) Then Return New Ord(0, n)
        Return New Ord(0, 0)
    End Function

    Private Function Format(o As Ord) As String
        If o.A = LIMIT_A Then Return "Limit"

        If o.A = 0 Then Return o.B.ToString()

        Dim sb As New StringBuilder()
        sb.Append("w")
        If o.A > 1 Then
            sb.Append("*").Append(o.A.ToString())
        End If
        If o.B > 0 Then
            sb.Append("+").Append(o.B.ToString())
        End If
        Return sb.ToString()
    End Function

    '——————————————————————————————————————————————————————————
    '  五种运算
    '——————————————————————————————————————————————————————————

    ''' <summary>命令 2：序数类型。1 = 0，2 = 后继序数，3 = 极限序数</summary>
    Private Function TypeCode(o As Ord) As String
        If o.A = LIMIT_A Then Return "3"
        If o.A = 0 AndAlso o.B = 0 Then Return "1"
        If o.B > 0 Then Return "2"
        Return "3"          ' A > 0 且 B = 0，即 ω·A，是极限序数
    End Function

    ''' <summary>命令 3：前继序数。极限序数 / 0 没有前继，返回 "0" 兜底</summary>
    Private Function Predecessor(o As Ord) As Ord
        If o.B > 0 Then Return New Ord(o.A, o.B - 1)
        If o.A > 0 AndAlso o.A <> LIMIT_A Then Return New Ord(o.A - 1, 0)   ' 兜底：ω·A → ω·(A-1)
        Return New Ord(0, 0)
    End Function

    ''' <summary>命令 1 / 4：基本列的第 n 项</summary>
    Private Function FSTerm(o As Ord, n As Long) As Ord
        If n < 0 Then n = 0

        If o.A = LIMIT_A Then
            ' ω² 的基本列：ω·0, ω·1, ω·2, ...
            Return New Ord(n, 0)
        End If

        If o.A > 0 AndAlso o.B = 0 Then
            ' ω·A 的基本列：ω·(A-1), ω·(A-1)+1, ω·(A-1)+2, ...
            Return New Ord(o.A - 1, n)
        End If

        ' 有限数没有基本列，界面不会对它发命令 1 / 4
        Return New Ord(0, 0)
    End Function

    ''' <summary>命令 5：比较大小。a &lt; b 返回 True</summary>
    Private Function LessThan(x As Ord, y As Ord) As Boolean
        Dim xa As Long = If(x.A = LIMIT_A, Long.MaxValue, x.A)
        Dim ya As Long = If(y.A = LIMIT_A, Long.MaxValue, y.A)

        If xa <> ya Then Return xa < ya
        Return x.B < y.B
    End Function

    '——————————————————————————————————————————————————————————
    '  主循环
    '——————————————————————————————————————————————————————————

    Public Sub Main()
        Dim stdin As IO.TextReader = Console.In
        Dim stdout As IO.TextWriter = Console.Out
        stdout.NewLine = vbCrLf

        ' —— 握手：第一行是协议标识，第二行是记号名称
        stdout.WriteLine("Ordinal Notation Protocol 2")
        stdout.WriteLine("Omega2 (w^2)")
        stdout.Flush()

        Do
            Dim cmd As String = stdin.ReadLine()
            If cmd Is Nothing Then Exit Do
            cmd = cmd.Trim()

            Select Case cmd
                Case "1"
                    ' 1 + 有限数 a → Limit 的基本列第 a 项
                    Dim a As Long = ReadLong(stdin)
                    stdout.WriteLine(Format(FSTerm(MakeLimit(), a)))

                Case "2"
                    ' 2 + 序数 a → 类型码
                    stdout.WriteLine(TypeCode(Parse(stdin.ReadLine())))

                Case "3"
                    ' 3 + 序数 a → a 的前继序数
                    stdout.WriteLine(Format(Predecessor(Parse(stdin.ReadLine()))))

                Case "4"
                    ' 4 + 有限数 a + 序数 b → b 的基本列第 a 项
                    Dim a As Long = ReadLong(stdin)
                    Dim b As Ord = Parse(stdin.ReadLine())
                    stdout.WriteLine(Format(FSTerm(b, a)))

                Case "5"
                    ' 5 + 序数 a + 序数 b → a<b 返回 "2"，否则返回 "1"
                    Dim a As Ord = Parse(stdin.ReadLine())
                    Dim b As Ord = Parse(stdin.ReadLine())
                    stdout.WriteLine(If(LessThan(a, b), "2", "1"))

                Case Else
                    ' 未知命令：回一行 "0"，避免界面读空行卡住
                    stdout.WriteLine("0")
            End Select

            stdout.Flush()
        Loop
    End Sub

    Private Function ReadLong(stdin As IO.TextReader) As Long
        Dim s As String = stdin.ReadLine()
        Dim n As Long
        If s IsNot Nothing AndAlso Long.TryParse(s.Trim(), n) Then Return n
        Return 0
    End Function

End Module
