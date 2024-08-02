/// <reference types="react-native/types/modules/codegen" />
import type { ViewProps } from './utils';
import { NumberProp } from '../lib/extract/types';
import type { UnsafeMixed } from './codegenUtils';
import { Float, WithDefault } from 'react-native/Libraries/Types/CodegenTypes';
type ColorMatrixType = 'matrix' | 'saturate' | 'hueRotate' | 'luminanceToAlpha';
interface FilterPrimitiveCommonProps {
    x?: UnsafeMixed<NumberProp>;
    y?: UnsafeMixed<NumberProp>;
    width?: UnsafeMixed<NumberProp>;
    height?: UnsafeMixed<NumberProp>;
    result?: string;
}
export interface NativeProps extends ViewProps, FilterPrimitiveCommonProps {
    in1?: string;
    type?: WithDefault<ColorMatrixType, 'matrix'>;
    values?: ReadonlyArray<Float>;
}
declare const _default: import("react-native/Libraries/Utilities/codegenNativeComponent").NativeComponentType<NativeProps>;
export default _default;
//# sourceMappingURL=FeColorMatrixNativeComponent.d.ts.map