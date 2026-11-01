




#include <iostream>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#define U 10
#define W 10000
#include <math.h>
#define V 300
#define L 20

using namespace std;
int fn[V],x=0,y=0;;

int max2(int i1,int i2)
{
    if(i1<i2) return(i2);
    else return(i1);
}
void arout(int a[],int x)
{
    int i;
    cout<<'(';
for(i=0;i<x;i++)
    {
    if(i!=x-1) cout<<a[i]<<',';
    else cout<<a[i]<<')';
    }
}
int *txar(char s[40])
{
    int l,i,j,ap[L]={0},*pap;
    l=strlen(s);
    for(i=0,j=0;j<l;i++)
        {ap[i]=atoi(s+j);j+=max2((int)log10(ap[i]*100+1),2);}
    pap=ap;
return(pap);
}
int **txma(char s[W])
{
    int i,j,**pm,*p[V],x0=0,y0=0,o[V][L]={0},*pi;
    char s2[W],*po,sr[40]={'\0'};
    strcpy(s2,s);
    for(i=0;i<V;i++)
        {
        for(po=strstr(s2,"(")+1,j=0;po<strstr(s2,")");po++,j++)
            sr[j]=*po;
        for(pi=txar(sr),j=0;j<L;pi++,j++)
            o[i][j]=*pi;
        p[i]=o[i];
        if(x==1) {for(y=L-1;y>0;y--)if(o[1][y]!=0)break;y+=2;}
        x++;
        for(j=0;j<40;j++) sr[j]='\0';
        *strstr(s2,"(")=',';
        if(*(strstr(s2,")")+1)=='\0') break;
        *strstr(s2,")")=',';
        }
    for(i=0;i<V;i++)
        p[i]=o[i];
    pm=p;

return(pm);
}
void maout(int **a,int x,int y)
{
    int i;
    for(i=0;i<x;i++)
        arout(*(a+i),y);
        cout<<endl;
}
int compa(int *aa,int *bb)
{
    int i;
    for(i=y-1;i>=0;i--)
    {
    if (*(aa+i)<*(bb+i)) return(-1);
    if (*(aa+i)>*(bb+i)) return 1;
    }
return 0;
}



void limit(char n[U])
{
    int c[V][L]={0},**fc,*fcp[V],i;
    c[1][atoi(n)-1]=1;
    for(i=0;i<V;i++)
        fcp[i]=c[i];
    fc=fcp;
    if(atoi(n)==0) {cout<<"(0)"<<endl;}else
    maout(fc,2,atoi(n));
}
void type0(char a[W])
{
    if(strlen(a)<3) cout<<'1'<<endl;
    else{
    int **c,i,fl=1;
    c=txma(a);
    for(i=0;i<y;i++)
        if(*(*(c+x-1)+i)!=0) fl=0;
    if(fl==1) cout<<'2'<<endl;
        else cout<<'3'<<endl;
}}
void precursor(char a[W])
{
    int **c,i;
    c=txma(a);
    if(x==1) cout<<'0'<<endl;
    else maout(c,x-1,y-1);
}
void expand(char n[U],char a[W])
{
    int **c,(*cc)[L],i,j,m,t;
    void Ex(int a[V][L],int n);
    m=atoi(n);
    c=txma(a);
    for(i=0;i<x;i++)
        for(j=0;j<y;j++) *(*(cc+i)+j)=*(*(c+i)+j);
    if(m==0) maout(c,x-1,y-1);
    else {
    Ex(cc,m);
    for(i=0;i<x;i++)
            {
            cout<<'(';
            for(j=0;j<y-1;j++)
                {
                if(j==y-2) cout<<*(*(cc+i)+j)<<')';
                else cout<<*(*(cc+i)+j)<<',';
                }
            }
    cout<<endl;
    }
}

void compare0(char a[W],char b[W])
{
    if(strlen(b)<3) cout<<'1'<<endl;
        else if(strlen(a)<3) cout<<'2'<<endl;
        else{
    int **c,*d,i,j,x2[V][L]={0},xp,zp;
    c=txma(a);
    for(i=0;i<V;i++)
        for(j=0;j<L;j++)
            x2[i][j]=*(*(c+i)+j);
    xp=x;
    x=0;
    c=txma(b);
    for(i=0,d=x2[0];compa(*(c+i),d)==0&&i<max2(x,xp);i++,d=x2[i]);
    zp=compa(*(c+i),d);
    if(zp==-1||(zp==0&&xp>=x)) cout<<'1'<<endl;
    else cout<<'2'<<endl;
}
}

