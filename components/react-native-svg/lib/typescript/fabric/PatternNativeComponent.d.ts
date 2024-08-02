/// <reference types="react-native/types/modules/codegen" />
import type { ColorValue } from 'react-native';
import type { Float, Int32, WithDefault } from 'react-native/Libraries/Types/CodegenTypes';
import type { ViewProps } from './utils';
import type { UnsafeMixed } from './codegenUtils';
import { FontObject, NumberProp } from '../lib/extract/types';
interface SvgNodeCommonProps {
    name?: string;
    opacity?: WithDefault<Float, 1.0>;
    matrix?: ReadonlyArray<Float> | null;
    mask?: string;
    markerStart?: string;
    markerMid?: string;
    markerEnd?: string;
    clipPath?: string;
    clipRule?: WithDefault<Int32, 0>;
    responsible?: boolean;
    display?: string;
    pointerEvents?: string;
}
type ColorStruct = Readonly<{
    type?: WithDefault<Int32, -1>;
    payload?: ColorValue;
    brushRef?: string;
}>;
interface SvgRenderableCommonProps {
    fill?: ColorStruct;
    fillOpacity?: WithDefault<Float, 1.0>;
    fillRule?: WithDefault<Int32, 1>;
    stroke?: ColorStruct;
    strokeOpacity?: WithDefault<Float, 1.0>;
    strokeWidth?: UnsafeMixed<NumberProp>;
    strokeLinecap?: WithDefault<Int32, 0>;
    strokeLinejoin?: WithDefault<Int32, 0>;
    strokeDasharray?: UnsafeMixed<ReadonlyArray<NumberProp> | NumberProp>;
    strokeDashoffset?: Float;
    strokeMiterlimit?: Float;
    vectorEffect?: WithDefault<Int32, 0>;
    propList?: ReadonlyArray<string>;
    filter?: string;
}
interface SvgGroupCommonProps {
    fontSize?: UnsafeMixed<NumberProp>;
    fontWeight?: UnsafeMixed<NumberProp>;
    font?: UnsafeMixed<FontObject>;
}
interface NativeProps extends ViewProps, SvgNodeCommonProps, SvgRenderableCommonProps, SvgGroupCommonProps {
    x?: UnsafeMixed<NumberProp>;
    y?: UnsafeMixed<NumberProp>;
    height?: UnsafeMixed<NumberProp>;
    width?: UnsafeMixed<NumberProp>;
    patternUnits?: Int32;
    patternContentUnits?: Int32;
    patternTransform?: ReadonlyArray<Float> | null;
    minX?: Float;
    minY?: Float;
    vbWidth?: Float;
    vbHeight?: Float;
    align?: string;
    meetOrSlice?: Int32;
}
declare const _default: import("react-native/Libraries/Utilities/codegenNativeComponent").NativeComponentType<NativeProps>;
export default _default;
//# sourceMappingURL=PatternNativeComponent.d.ts.map