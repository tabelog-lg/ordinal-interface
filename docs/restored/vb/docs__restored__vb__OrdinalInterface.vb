''==============================================================================
''  序数界面1  v1.5.4   —— OrdinalInterface.vb
''  由反编译产物 Form1.cs 还原的 VB.NET 源码
''  （窗体类名由反编译产物的 Form1 改名为 OrdinalInterface）
''
''  【这个程序在干什么】
''    它本身不做任何序数运算。真正的序数记号系统由用户提供的外部控制台 exe
''    （「序数记号」插件）实现，主程序通过标准输入/输出跟它对话，
''    握手串为 "Ordinal Notation Protocol 2"（简称 ONP2）。
''    协议细节见同目录《ONP2协议与还原说明.md》。
''
''  【还原说明】
''    * 原程序经过混淆，标识符全部退化成 Class1 / Sub1 / Dim1 ... 之类，
''      这里按语义重新命名为英文，并补上了中文注释；
''    * 事件绑定改回 VB 原生的 WithEvents / Handles（原程序就是由它编译来的）；
''    * 原程序中两个从未被使用的 TreeNode 字段已删除；
''    * 逻辑与原程序逐行等价，未作功能改动；疑似原作者笔误的地方
''      已在代码中用「★」标出，并在说明文件里列出。
''==============================================================================

Option Strict Off
Option Explicit On
Option Compare Binary

Imports System.Collections.Generic
Imports System.ComponentModel
Imports System.Diagnostics
Imports System.Drawing
Imports System.IO
Imports System.Windows.Forms
Imports Microsoft.VisualBasic