int main()
{
puts("Ordinal Notation Protocol 2");;
void name0();name0();
do{
x=0;y=0;
char c[W]={'\0'};
string ss,n,a,b,cs;
getline(cin,ss);
    if(ss.empty()) break;  /* 唯一添加的退出逻辑：读到空行则退出循环 */
    switch(ss[0])
        {
        case '1' :{getline(cin,n);limit((char*)n.c_str());} break;
        case '2' :{getline(cin,a);type0((char*)a.c_str());} break;
        case '3' :{getline(cin,a);precursor((char*)a.c_str());} break;
        case '4' :{getline(cin,n);getline(cin,a);expand((char*)n.c_str(),(char*)a.c_str());} break;
        case '5' :{getline(cin,a);getline(cin,b);compare0((char*)a.c_str(),(char*)b.c_str());}
        }

}while(1);
return 0;
}

void name0()
{
puts("Linear Eternally Lifting Sequence");
}

int* par1(int *b)
{
    int *p,z=0;
    for(int i=0;i<y;i++) z+=*(b+i);
    if(z==0) return b;

    for(p=b;compa(p,b)>=0;p-=L);
    return(p);
}

void Ex(int a[V][L],int n)
{
int diff[V][L]={0},*b,delt[L]={0},l,ym=0;
for(int i=0;i<x;i++)
    for(int j=y-1;j>=0;j--)
    {
    if(a[i][j]==0) diff[i][j]=0;
    else diff[i][j]=a[i][j]-*(par1(a[i])+j);
    if(diff[i][j]!=0) {for(int k=j-1;k>=0;k--) diff[i][k]=a[i][k];break;}
    }

int natu[L]={0},*natun;natu[1]=1;natun=natu;
if(diff[x-1][0]==1&&(compa(natun,diff[x-1])==1||y==1)) b=par1(a[x-1]);
else for(b=a[x-1];compa(diff[x-1],diff[(b-a[0])/L])<=0;b=par1(b)) {if(par1(b)==b) break;}
l=(a[x-1]-b)/L;

for(int i=y-1;i>=0;i--) ym+=a[1][i]; if(ym==1&&x==2&&y>2) y-=1;

int n1,k2=0,k3=-1,nfa;nfa=n;
if(a[x-1][0]!=0) {
    diff[x-1][0]-=1;
    for(int j=0;;j++) if(a[x-1][j]!=0) {a[x-1][j]-=1;break;}
    n1=n;}
else {
    for(k2=0;a[x-1][k2]==0;k2++);a[x-1][k2-1]+=*(par1(a[x-1])+k2-1)+n;
    a[x-1][k2]-=1;
    for(k2=0;diff[x-1][k2]==0;k2++);diff[x-1][k2]-=1;diff[x-1][k2-1]=n;
    n1=1;}
for(int i=x;i<x+n1*l+1;i++)
    {   int al=-1,au=-1,lf=0,j2=-1,k=-1;
        for(int j=y-1;j>=0;j--)
        {
            if(k3==-1&&diff[x-1][j]!=0) k3=j;
            if(j2==-1&&diff[i-l][j]!=0) j2=j;
            if(j2!=-1&&j2>=k2-1) lf=diff[i-l][j]/(diff[x-1-l][j]+1);
            if(k==-1&&a[i-l][j]!=0) k=j;
            if(k<=k3&&k>-1) {lf=0;break;}
        }
        for(int j=y-1;j>=0;j--)
            {
            if(lf>0&&i<x+l-1)
                {
                j>=al?diff[i][j]=diff[i-l][j]+diff[x-1][j]*lf:diff[i][j]=diff[x-1][j]*lf;
                if(diff[x-1][j]!=0&&al==-1) al=j;
                }
            else diff[i][j]=diff[i-l][j];

            j>=au?a[i][j]=*(par1(a[i-l])+l*L+j)+diff[i][j]:a[i][j]=diff[i][j];
            if(diff[i][j]!=0&&au==-1) au=j;

        }}
x=x+n1*l-1;
}







    