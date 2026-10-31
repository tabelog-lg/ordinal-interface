/**
 * 杂项页（TabPage1）—— 四个独立的查询动作。
 *
 * 界面文案沿用原程序原文：表达式不正确 / 序号不正确 / 表达式不是极限序数 /
 * 表达式不是后继序数 / 极限序数 / 后继序数。
 */

import { engine } from '../engine/host';
import { LIMIT } from '../engine/types';
import { $ } from './dom';

/** engineReady 为 false 时四个按钮都禁用 */
export function setMiscEnabled(ready: boolean): void {
  for (const id of ['btn2', 'btn7', 'btn8', 'btn9']) {
    ($(id) as HTMLButtonElement).disabled = !ready;
  }
}

export function clearMiscResults(): void {
  for (const id of ['tb3', 'tb5', 'tb8', 'tb9']) {
    $<HTMLInputElement>(id).value = '';
  }
}

/** 包一层：引擎抛错时把消息放进结果框，而不是让整个页面挂掉 */
function guard(outId: string, fn: () => void): void {
  try {
    fn();
  } catch (err) {
    $<HTMLInputElement>(outId).value = (err as Error).message;
  }
}

export function initMisc(): void {
  const tb1 = $<HTMLInputElement>('tb1');
  const tb2 = $<HTMLInputElement>('tb2');
  const tb3 = $<HTMLInputElement>('tb3');
  const tb4 = $<HTMLInputElement>('tb4');
  const tb5 = $<HTMLInputElement>('tb5');
  const tb6 = $<HTMLInputElement>('tb6');
  const tb7 = $<HTMLInputElement>('tb7');
  const tb8 = $<HTMLInputElement>('tb8');
  const tb9 = $<HTMLInputElement>('tb9');
  const tb10 = $<HTMLInputElement>('tb10');

  /** 校验并回写输入框（原程序每次都把表达式原样写回） */
  const check = (input: HTMLInputElement): boolean => {
    input.value = input.value.trim();
    return engine.validate(input.value);
  };

  // 展开序数
  $('btn2').addEventListener('click', () =>
    guard('tb3', () => {
      if (!check(tb1)) {
        tb3.value = '表达式不正确';
        return;
      }
      if (engine.queryType(tb1.value) === '3') {
        const index = parseInt(tb2.value, 10);
        if (!Number.isFinite(index)) throw new Error('序号不正确');
        tb3.value = engine.getFSTerm(index, tb1.value);
        tb2.value = String(index);
      } else {
        tb3.value = '表达式不是极限序数';
      }
    }),
  );

  // 返回序数类型
  $('btn7').addEventListener('click', () =>
    guard('tb5', () => {
      if (!check(tb4)) {
        tb5.value = '表达式不正确';
        return;
      }
      if (engine.queryType(tb4.value) === '3') tb5.value = '极限序数';
      else if (tb4.value === '0') tb5.value = '0';
      else tb5.value = '后继序数';
    }),
  );

  // 大小比较
  $('btn8').addEventListener('click', () =>
    guard('tb8', () => {
      const okA = check(tb6);
      if (!okA) {
        tb8.value = '表达式不正确';
        return;
      }
      const okB = check(tb7);
      if (!okB) {
        tb8.value = '表达式不正确';
        return;
      }
      if (tb6.value === tb7.value) {
        tb8.value = `${tb6.value}=${tb7.value}`;
        return;
      }
      tb8.value = engine.isLessThan(tb6.value, tb7.value)
        ? `${tb6.value}<${tb7.value}`
        : `${tb6.value}>${tb7.value}`;
    }),
  );

  // 返回前继序数
  $('btn9').addEventListener('click', () =>
    guard('tb9', () => {
      if (!check(tb10)) {
        tb9.value = '表达式不正确';
        return;
      }
      if (engine.queryType(tb10.value) === '2') tb9.value = engine.getPredecessor(tb10.value);
      else tb9.value = '表达式不是后继序数';
    }),
  );

  // 快捷填入最大序数
  for (const el of [tb4, tb10]) {
    el.placeholder = LIMIT;
  }
}