Friend Class OrdinalInterface

    '==========================================================================
    '  一、数据结构
    '==========================================================================

    ''' <summary>
    ''' 序数尺上的一个刻度节点（原 Class1）。
    ''' 这些节点构成一棵「可无限二分细分的树」：
    ''' 2/3 两个指针指向子节点，4/5 两个指针把同一层的节点串成
    ''' 双向链表。正因为节点是按需生成的，
    ''' 序数尺才能沿着 ω、ε₀ 这类序数一直放大下去而不会爆内存。
    ''' </summary>
    Public Class RulerNode

        ''' <summary>
        ''' 邻接节点数组（长度 6）：
        '''   0 = 下界节点      1 = 上界节点
        '''   2 = 下子节点      3 = 上子节点
        '''   4 = 同层的前一个（更小的一侧）
        '''   5 = 同层的后一个（更大的一侧）
        ''' </summary>
        Public Adjacent() As RulerNode

        ''' <summary>该刻度对应的序数表达式（字符串形式）</summary>
        Public Expression As String

        ''' <summary>True 表示该节点位于其父节点的上侧</summary>
        Public IsUpperSide As Boolean

        ''' <summary>该节点在其上界序数的基本列中的下标</summary>
        Public FSIndex As Integer

        ''' <summary>True 表示极限序数（用「极限序数画刷」绘制）</summary>
        Public IsLimit As Boolean
    End Class

    ''' <summary>展开树上的一个节点（原 Structure1）</summary>
    Public Structure TreeNodeInfo

        ''' <summary>序数表达式</summary>
        Public Expression As String

        ''' <summary>
        ''' 层级 / 缩进信息（长度 4）：
        '''   0 = 已展开到第几项（-1 表示尚未展开；
        '''       ★原程序在这里存了一个像素坐标）
        '''   1 = 展开深度，每次展开 +1
        '''   2 = 基本序列序号
        '''   3 = 连续展开深度
        ''' 设置页的「展开树的对齐模式」四选一，决定用哪一项
        ''' （或全不用）做缩进。
        ''' </summary>
        Public Levels() As Integer

        ''' <summary>True 表示极限序数</summary>
        Public IsLimit As Boolean
    End Structure

    '==========================================================================
    '  二、字段
    '==========================================================================

    ' —— 双缓冲画布：序数尺一套，展开树一套
    Private rulerBitmap As Bitmap
    Private treeBitmap As Bitmap
    Private rulerGraphics As Graphics
    Private treeGraphics As Graphics

    ' —— 序数尺的视窗状态（原 Single1）
    Private viewCenter As Single      ' centre of the viewport along the whole ruler, 0~1
    Private viewSpan As Single        ' viewport span; smaller = zoomed in further, 0.5 = full view
    Private rulerFont As Font         ' text on the ruler (scaled with the control height)

    ' —— 画刷：0 和后继序数用 normalBrush，极限序数用 limitBrush
    Private normalBrush As SolidBrush
    Private limitBrush As SolidBrush

    ' —— 布局与临时量
    '     （原 Integer1 / Integer2 两个整数数组，此处拆开命名）
    Private treeScrollOffset As Integer  ' vertical scroll offset of the expansion tree (pixels)
    Private rulerCenterY As Integer      ' Y coordinate on the canvas where the ruler's 0.5 lands
    Private tickGap As Integer           ' pixel distance between two adjacent tick levels
    Private rulerHalfHeight As Integer   ' half the height of the ruler control
    Private denseTickLimit As Integer    ' below this gap, stop subdividing
    '                                      （除非勾选了「序数尺密集刻度」）
    Private captionOffset As Integer     ' offset to subtract when converting screen → client coords
    Private tickLength As Integer        ' length of the tick marks
    Private textHalfHeight As Integer    ' half the text height (for vertical centring)
    Private indentPixels As Integer      ' indent of the current expansion-tree row
    Private tempIndex As Integer         ' scratch: FS index / mouse offset / loop counter

    ' —— 外挂的序数记号引擎（原 Process1 / Process2）
    Private engineProcess As Process     ' resident engine; every ordinal computation goes through it
    Private probeProcess As Process      ' throw-away process, started once when adding/validating

    ' —— 序数尺的三个关键节点（原 Class1_1 / Class1_2 / Class1_3）
    Private rootNode As RulerNode
    Private lowerNode As RulerNode
    Private upperNode As RulerNode

    ' —— 展开树（原 LinkedList1 / LinkedListNode1）
    Private expansionTree As LinkedList(Of TreeNodeInfo)
    Private treeFirstVisible As LinkedListNode(Of TreeNodeInfo)
    Private treeCursor As LinkedListNode(Of TreeNodeInfo)

    ' —— 已加载的记号引擎列表（原 Collection1 / String3 / Byte1）
    Private pluginPaths As Collection          ' 1-based; full path of each plug-in exe
    Private savedPaths() As String
    Private savedNames() As String
    Private colorBuffer(2) As Byte

    ' —— 引擎是否已成功加载
    '     （未加载时，杂项页所有按钮都是禁用的）
    Private engineReady As Boolean

    ' —— 表达式校验时的游标（原 String1 / String2）
    Private cursorExpr As String
    Private candidateExpr As String

    '==========================================================================
    '  三、构造与入口
    '==========================================================================

    Public Sub New()
        InitializeComponent()

        rulerBitmap = New Bitmap(Screen.PrimaryScreen.Bounds.Width, Screen.PrimaryScreen.Bounds.Height)
        treeBitmap = New Bitmap(Screen.PrimaryScreen.Bounds.Width, Screen.PrimaryScreen.Bounds.Height)
        rulerGraphics = Graphics.FromImage(rulerBitmap)
        treeGraphics = Graphics.FromImage(treeBitmap)

        engineProcess = New Process()
        probeProcess = New Process()
        normalBrush = New SolidBrush(Color.Red)
        limitBrush = New SolidBrush(Color.Lime)

        rootNode = New RulerNode()
        lowerNode = New RulerNode()
        upperNode = New RulerNode()
        expansionTree = New LinkedList(Of TreeNodeInfo)()
        pluginPaths = New Collection()
    End Sub

    <STAThread>
    Public Shared Sub Main()
        Application.EnableVisualStyles()
        Application.SetCompatibleTextRenderingDefault(False)
        Application.Run(New OrdinalInterface())
    End Sub

    '==========================================================================
    '  四、与外挂引擎的通信（ONP2 协议，原 Function2 ~ Function7）
    '==========================================================================

    ''' <summary>
    ''' 命令 2：查询序数类型。
    ''' 返回 "1"=0，"2"=后继序数，"3"=极限序数。
    ''' </summary>
    Private Function QueryType(ByRef expr As String) As String
        If expr = "Limit" Then Return "3"
        engineProcess.StandardInput.WriteLine("2" & vbCrLf & expr)
        Return engineProcess.StandardOutput.ReadLine()
    End Function

    ''' <summary>
    ''' 命令 3：取前继序数。
    ''' （最大序数 Limit 无前继，故由命令 2 分流。）
    ''' </summary>
    Private Function GetPredecessor(ByRef expr As String) As String
        engineProcess.StandardInput.WriteLine("3" & vbCrLf & expr)
        Return engineProcess.StandardOutput.ReadLine()
    End Function

    ''' <summary>
    ''' 命令 1 / 4：取基本列的第 a 项。
    ''' 基准为 Limit 时走命令 1（只需下标），
    ''' 否则走命令 4（下标 + 表达式）。
    ''' </summary>
    Private Function GetFSTerm(ByRef index As Integer, ByRef expr As String) As String
        If expr = "Limit" Then
            engineProcess.StandardInput.WriteLine("1" & vbCrLf & CStr(index))
        Else
            engineProcess.StandardInput.WriteLine("4" & vbCrLf & CStr(index) & vbCrLf & expr)
        End If
        Return engineProcess.StandardOutput.ReadLine()
    End Function

    ''' <summary>
    ''' 命令 5：比较大小。a<b 时引擎返回 "2"，否则返回 "1"。
    ''' </summary>
    Private Function IsLessThan(ByRef a As String, ByRef b As String) As Boolean
        If a = "Limit" Then Return False
        If b = "Limit" Then Return True
        engineProcess.StandardInput.WriteLine("5" & vbCrLf & a & vbCrLf & b)
        Return engineProcess.StandardOutput.ReadLine() <> "1"
    End Function

    ''' <summary>
    ''' 在「基准」的基本列中，自 n=0 起递增，
    ''' 找到第一个大于「甲」的项并返回。
    ''' 这是序数尺细分的核心：两个已知刻度之间
    ''' 靠它插入新刻度。
    ''' </summary>
    Private Function FirstExceeding(ByRef a As String, ByRef baseExpr As String) As String
        tempIndex = 0
        Dim index As Integer = 0
        Dim term As String = GetFSTerm(index, baseExpr)
        While Not IsLessThan(a, term)
            tempIndex += 1
            term = GetFSTerm(tempIndex, baseExpr)
        End While
        Return term
    End Function

    ''' <summary>
    ''' 校验（并归一化）一个序数表达式。
    ''' 思路：从 Limit 出发，反复取「上界的基本列项 /
    ''' 前继序数」向下逼近，撞上目标串就说明它是合法的；
    ''' 撞不上（或引擎卡死）就返回 False。
    ''' </summary>
    Private Function ValidateExpression(ByRef expr As String) As Boolean
        If expr = "Limit" OrElse expr = "0" Then Return True
        If expr Is Nothing Then Return False

        cursorExpr = "Limit"
        tempIndex = 0
        While True
            If QueryType(cursorExpr) = "3" Then
                candidateExpr = GetFSTerm(tempIndex, cursorExpr)
            Else
                candidateExpr = GetPredecessor(cursorExpr)
            End If

            If expr = candidateExpr Then Return True

            ' 引擎失去响应：重启它
            ' （重启后需要再丢弃两行握手输出）
            If Not engineProcess.Responding Then
                TemporarilyTopMost()
                engineProcess.Start()
                engineProcess.StandardOutput.ReadLine()
                engineProcess.StandardOutput.ReadLine()
                Return False
            End If

            If IsLessThan(expr, candidateExpr) Then
                cursorExpr = candidateExpr
                tempIndex = 0
                Continue While
            End If

            ' 目标串比候选串还短，
            ' 说明已经越过了它，不可能再撞上。
            If expr.Length < candidateExpr.Length Then Exit While

            tempIndex += 1
        End While
        Return False
    End Function

    '==========================================================================
    '  五、记号引擎的装载
    '==========================================================================

    ''' <summary>「添加序数记号位置」：挑一个 exe，握手成功后加入列表</summary>
    Private Sub AddNotation(sender As Object, e As EventArgs) Handles Button4.Click
        If OpenFileDialog1.ShowDialog() <> DialogResult.OK Then Return

        probeProcess.StartInfo.FileName = OpenFileDialog1.FileName
        TemporarilyTopMost()
        probeProcess.Start()

        If probeProcess.StandardOutput.ReadLine() = "Ordinal Notation Protocol 2" Then
            Dim notationName As String = probeProcess.StandardOutput.ReadLine()
            If Not ListBox1.Items.Contains(notationName) Then
                pluginPaths.Add(OpenFileDialog1.FileName)
                ListBox1.Items.Add(notationName)
            End If
        End If

        probeProcess.CloseMainWindow()
    End Sub

    ''' <summary>「删除序数记号位置」：把选中项从列表和路径集合中一并去掉</summary>
    Private Sub RemoveNotation(sender As Object, e As EventArgs) Handles Button3.Click
        pluginPaths.Remove(ListBox1.SelectedIndex + 1)
        ListBox1.Items.Remove(ListBox1.SelectedItem)
    End Sub

    ''' <summary>
    ''' 选中一个记号系统：启动常驻引擎，初始化序数尺与展开树。
    ''' 引擎启动后先输出两行（握手串 + 记号名），
    ''' 这里丢弃掉。
    ''' </summary>
    Private Sub SelectNotation(sender As Object, e As EventArgs) Handles ListBox1.SelectedIndexChanged
        If ListBox1.SelectedIndex <= -1 Then Return

        If File.Exists(CStr(pluginPaths(ListBox1.SelectedIndex + 1))) Then
            probeProcess.StartInfo.FileName = CStr(pluginPaths(ListBox1.SelectedIndex + 1))
            TemporarilyTopMost()
            probeProcess.Start()

            If probeProcess.StandardOutput.ReadLine() = "Ordinal Notation Protocol 2" Then
                Try
                    engineProcess.CloseMainWindow()
                Catch ex As Exception
                    ' 之前没启动过引擎，忽略
                End Try

                TextBox3.Text = Nothing
                TextBox5.Text = Nothing
                TextBox8.Text = Nothing
                TextBox9.Text = Nothing
                expansionTree.Clear()

                engineProcess.StartInfo.FileName = CStr(pluginPaths(ListBox1.SelectedIndex + 1))
                engineProcess.Start()
                engineProcess.StandardOutput.ReadLine()
                engineProcess.StandardOutput.ReadLine()

                ' —— 展开树的两个初始节点：最上面是 Limit，下面是 0
                expansionTree.AddLast(New TreeNodeInfo With {
                    .Expression = "Limit",
                    .Levels = New Integer(3) {-1, 0, 0, 0},
                    .IsLimit = True})
                expansionTree.AddLast(New TreeNodeInfo With {
                    .Expression = "0",
                    .Levels = New Integer(3) {-1, 0, 0, 0}})

                treeScrollOffset = 0
                treeFirstVisible = expansionTree.First
                viewCenter = 0.5F
                viewSpan = 0.5F

                ' —— 序数尺的三个初始节点。
                ' 根节点夹在常数节点 "0" 与 "Limit" 之间；
                ' ★注意：根节点的邻接数组只有 4 个元素（0~3），
                '   它没有同层邻居。
                rootNode.Adjacent = New RulerNode(3) {
                    New RulerNode With {.Expression = "0"},
                    New RulerNode With {.Expression = "Limit"},
                    lowerNode,
                    upperNode}
                rootNode.Expression = FirstExceeding(rootNode.Adjacent(0).Expression,
                                                      rootNode.Adjacent(1).Expression)
                rootNode.FSIndex = tempIndex

                lowerNode.Adjacent = New RulerNode(5) {
                    rootNode.Adjacent(0), rootNode, Nothing, Nothing, Nothing, upperNode}
                If QueryType(rootNode.Expression) = "3" Then
                    rootNode.IsLimit = True
                    lowerNode.Expression = FirstExceeding(lowerNode.Adjacent(0).Expression,
                                                            lowerNode.Adjacent(1).Expression)
                    lowerNode.FSIndex = tempIndex
                Else
                    lowerNode.Expression = Nothing
                    rootNode.IsLimit = False
                End If
                lowerNode.IsUpperSide = False
                If lowerNode.Expression IsNot Nothing Then
                    lowerNode.IsLimit = (QueryType(lowerNode.Expression) = "3")
                End If

                upperNode.Adjacent = New RulerNode(5) {
                    rootNode, rootNode.Adjacent(1), Nothing, Nothing, lowerNode, Nothing}
                upperNode.FSIndex = rootNode.FSIndex + 1
                upperNode.Expression = GetFSTerm(upperNode.FSIndex, upperNode.Adjacent(1).Expression)
                upperNode.IsUpperSide = True
                If upperNode.Expression IsNot Nothing Then
                    upperNode.IsLimit = (QueryType(upperNode.Expression) = "3")
                End If

                DrawTree()
                DrawRuler()
                engineReady = True
                Button2.Enabled = engineReady
                Button7.Enabled = engineReady
                Button8.Enabled = engineReady
                Button9.Enabled = engineReady
            Else
                ' 握手失败：说明这不是一个 ONP2 插件，直接删掉
                RemoveNotation(Nothing, Nothing)
            End If

            probeProcess.CloseMainWindow()
        Else
            ' 文件已经不在了，删掉
            RemoveNotation(Nothing, Nothing)
        End If
    End Sub

    '==========================================================================
    '  六、序数尺（TabPage3）
    '==========================================================================

    ''' <summary>
    ''' 滚轮缩放序数尺。
    ''' 向下滚 = 拉远（视窗跨度变大），到阈值就切到更粗的一层刻度；
    ''' 向上滚 = 拉近（视窗跨度变小），到阈值就切到更细的一层刻度；
    ''' 节点是按需生成的，
    ''' 所以可以无限缩放下去。
    ''' </summary>
    Private Sub RulerMouseWheel(sender As Object, e As MouseEventArgs) Handles PictureBox1.MouseWheel
        If Not engineReady Then Return

        Dim mouseOffset As Integer = Control.MousePosition.Y - captionOffset - rulerHalfHeight - Me.Top

        If e.Delta < 0 Then
            ' —— 拉远
            viewSpan = CSng(viewSpan / 0.9)
            viewCenter = CSng(viewCenter + viewSpan * mouseOffset / PictureBox1.Height * 0.2)

            If upperNode Is rootNode.Adjacent(3) Then
                ' 还在最顶层，不允许再拉远
                If viewSpan > 0.5 Then viewSpan = 0.5F
            ElseIf viewSpan > 0.25 Then
                ' 换用更粗的一层刻度
                viewSpan = CSng(viewSpan * 0.5)
                If lowerNode.IsUpperSide Then
                    viewCenter = CSng((viewCenter + 0.5) * 0.5)
                    lowerNode = lowerNode.Adjacent(0)
                    upperNode = upperNode.Adjacent(1)
                ElseIf lowerNode.Adjacent(1).IsUpperSide Then
                    viewCenter = CSng((viewCenter + 1) * 0.5)
                    upperNode = lowerNode.Adjacent(1)
                    If upperNode.Adjacent(4) Is Nothing Then CreateSibling(upperNode, False)
                    lowerNode = upperNode.Adjacent(4)
                Else
                    viewCenter = CSng(viewCenter * 0.5)
                    lowerNode = lowerNode.Adjacent(1)
                    If lowerNode.Adjacent(5) Is Nothing Then CreateSibling(lowerNode, True)
                    upperNode = lowerNode.Adjacent(5)
                End If
            End If
        Else
            ' —— 拉近
            viewCenter = CSng(viewCenter - viewSpan * mouseOffset / PictureBox1.Height * 0.2)
            viewSpan = CSng(viewSpan * 0.9)
            If viewSpan < 0.125 Then
                ' 换用更细的一层刻度
                viewSpan *= 2.0F
                viewCenter = CSng(viewCenter * 2.0F - 0.5)
                If lowerNode.Adjacent(3) Is Nothing Then CreateChild(lowerNode, True)
                lowerNode = lowerNode.Adjacent(3)
                If upperNode.Adjacent(2) Is Nothing Then CreateChild(upperNode, False)
                upperNode = upperNode.Adjacent(2)
            End If
        End If

        ' —— 把视窗夹回 [0,1]：越界就把整个视窗挪一格
        If viewCenter < viewSpan Then
            If lowerNode.Adjacent(0) Is rootNode.Adjacent(0) Then
                viewCenter = viewSpan
            Else
                upperNode = lowerNode
                If lowerNode.Adjacent(4) Is Nothing Then CreateSibling(lowerNode, False)
                lowerNode = lowerNode.Adjacent(4)
                viewCenter = CSng(viewCenter + 0.5)
            End If
        ElseIf viewCenter + viewSpan > 1 Then
            If upperNode.Adjacent(1) Is rootNode.Adjacent(1) Then
                viewCenter = 1.0F - viewSpan
            Else
                lowerNode = upperNode
                If upperNode.Adjacent(5) Is Nothing Then CreateSibling(upperNode, True)
                upperNode = upperNode.Adjacent(5)
                viewCenter = CSng(viewCenter - 0.5)
            End If
        End If

        DrawRuler()
    End Sub

    ''' <summary>绘制序数尺（原 Sub1）</summary>
    Private Sub DrawRuler()
        rulerGraphics.Clear(PictureBox1.BackColor)

        tickGap = CInt(Math.Round(CSng(PictureBox1.Height) / viewSpan / 4.0F))
        rulerCenterY = CInt(Math.Round(PictureBox1.Height * (1.0 + (viewCenter - 0.5) / viewSpan) * 0.5))

        ' 正中间画的是「视窗下界节点的上界」
        If lowerNode.Adjacent(1).Expression IsNot Nothing Then
            Dim node As RulerNode = lowerNode.Adjacent(1)
            Dim brush As SolidBrush = If(node.IsLimit, limitBrush, normalBrush)
            rulerGraphics.FillRectangle(brush, 0, rulerCenterY, tickLength, 1)
            rulerGraphics.DrawString(node.Expression, rulerFont, brush, tickLength,
                                     rulerCenterY - textHalfHeight)
        End If

        ' 下半屏：从中心往下递归细分
        If lowerNode.Expression IsNot Nothing Then
            DrawTicks(lowerNode,
                      rulerCenterY,
                      rulerCenterY + tickGap \ 2,
                      rulerCenterY + tickGap,
                      tickGap \ 2)
        End If
        ' 上半屏：从中心往上递归细分
        If upperNode.Expression IsNot Nothing Then
            DrawTicks(upperNode,
                      rulerCenterY - tickGap,
                      rulerCenterY - tickGap \ 2,
                      rulerCenterY,
                      tickGap \ 2)
        End If

        PictureBox1.Image = rulerBitmap
    End Sub

    ''' <summary>
    ''' 递归绘制一段刻度（原 Sub2）。
    ''' 节点画在区间 [topY, bottomY] 的 nodeY 处，
    ''' 两个子节点再各占据一半区间。
    ''' </summary>
    Private Sub DrawTicks(node As RulerNode, topY As Integer, nodeY As Integer,
                          bottomY As Integer, halfGap As Integer)
        If nodeY > 0 AndAlso nodeY < PictureBox1.Height Then
            Dim brush As SolidBrush = If(node.IsLimit, limitBrush, normalBrush)
            rulerGraphics.FillRectangle(brush, 0, nodeY, tickLength, 1)
            If halfGap > rulerFont.Height Then
                rulerGraphics.DrawString(node.Expression, rulerFont, brush, tickLength,
                                         nodeY - textHalfHeight)
            End If
        End If

        ' 太密了就不再往下细分，除非勾选了「序数尺密集刻度」
        If halfGap <= denseTickLimit AndAlso (halfGap <= 0 OrElse Not CheckBox1.Checked) Then Return

        If nodeY < PictureBox1.Height AndAlso bottomY > 0 Then
            If node.Adjacent(2) Is Nothing Then CreateChild(node, False)
            If node.Adjacent(2).Expression IsNot Nothing Then
                halfGap = (bottomY - nodeY) \ 2
                DrawTicks(node.Adjacent(2), nodeY, nodeY + halfGap, bottomY, halfGap)
            End If
        End If

        If topY < PictureBox1.Height AndAlso nodeY > 0 Then
            If node.Adjacent(3) Is Nothing Then CreateChild(node, True)
            halfGap = (nodeY - topY) \ 2
            DrawTicks(node.Adjacent(3), topY, nodeY - halfGap, nodeY, halfGap)
        End If
    End Sub

    ''' <summary>
    ''' 按需生成一个子节点（原 Sub3）：
    ''' 向上=True 生成上子节点(3)，False 生成下子节点(2)。
    ''' 生成后立刻把它接进同层的双向链表。
    ''' </summary>
    Private Sub CreateChild(node As RulerNode, upward As Boolean)
        If upward Then
            node.Adjacent(3) = New RulerNode With {
                .Adjacent = New RulerNode(5) {node, node.Adjacent(1), Nothing, Nothing, Nothing, Nothing},
                .IsUpperSide = True}

            If node.Expression IsNot Nothing Then
                ' 上子节点 = 上界序数基本列的下一项
                node.Adjacent(3).FSIndex = node.FSIndex + 1
                node.Adjacent(3).Expression = GetFSTerm(node.Adjacent(3).FSIndex, node.Adjacent(1).Expression)
                node.Adjacent(3).IsLimit = (QueryType(node.Adjacent(3).Expression) = "3")
            End If

            If node.Adjacent(2) IsNot Nothing Then
                node.Adjacent(3).Adjacent(4) = node.Adjacent(2)
                node.Adjacent(2).Adjacent(5) = node.Adjacent(3)
            End If
            If node.Adjacent(5) IsNot Nothing AndAlso node.Adjacent(5).Adjacent(2) IsNot Nothing Then
                node.Adjacent(3).Adjacent(5) = node.Adjacent(5).Adjacent(2)
                node.Adjacent(5).Adjacent(2).Adjacent(4) = node.Adjacent(3)
            End If
        Else
            node.Adjacent(2) = New RulerNode With {
                .Adjacent = New RulerNode(5) {node.Adjacent(0), node, Nothing, Nothing, Nothing, Nothing}}

            If node.Adjacent(4) IsNot Nothing AndAlso node.Adjacent(4).Adjacent(3) IsNot Nothing Then
                node.Adjacent(2).Adjacent(4) = node.Adjacent(4).Adjacent(3)
                node.Adjacent(4).Adjacent(3).Adjacent(5) = node.Adjacent(2)
            End If
            If node.Adjacent(3) IsNot Nothing Then
                node.Adjacent(2).Adjacent(5) = node.Adjacent(3)
                node.Adjacent(3).Adjacent(4) = node.Adjacent(2)
            End If

            If node.Expression IsNot Nothing AndAlso node.IsLimit Then
                ' 下子节点 = 本节点基本列中
                ' 第一个大于下界的项
                node.Adjacent(2).Expression = FirstExceeding(node.Adjacent(0).Expression, node.Expression)
                node.Adjacent(2).FSIndex = tempIndex
                node.Adjacent(2).IsLimit = (QueryType(node.Adjacent(2).Expression) = "3")
            End If
        End If
    End Sub

    ''' <summary>
    ''' 按需生成一个同层邻居（原 Sub4）：
    ''' 向后=True 生成后一个(5)，False 生成前一个(4)。
    ''' 做法是先走到相邻节点，再让它生成一个子节点——
    ''' 那个子节点就是本节点要的邻居。
    ''' </summary>
    Private Sub CreateSibling(node As RulerNode, forward As Boolean)
        If forward Then
            If node.IsUpperSide Then
                If node.Adjacent(0).Adjacent(5) Is Nothing Then CreateSibling(node.Adjacent(0), False)
                CreateChild(node.Adjacent(0).Adjacent(5), False)
            Else
                CreateChild(node.Adjacent(1), True)
            End If
        ElseIf node.IsUpperSide Then
            CreateChild(node.Adjacent(0), False)
        Else
            If node.Adjacent(1).Adjacent(4) Is Nothing Then CreateSibling(node.Adjacent(1), False)
            CreateChild(node.Adjacent(1).Adjacent(4), True)
        End If
    End Sub

    Private Sub RulerSizeChanged(sender As Object, e As EventArgs) Handles PictureBox1.SizeChanged
        rulerHalfHeight = PictureBox1.Height \ 2
        tickLength = PictureBox1.Height \ 4
        If PictureBox1.Height > 0 Then
            rulerFont = New Font(Panel1.Font.FontFamily, CSng(PictureBox1.Height * 0.03))
            textHalfHeight = rulerFont.Height \ 2
            denseTickLimit = rulerFont.Height * 2 + 1
        End If
        If engineReady Then DrawRuler()
    End Sub

    '==========================================================================
    '  七、展开树（TabPage2）
    '==========================================================================

    ''' <summary>滚轮上下滚动展开树</summary>
    Private Sub TreeMouseWheel(sender As Object, e As MouseEventArgs) Handles PictureBox2.MouseWheel
        If Not engineReady Then Return

        If e.Delta < 0 Then
            If treeFirstVisible.Next IsNot Nothing Then
                treeScrollOffset -= Panel1.Font.Height * 3
                While treeScrollOffset < -Panel1.Font.Height
                    treeFirstVisible = treeFirstVisible.Next
                    If treeFirstVisible.Next Is Nothing Then
                        treeScrollOffset = 0
                    Else
                        treeScrollOffset += Panel1.Font.Height
                    End If
                End While
            End If
        Else
            treeScrollOffset += Panel1.Font.Height * 3
            While treeScrollOffset > 0
                If treeFirstVisible.Previous Is Nothing Then
                    treeScrollOffset = 0
                    Continue While
                End If
                treeScrollOffset -= Panel1.Font.Height
                treeFirstVisible = treeFirstVisible.Previous
            End While
        End If

        DrawTree()
    End Sub

    ''' <summary>
    ''' 点击展开树上的一行：如果该行是极限序数，
    ''' 就在它下面插入一项。若勾选了「展开树连续展开」，
    ''' 则一路展开到底。
    ''' </summary>
    Private Sub TreeClick(sender As Object, e As EventArgs) Handles PictureBox2.Click
        If Not engineReady Then Return

        Dim targetY As Integer = treeScrollOffset
        treeCursor = treeFirstVisible
        Dim mouseY As Integer = Control.MousePosition.Y - captionOffset - Me.Top

        While treeCursor IsNot Nothing
            If targetY > mouseY Then
                ' 命中：游标回退一行，就是被点中的那一行
                treeCursor = treeCursor.Previous
                If Not treeCursor.Value.IsLimit Then Exit While

                ' 取一份结构体副本；Levels 是数组（引用类型），
                ' 通过副本修改其中的元素，等价于修改链表里那个节点。
                Dim current As TreeNodeInfo = treeCursor.Value

                If current.Levels(0) < 0 Then
                    ' 首次展开：在被点节点与它的下一行之间
                    ' 插入「首超项」
                    Dim newNode As TreeNodeInfo
                    Dim a As String = treeCursor.Next.Value.Expression
                    newNode.Expression = FirstExceeding(a, current.Expression)
                    newNode.Levels = New Integer(3) {
                        -1,
                        current.Levels(1) + 1,
                        current.Levels(2),
                        0}
                    newNode.IsLimit = (QueryType(newNode.Expression) = "3")
                    expansionTree.AddAfter(treeCursor, newNode)

                    ' ★原程序把 targetY（一个像素坐标）写进了 Levels(0)，
                    '   于是同一行第二次点击时会走进下面的分支，
                    '   并把这个像素值当成基本列下标
                    '   继续 +1。此处按原样保留。
                    current.Levels(0) = targetY

                    ' 新插入那一行的「连续展开深度」
                    Dim nextRow As TreeNodeInfo = treeCursor.Next.Value
                    Dim afterNext As TreeNodeInfo = treeCursor.Next.Next.Value
                    If current.Levels(3) > afterNext.Levels(3) Then
                        nextRow.Levels(3) = current.Levels(3)
                    Else
                        nextRow.Levels(3) = current.Levels(3) + 1
                    End If
                Else
                    ' 再次展开：取基本列的下一项
                    current.Levels(0) += 1
                    Dim newNode As TreeNodeInfo
                    newNode.Expression = GetFSTerm(current.Levels(0), current.Expression)
                    newNode.Levels = New Integer(3) {
                        -1,
                        current.Levels(1) + 1,
                        treeCursor.Next.Value.Levels(2) + 1,
                        current.Levels(3) + 1}
                    newNode.IsLimit = (QueryType(newNode.Expression) = "3")
                    expansionTree.AddAfter(treeCursor, newNode)
                End If

                If CheckBox4.Checked Then
                    ' 连续展开：一路往下插，直到遇到非极限序数
                    While True
                        treeCursor = treeCursor.Next
                        If Not treeCursor.Value.IsLimit Then Exit While

                        Dim current2 As TreeNodeInfo = treeCursor.Value
                        Dim newNode As TreeNodeInfo
                        Dim a As String = treeCursor.Next.Value.Expression
                        newNode.Expression = FirstExceeding(a, current2.Expression)
                        newNode.Levels = New Integer(3) {
                            -1,
                            current2.Levels(1) + 1,
                            current2.Levels(2),
                            0}
                        newNode.IsLimit = (QueryType(newNode.Expression) = "3")
                        expansionTree.AddAfter(treeCursor, newNode)

                        current2.Levels(0) = targetY
                        Dim nextRow As TreeNodeInfo = treeCursor.Next.Value
                        Dim afterNext As TreeNodeInfo = treeCursor.Next.Next.Value
                        If current2.Levels(3) > afterNext.Levels(3) Then
                            nextRow.Levels(3) = current2.Levels(3)
                        Else
                            nextRow.Levels(3) = current2.Levels(3) + 1
                        End If
                    End While
                End If

                DrawTree()
                Exit While
            End If

            treeCursor = treeCursor.Next
            targetY += Panel1.Font.Height
        End While
    End Sub

    ''' <summary>绘制展开树（原 Sub6）</summary>
    Private Sub DrawTree()
        treeGraphics.Clear(PictureBox2.BackColor)

        Dim drawY As Integer = treeScrollOffset
        treeCursor = treeFirstVisible

        While drawY < PictureBox2.Height AndAlso treeCursor IsNot Nothing
            ' 四种对齐模式决定用哪一层信息做缩进
            If RadioButton4.Checked Then
                indentPixels = 0                                                  ' all
            ElseIf RadioButton3.Checked Then
                indentPixels = Panel1.Font.Height * treeCursor.Value.Levels(1)     ' fundamental sequence
            ElseIf RadioButton5.Checked Then
                indentPixels = Panel1.Font.Height * treeCursor.Value.Levels(2)     ' continuous expansion
            Else
                indentPixels = Panel1.Font.Height * treeCursor.Value.Levels(3)     ' Hyp Cos
            End If

            Dim brush As SolidBrush = If(treeCursor.Value.IsLimit, limitBrush, normalBrush)
            treeGraphics.DrawString(treeCursor.Value.Expression, Panel1.Font, brush,
                                    New Point(indentPixels, drawY))

            drawY += Panel1.Font.Height
            treeCursor = treeCursor.Next
        End While

        PictureBox2.Image = treeBitmap
    End Sub

    Private Sub TreeSizeChanged(sender As Object, e As EventArgs) Handles PictureBox2.SizeChanged
        If engineReady Then DrawTree()
    End Sub

    '==========================================================================
    '  八、杂项页（TabPage1）
    '==========================================================================

    ''' <summary>「展开序数」：输入极限序数 + 序号，输出基本列的那一项</summary>
    Private Sub ExpandOrdinal(sender As Object, e As EventArgs) Handles Button2.Click
        Try
            Dim expr As String = TextBox1.Text
            Dim valid As Boolean = ValidateExpression(expr)
            TextBox1.Text = expr

            If valid Then
                expr = TextBox1.Text
                If QueryType(expr) = "3" Then
                    Dim index As Integer = CInt(TextBox2.Text)
                    TextBox3.Text = GetFSTerm(index, expr)
                    TextBox2.Text = CStr(index)
                Else
                    TextBox3.Text = "表达式不是极限序数"   ' not a limit ordinal
                End If
            Else
                TextBox3.Text = "表达式不正确"             ' invalid expression
            End If
        Catch ex As Exception
            TextBox3.Text = "序号不正确"                   ' invalid index
        End Try
    End Sub

    ''' <summary>「返回序数类型」：极限序数 / 后继序数 / 0</summary>
    Private Sub ShowOrdinalType(sender As Object, e As EventArgs) Handles Button7.Click
        Dim expr As String = TextBox4.Text
        Dim valid As Boolean = ValidateExpression(expr)
        TextBox4.Text = expr

        If valid Then
            expr = TextBox4.Text
            Select Case QueryType(expr)
                Case "3"
                    TextBox5.Text = "极限序数"            ' limit ordinal
                Case Else
                    If TextBox4.Text = "0" Then
                        TextBox5.Text = "0"
                    Else
                        TextBox5.Text = "后继序数"        ' successor ordinal
                    End If
            End Select
        Else
            TextBox5.Text = "表达式不正确"
        End If
    End Sub

    ''' <summary>「大小比较」：把两个表达式比一比</summary>
    Private Sub CompareOrdinals(sender As Object, e As EventArgs) Handles Button8.Click
        Dim expr As String = TextBox6.Text
        Dim validA As Boolean = ValidateExpression(expr)
        TextBox6.Text = expr

        If validA Then
            expr = TextBox7.Text
            Dim validB As Boolean = ValidateExpression(expr)
            TextBox7.Text = expr

            If validB Then
                If TextBox6.Text = TextBox7.Text Then
                    TextBox8.Text = TextBox6.Text & "=" & TextBox7.Text
                    Return
                End If

                Dim a As String = TextBox6.Text
                Dim b As String = TextBox7.Text
                Dim aLessB As Boolean = IsLessThan(a, b)
                TextBox7.Text = b
                TextBox6.Text = a

                If aLessB Then
                    TextBox8.Text = TextBox6.Text & "<" & TextBox7.Text
                Else
                    TextBox8.Text = TextBox6.Text & ">" & TextBox7.Text
                End If
                Return
            End If
        End If

        TextBox8.Text = "表达式不正确"
    End Sub

    ''' <summary>「返回前继序数」</summary>
    Private Sub ShowPredecessor(sender As Object, e As EventArgs) Handles Button9.Click
        Dim expr As String = TextBox10.Text
        Dim valid As Boolean = ValidateExpression(expr)
        TextBox10.Text = expr

        If valid Then
            expr = TextBox10.Text
            If QueryType(expr) = "2" Then
                TextBox9.Text = GetPredecessor(expr)
                TextBox10.Text = expr
            Else
                TextBox9.Text = "表达式不是后继序数"      ' not a successor ordinal
            End If
        Else
            TextBox9.Text = "表达式不正确"
        End If
    End Sub

    '==========================================================================
    '  九、设置页（TabPage4）
    '==========================================================================

    ''' <summary>所有勾选类设置项：勾上变绿，取消变红（原 Sub5）</summary>
    Private Sub OptionCheckedChanged(sender As Object, e As EventArgs) _
        Handles CheckBox1.CheckedChanged, CheckBox4.CheckedChanged,
                RadioButton3.CheckedChanged, RadioButton4.CheckedChanged,
                RadioButton5.CheckedChanged, RadioButton6.CheckedChanged
        Dim ctl As Control = DirectCast(sender, Control)
        Dim checked As Boolean
        If TypeOf ctl Is CheckBox Then
            checked = DirectCast(ctl, CheckBox).Checked
        Else
            checked = DirectCast(ctl, RadioButton).Checked
        End If
        ctl.ForeColor = If(checked, Color.Lime, Color.Red)
    End Sub

    ''' <summary>切换「展开树的对齐模式」（原 Sub7）</summary>
    Private Sub AlignModeChanged(sender As Object, e As EventArgs) _
        Handles RadioButton3.CheckedChanged, RadioButton4.CheckedChanged,
                RadioButton5.CheckedChanged, RadioButton6.CheckedChanged
        If engineReady AndAlso DirectCast(sender, RadioButton).Checked Then DrawTree()
    End Sub

    ''' <summary>三个颜色按钮：弹出取色对话框（原 Sub9）</summary>
    Private Sub PickColor(sender As Object, e As EventArgs) Handles Button1.Click, Button5.Click, Button6.Click
        If ColorDialog1.ShowDialog() = DialogResult.OK Then
            DirectCast(sender, Button).BackColor = ColorDialog1.Color
        End If
    End Sub

    Private Sub NormalColorChanged(sender As Object, e As EventArgs) Handles Button1.BackColorChanged
        normalBrush = New SolidBrush(Button1.BackColor)
        RedrawAll()
    End Sub

    Private Sub LimitColorChanged(sender As Object, e As EventArgs) Handles Button5.BackColorChanged
        limitBrush = New SolidBrush(Button5.BackColor)
        RedrawAll()
    End Sub

    Private Sub BgColorChanged(sender As Object, e As EventArgs) Handles Button6.BackColorChanged
        PictureBox1.BackColor = Button6.BackColor
        PictureBox2.BackColor = Button6.BackColor
        RedrawAll()
    End Sub

    Private Sub DenseTicksChanged(sender As Object, e As EventArgs) Handles CheckBox1.CheckedChanged
        If engineReady Then DrawRuler()
    End Sub

    ''' <summary>两个画布一起重绘（原 Sub12）</summary>
    Private Sub RedrawAll()
        If engineReady Then
            DrawTree()
            DrawRuler()
        End If
    End Sub

    '==========================================================================
    '  十、杂项辅助
    '==========================================================================

    ''' <summary>
    ''' 启动外挂进程前把本窗口顶到最前，
    ''' 1 秒后自动取消（原 Sub8 + Timer1）。目的是防止子进程抢走焦点、
    ''' 弹出控制台窗口挡住界面。
    ''' </summary>
    Private Sub TemporarilyTopMost()
        Me.TopMost = True
        Timer1.Start()
    End Sub

    Private Sub TopMostTimer_Tick(sender As Object, e As EventArgs) Handles Timer1.Tick
        Timer1.Stop()
        Me.TopMost = False
    End Sub

    ''' <summary>
    ''' 算出鼠标屏幕坐标 → 客户区坐标
    ''' 需要减掉的偏移（原 Panel1_SizeChanged）。
    ''' </summary>
    Private Sub MainPanelSizeChanged(sender As Object, e As EventArgs) Handles Panel1.SizeChanged
        captionOffset = Button2.Height + SystemInformation.CaptionHeight
        If WindowState = FormWindowState.Normal Then
            captionOffset = CInt(Math.Round(captionOffset +
                (Me.Height - Panel1.Height - SystemInformation.CaptionHeight) * 0.5))
        End If
    End Sub

    Private Sub ReadColor(ByRef target As Color)
        FileSystem.Input(1, colorBuffer(0))
        FileSystem.Input(1, colorBuffer(1))
        FileSystem.Input(1, colorBuffer(2))
        target = Color.FromArgb(colorBuffer(0), colorBuffer(1), colorBuffer(2))
    End Sub

    Private Sub WriteColor(ByVal target As Color)
        FileSystem.Print(1, target.R)
        FileSystem.Print(1, target.G)
        FileSystem.Print(1, target.B)
    End Sub

    '==========================================================================
    '  十一、配置的读写（启动目录下的隐藏文件「1」）
    '==========================================================================

    Private Sub OrdinalInterface_Load() Handles MyBase.Load
        MainPanelSizeChanged(Nothing, Nothing)

        engineProcess.StartInfo.RedirectStandardInput = True
        engineProcess.StartInfo.RedirectStandardOutput = True
        engineProcess.StartInfo.UseShellExecute = False
        probeProcess.StartInfo.RedirectStandardInput = True
        probeProcess.StartInfo.RedirectStandardOutput = True
        probeProcess.StartInfo.UseShellExecute = False

        Dim configPath As String = Application.StartupPath & "\1"
        If Not File.Exists(configPath) Then Return

        FileSystem.FileOpen(1, configPath, OpenMode.Input)
        FileSystem.Input(1, tempIndex)

        If tempIndex = 6 Then   ' config file version
            ' —— 已保存的记号引擎列表
            FileSystem.Input(1, tempIndex)
            savedPaths = New String(tempIndex) {}
            savedNames = New String(tempIndex) {}
            For i As Integer = 0 To tempIndex
                FileSystem.Input(1, savedPaths(i))
            Next
            For i As Integer = 0 To tempIndex
                FileSystem.Input(1, savedNames(i))
            Next

            ' —— 三个自定义颜色
            Dim clr As Color = Button1.BackColor
            ReadColor(clr) : Button1.BackColor = clr
            clr = Button5.BackColor
            ReadColor(clr) : Button5.BackColor = clr
            clr = Button6.BackColor
            ReadColor(clr) : Button6.BackColor = clr

            ' —— 对齐模式与两个开关
            FileSystem.Input(1, tempIndex)
            Dim flag As Boolean = CheckBox4.Checked
            FileSystem.Input(1, flag) : CheckBox4.Checked = flag
            flag = CheckBox1.Checked
            FileSystem.Input(1, flag) : CheckBox1.Checked = flag

            Select Case tempIndex
                Case 1 : RadioButton4.Checked = True      ' all
                Case 2 : RadioButton3.Checked = True      ' fundamental sequence
                Case 3 : RadioButton5.Checked = True      ' continuous expansion
                Case Else : RadioButton6.Checked = True   ' Hyp Cos
            End Select

            ' —— 只保留文件还在的引擎
            For i As Integer = 0 To savedPaths.Length - 1
                If File.Exists(savedPaths(i)) Then
                    pluginPaths.Add(savedPaths(i))
                    ListBox1.Items.Add(savedNames(i))
                End If
            Next
        End If

        FileSystem.FileClose(1)
    End Sub

    Private Sub OrdinalInterface_Closed() Handles MyBase.Closed
        Try
            engineProcess.CloseMainWindow()
        Catch ex As Exception
            ' 引擎没启动过，忽略
        End Try

        tempIndex = pluginPaths.Count - 1
        savedPaths = New String(tempIndex) {}
        savedNames = New String(tempIndex) {}
        For i As Integer = 0 To tempIndex
            savedPaths(i) = CStr(pluginPaths(i + 1))
            savedNames(i) = CStr(ListBox1.Items(i))
        Next

        Dim configPath As String = Application.StartupPath & "\1"
        File.Delete(configPath)
        FileSystem.FileOpen(1, configPath, OpenMode.Output)
        File.SetAttributes(configPath, FileAttributes.Hidden)

        FileSystem.Print(1, 6)              ' config file version
        FileSystem.Print(1, tempIndex)      ' engine count - 1
        For Each path As String In savedPaths
            FileSystem.PrintLine(1, path)
        Next
        For Each name As String In savedNames
            FileSystem.PrintLine(1, name)
        Next

        Dim clr As Color = Button1.BackColor
        WriteColor(clr) : Button1.BackColor = clr
        clr = Button5.BackColor
        WriteColor(clr) : Button5.BackColor = clr
        clr = Button6.BackColor
        WriteColor(clr) : Button6.BackColor = clr

        If RadioButton4.Checked Then
            FileSystem.Print(1, 1)
        ElseIf RadioButton3.Checked Then
            FileSystem.Print(1, 2)
        ElseIf RadioButton5.Checked Then
            FileSystem.Print(1, 3)
        Else
            FileSystem.Print(1, 4)
        End If
        FileSystem.PrintLine(1, CheckBox4.Checked)
        FileSystem.PrintLine(1, CheckBox1.Checked)

        FileSystem.FileClose(1)
    End Sub

End Class
