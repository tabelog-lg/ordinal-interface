# Ordinal Notation Protocol 2 —— 复原版构建脚本
#   make          构建全部 30 个可执行（输出到 bin/）
#   make bin/xxx  只构建一个
CXX      ?= g++
CXXFLAGS ?= -O2 -std=c++17 -Wall
SRC       = $(wildcard notations/*.cpp)
EXE       = $(patsubst notations/%.cpp,bin/%,$(SRC))

all: $(EXE)

bin/%: notations/%.cpp main.cpp common.h
	@mkdir -p bin
	$(CXX) $(CXXFLAGS) -o $@ main.cpp $<

clean:
	rm -rf bin

.PHONY: all clean
