/**
 * 31 个 ONP2 记号的注册表。
 *
 * 每个记号都实现 src/types.ts 里的 ONP2Plugin 接口（五个纯函数），
 * 可以直接交给序数界面网页版的宿主（EngineHost）加载。
 */

import type { ONP2Plugin } from './types';

import { bashicuMatrix } from './notations/bashicu_matrix';
import { bm41 } from './notations/bm41';
import { bmsRowExtend } from './notations/bms_row_extend';
import { bmsStronf } from './notations/bms_stronf';
import { bmsUpgradissimo } from './notations/bms_upgradissimo';
import { coprime } from './notations/coprime';
import { hiun } from './notations/hiun';
import { kpHydra } from './notations/kp_hydra';
import { lels } from './notations/lels';
import { lprss } from './notations/lprss';
import { mfss } from './notations/mfss';
import { parentedBms } from './notations/parented_bms';
import { ppm } from './notations/ppm';
import { ppm00t } from './notations/ppm00t';
import { ppm3 } from './notations/ppm3';
import { pps2 } from './notations/pps2';
import { pps3 } from './notations/pps3';
import { pps4 } from './notations/pps4';
import { pps4ExtremelyWeak } from './notations/pps4_extremely_weak';
import { pps4Second } from './notations/pps4_second';
import { pps4Third } from './notations/pps4_third';
import { pps4Weak } from './notations/pps4_weak';
import { pps4V2 } from './notations/pps4_v2';
import { prssParented } from './notations/prss_parented';
import { pssHydra } from './notations/pss_hydra';
import { remainderRetention } from './notations/remainder_retention';
import { residueClass } from './notations/residue_class';
import { simplifiedMinus2y } from './notations/simplified_minus2y';
import { stos } from './notations/stos';
import { zeroY } from './notations/zero_y';
import { zeroYSuperNonLifting } from './notations/zero_y_super_non_lifting';

/** id -> 插件。id 与复原版 C++ 的 notations/*.cpp 同名 */
export const NOTATIONS: Record<string, ONP2Plugin> = {
  bashicu_matrix: bashicuMatrix,
  bm41: bm41,
  bms_row_extend: bmsRowExtend,
  bms_stronf: bmsStronf,
  bms_upgradissimo: bmsUpgradissimo,
  coprime: coprime,
  hiun: hiun,
  kp_hydra: kpHydra,
  lels: lels,
  lprss: lprss,
  mfss: mfss,
  parented_bms: parentedBms,
  ppm: ppm,
  ppm00t: ppm00t,
  ppm3: ppm3,
  pps2: pps2,
  pps3: pps3,
  pps4: pps4,
  pps4_extremely_weak: pps4ExtremelyWeak,
  pps4_second: pps4Second,
  pps4_third: pps4Third,
  pps4_weak: pps4Weak,
  pps4_v2: pps4V2,
  prss_parented: prssParented,
  pss_hydra: pssHydra,
  remainder_retention: remainderRetention,
  residue_class: residueClass,
  simplified_minus2y: simplifiedMinus2y,
  stos: stos,
  zero_y: zeroY,
  zero_y_super_non_lifting: zeroYSuperNonLifting,
};

/** 数组形式（顺序即列表顺序） */
export const notationList: ONP2Plugin[] = Object.values(NOTATIONS);

export { LIMIT, ZERO, resolvePlugin } from './types';
export type { ONP2Plugin, TypeCode, PluginModule } from './types';
